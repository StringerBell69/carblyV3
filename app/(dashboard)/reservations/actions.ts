'use server';

import { db } from '@/lib/db';
import { reservations, vehicles, customers } from '@/drizzle/schema';
import { getCurrentTeamId } from '@/lib/session';
import { eq, and, or, lte, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateRandomToken, calculateRentalPrice } from '@/lib/utils';
import { sendReservationPaymentLink } from '@/lib/resend';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getReservations(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const reservationsList = await db.query.reservations.findMany({
      where: and(
        eq(reservations.teamId, teamId),
        filters?.status ? eq(reservations.status, filters.status as any) : undefined,
        filters?.startDate ? gte(reservations.startDate, filters.startDate) : undefined,
        filters?.endDate ? lte(reservations.endDate, filters.endDate) : undefined
      ),
      orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
      with: {
        vehicle: true,
        customer: true,
      },
    });

    return { reservations: reservationsList };
  } catch (error) {
    console.error('[getReservations]', error);
    return { error: 'Failed to fetch reservations' };
  }
}

export async function getReservation(id: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, id),
        eq(reservations.teamId, teamId)
      ),
      with: {
        vehicle: true,
        customer: true,
        payments: true,
        contracts: true,
      },
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    return { reservation };
  } catch (error) {
    console.error('[getReservation]', error);
    return { error: 'Failed to fetch reservation' };
  }
}

export async function checkVehicleAvailability(data: {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  excludeReservationId?: string;
}) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Check for overlapping reservations
    const overlappingReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.vehicleId, data.vehicleId),
        eq(reservations.teamId, teamId),
        or(
          eq(reservations.status, 'paid'),
          eq(reservations.status, 'confirmed'),
          eq(reservations.status, 'in_progress')
        ),
        // Check if dates overlap
        or(
          and(
            lte(reservations.startDate, data.endDate),
            gte(reservations.endDate, data.startDate)
          )
        ),
        data.excludeReservationId
          ? eq(reservations.id, data.excludeReservationId)
          : undefined
      ),
    });

    const isAvailable = overlappingReservations.length === 0;

    return { isAvailable, conflicts: overlappingReservations };
  } catch (error) {
    console.error('[checkVehicleAvailability]', error);
    return { error: 'Failed to check availability' };
  }
}

export async function createReservation(data: {
  vehicleId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  depositAmount?: string;
  includeInsurance: boolean;
  insuranceAmount?: string;
  collectCautionOnline: boolean;
  cautionAmount?: string;
  internalNotes?: string;
}) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get vehicle
    const vehicle = await db.query.vehicles.findFirst({
      where: and(
        eq(vehicles.id, data.vehicleId),
        eq(vehicles.teamId, teamId)
      ),
    });

    if (!vehicle) {
      return { error: 'Vehicle not found' };
    }

    // Check availability
    const availabilityCheck = await checkVehicleAvailability({
      vehicleId: data.vehicleId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    if (availabilityCheck.error || !availabilityCheck.isAvailable) {
      return { error: 'Vehicle not available for these dates' };
    }

    // Calculate total amount
    const totalAmount = calculateRentalPrice({
      dailyRate: parseFloat(vehicle.dailyRate),
      startDate: data.startDate,
      endDate: data.endDate,
      depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : undefined,
      insuranceAmount: data.includeInsurance && data.insuranceAmount
        ? parseFloat(data.insuranceAmount)
        : undefined,
    });

    // Generate magic link token
    const magicLinkToken = generateRandomToken();

    // Create reservation
    const [reservation] = await db
      .insert(reservations)
      .values({
        teamId,
        vehicleId: data.vehicleId,
        customerId: data.customerId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'pending_payment',
        totalAmount: totalAmount.toString(),
        depositAmount: data.depositAmount,
        includeInsurance: data.includeInsurance,
        insuranceAmount: data.insuranceAmount,
        collectCautionOnline: data.collectCautionOnline,
        cautionAmount: data.cautionAmount,
        magicLinkToken,
        internalNotes: data.internalNotes,
      })
      .returning();

    // Get customer for email
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, data.customerId),
    });

    if (!customer) {
      return { error: 'Customer not found' };
    }

    // Send email with magic link
    const magicLink = `${process.env.NEXT_PUBLIC_URL}/reservation/${magicLinkToken}`;
    await sendReservationPaymentLink({
      to: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      startDate: data.startDate,
      endDate: data.endDate,
      amount: totalAmount,
      magicLink,
    });

    revalidatePath('/reservations');

    return { reservation };
  } catch (error) {
    console.error('[createReservation]', error);
    return { error: 'Failed to create reservation' };
  }
}

export async function updateReservationStatus(
  id: string,
  status: 'paid' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const [reservation] = await db
      .update(reservations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reservations.id, id),
          eq(reservations.teamId, teamId)
        )
      )
      .returning();

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    // Update vehicle status if needed
    if (status === 'in_progress') {
      await db
        .update(vehicles)
        .set({ status: 'rented' })
        .where(eq(vehicles.id, reservation.vehicleId));
    } else if (status === 'completed' || status === 'cancelled') {
      await db
        .update(vehicles)
        .set({ status: 'available' })
        .where(eq(vehicles.id, reservation.vehicleId));
    }

    revalidatePath('/reservations');
    revalidatePath(`/reservations/${id}`);

    return { reservation };
  } catch (error) {
    console.error('[updateReservationStatus]', error);
    return { error: 'Failed to update reservation status' };
  }
}

export async function searchCustomers(query: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const customersList = await db.query.customers.findMany({
      where: or(
        eq(customers.email, query.toLowerCase()),
        eq(customers.phone, query)
      ),
      limit: 10,
    });

    return { customers: customersList };
  } catch (error) {
    console.error('[searchCustomers]', error);
    return { error: 'Failed to search customers' };
  }
}

export async function createCustomer(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Check if customer exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, data.email.toLowerCase()),
    });

    if (existingCustomer) {
      return { error: 'Customer already exists' };
    }

    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      })
      .returning();

    return { customer };
  } catch (error) {
    console.error('[createCustomer]', error);
    return { error: 'Failed to create customer' };
  }
}
