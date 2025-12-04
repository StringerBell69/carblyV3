'use server';

import { db } from '@/lib/db';
import { reservations, vehicles, customers, payments } from '@/drizzle/schema';
import { getCurrentTeamId, getCurrentOrganizationId } from '@/lib/session';
import { eq, and, or, lte, gte, ilike, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateRandomToken, calculateRentalPrice } from '@/lib/utils';
import { sendReservationPaymentLink } from '@/lib/resend';
import { checkReservationLimit, PlanLimitError } from '@/lib/plan-limits';
import { isYousignEnabled } from '@/lib/feature-flags';

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
        team: true,
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

export async function getVehicleBookedDates(vehicleId: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get all confirmed/paid/in-progress reservations for this vehicle
    const bookedReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.vehicleId, vehicleId),
        eq(reservations.teamId, teamId),
        or(
          eq(reservations.status, 'paid'),
          eq(reservations.status, 'confirmed'),
          eq(reservations.status, 'in_progress')
        )
      ),
      columns: {
        startDate: true,
        endDate: true,
      },
    });

    return { bookedReservations };
  } catch (error) {
    console.error('[getVehicleBookedDates]', error);
    return { error: 'Failed to fetch booked dates' };
  }
}

export async function createReservation(data: {
  vehicleId: string;
  customerId?: string; // Optional for self-fill mode
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

    // Check reservation limit using new plan limits system
    try {
      await checkReservationLimit(teamId);
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return {
          error: error.message,
          limitType: error.limitType,
          currentPlan: error.currentPlan,
          suggestedPlan: error.suggestedPlan,
        };
      }
      throw error;
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
    const totalAmount = calculateRentalPrice(
      parseFloat(vehicle.dailyRate),
      data.startDate,
      data.endDate
    );

    // Generate magic link token
    const magicLinkToken = generateRandomToken();

    // Create reservation
    const [reservation] = await db
      .insert(reservations)
      .values({
        teamId,
        vehicleId: data.vehicleId,
        customerId: data.customerId || undefined,
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

    // If customer exists, send email with payment link
    if (data.customerId) {
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
    }
    // If no customer (self-fill mode), the agency will send the link manually

    revalidatePath('/reservations');

    return { reservation, magicLinkToken };
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
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { error: 'Unauthorized' };
    }

    if (!query || query.trim().length < 3) {
      return { customers: [] };
    }

    const searchTerm = query.trim();
    const searchPattern = `%${searchTerm}%`;

    // Search by email, phone, first name, or last name using ILIKE (case-insensitive LIKE)
    // Only search within the current organization
    const customersList = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, organizationId),
          or(
            ilike(customers.email, searchPattern),
            ilike(customers.phone, searchPattern),
            ilike(customers.firstName, searchPattern),
            ilike(customers.lastName, searchPattern),
            // Also search full name
            sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName}) ILIKE ${searchPattern}`
          )
        )
      )
      .limit(10);

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
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return { error: 'Unauthorized' };
    }

    // Check if customer exists within the same organization
    const existingCustomer = await db.query.customers.findFirst({
      where: and(
        eq(customers.email, data.email.toLowerCase()),
        eq(customers.organizationId, organizationId)
      ),
    });

    if (existingCustomer) {
      return { error: 'L\'email est déjà utilisé par : ' + existingCustomer.firstName + ' ' + existingCustomer.lastName };
    }

    // Create customer linked to the organization
    const [customer] = await db
      .insert(customers)
      .values({
        organizationId,
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

export async function resendPaymentLink(reservationId: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get reservation with customer and vehicle data
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.teamId, teamId)
      ),
      with: {
        customer: true,
        vehicle: true,
      },
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    if (!reservation.magicLinkToken) {
      return { error: 'No payment link available for this reservation' };
    }

    if (reservation.status !== 'pending_payment') {
      return { error: 'This reservation is not awaiting payment' };
    }

    // Send email with magic link
    const magicLink = `${process.env.NEXT_PUBLIC_URL}/reservation/${reservation.magicLinkToken}`;
    if (!reservation.customer) {
      return { error: 'No customer associated with this reservation' };
    }
    await sendReservationPaymentLink({
      to: reservation.customer.email,
      customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
      vehicleName: `${reservation.vehicle.brand} ${reservation.vehicle.model}`,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      amount: parseFloat(reservation.totalAmount),
      magicLink,
    });

    return { success: true };
  } catch (error) {
    console.error('[resendPaymentLink]', error);
    return { error: 'Failed to resend payment link' };
  }
}

export async function generateReservationContract(reservationId: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get reservation
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.teamId, teamId)
      ),
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    // Check if reservation is paid
    if (reservation.status === 'pending_payment' || reservation.status === 'draft') {
      return { error: 'Reservation must be paid before generating contract' };
    }

    // Generate contract PDF
    const { generateContractPDF } = await import('@/lib/pdf/generate');
    const contractResult = await generateContractPDF(reservationId);

    if (contractResult.error) {
      return { error: contractResult.error };
    }

    revalidatePath(`/reservations/${reservationId}`);

    return { success: true, contractUrl: contractResult.pdfUrl };
  } catch (error) {
    console.error('[generateReservationContract]', error);
    return { error: 'Failed to generate contract' };
  }
}

export async function sendContractForSignature(reservationId: string) {
  try {
    // Check if YouSign is enabled
    if (!isYousignEnabled()) {
      return { error: 'La signature électronique est actuellement désactivée. Cette fonctionnalité sera bientôt disponible.' };
    }

    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get full reservation data
    const fullReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.teamId, teamId)
      ),
      with: {
        customer: true,
        vehicle: true,
        contracts: true,
      },
    });

    if (!fullReservation) {
      return { error: 'Reservation not found' };
    }

    if (!fullReservation.customer) {
      return { error: 'Customer details are required to send contract' };
    }

    // Check if contract exists
    const contract = fullReservation.contracts[0];
    if (!contract || !contract.pdfUrl) {
      return { error: 'Contract must be generated first' };
    }

    // Check if already sent for signature
    if (contract.yousignSignatureRequestId) {
      return { error: 'Contract already sent for signature' };
    }

    // Send to Yousign for signature
    const { createYousignSignatureRequest } = await import('@/lib/yousign');
    const yousignResult = await createYousignSignatureRequest({
      contractPdfUrl: contract.pdfUrl,
      customer: {
        firstName: fullReservation.customer.firstName || '',
        lastName: fullReservation.customer.lastName || '',
        email: fullReservation.customer.email || '',
        phone: fullReservation.customer.phone || undefined,
      },
      reservationId,
    });

    if (yousignResult.error) {
      console.error('[sendContractForSignature] Yousign error:', yousignResult.error);
      return { error: yousignResult.error };
    }

    if (!yousignResult.signatureRequestId) {
      console.error('[sendContractForSignature] Missing signatureRequestId');
      return { error: 'Failed to create signature request - no ID returned' };
    }

    // Note: signatureLink might be undefined but that's OK since Yousign sends the email directly
    console.log('[sendContractForSignature] Signature request created:', {
      signatureRequestId: yousignResult.signatureRequestId,
      hasSignatureLink: !!yousignResult.signatureLink,
    });

    // Update contract with Yousign signature request ID
    const { contracts } = await import('@/drizzle/schema');
    await db
      .update(contracts)
      .set({
        yousignSignatureRequestId: yousignResult.signatureRequestId,
        updatedAt: new Date(),
      })
      .where(eq(contracts.reservationId, reservationId));

    // Send confirmation email with Yousign signature link (only if we have the link)
    // Otherwise, Yousign will send the email directly
    if (yousignResult.signatureLink) {
      const { sendPaymentConfirmedEmail } = await import('@/lib/resend');
      await sendPaymentConfirmedEmail({
        to: fullReservation.customer.email,
        customerName: `${fullReservation.customer.firstName} ${fullReservation.customer.lastName}`,
        vehicle: {
          brand: fullReservation.vehicle.brand,
          model: fullReservation.vehicle.model,
        },
        yousignLink: yousignResult.signatureLink,
      });
      console.log('[sendContractForSignature] Confirmation email sent with signature link');
    } else {
      console.log('[sendContractForSignature] Yousign will send the email directly');
    }

    revalidatePath(`/reservations/${reservationId}`);

    return { success: true, signatureLink: yousignResult.signatureLink };
  } catch (error) {
    console.error('[sendContractForSignature]', error);
    return { error: 'Failed to send contract for signature' };
  }
}

export async function checkContractSignatureStatus(reservationId: string) {
  try {
    // Check if YouSign is enabled
    if (!isYousignEnabled()) {
      return { error: 'La signature électronique est actuellement désactivée. Cette fonctionnalité sera bientôt disponible.' };
    }

    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get full reservation data
    const fullReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.teamId, teamId)
      ),
      with: {
        customer: true,
        vehicle: true,
        contracts: true,
        team: true,
      },
    });

    if (!fullReservation) {
      return { error: 'Reservation not found' };
    }

    const contract = fullReservation.contracts[0];
    if (!contract) {
      return { error: 'No contract found' };
    }

    if (!contract.yousignSignatureRequestId) {
      return { error: 'Contract not sent for signature yet' };
    }

    if (contract.signedAt) {
      return {
        status: 'signed',
        message: 'Contract already signed',
        signedAt: contract.signedAt,
        signedPdfUrl: contract.signedPdfUrl,
      };
    }

    // Check status from Yousign API
    const { getYousignSignatureRequest, downloadYousignSignedDocument } = await import('@/lib/yousign');
    const yousignStatus = await getYousignSignatureRequest(contract.yousignSignatureRequestId);

    if (yousignStatus.error) {
      console.error('[checkContractSignatureStatus] Yousign API error:', yousignStatus.error);
      return { error: yousignStatus.error };
    }

    console.log('[checkContractSignatureStatus] Yousign status:', yousignStatus.status);

    // If status is done but we haven't processed it yet, process it now
    if (yousignStatus.status === 'done' && !contract.signedAt) {
      console.log('[checkContractSignatureStatus] Processing missed signature completion');

      // Get document ID from the signature request
      // We need to fetch the full signature request to get documents
      const signatureRequestResponse = await fetch(
        `https://api-sandbox.yousign.app/v3/signature_requests/${contract.yousignSignatureRequestId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.YOUSIGN_API_KEY}`,
          },
        }
      );

      if (!signatureRequestResponse.ok) {
        return { error: 'Failed to fetch signature request details' };
      }

      const signatureRequestData = await signatureRequestResponse.json();
      const documentId = signatureRequestData.documents?.[0]?.id;

      if (!documentId) {
        return { error: 'No document found in signature request' };
      }

      // Download signed PDF
      const { fileBuffer, error: downloadError } = await downloadYousignSignedDocument(
        contract.yousignSignatureRequestId,
        documentId
      );

      if (downloadError || !fileBuffer) {
        console.error('[checkContractSignatureStatus] Failed to download:', downloadError);
        return { error: downloadError || 'Failed to download signed document' };
      }

      // Upload to R2
      const { uploadToR2 } = await import('@/lib/r2');
      const signedPdfPath = `contracts/${fullReservation.teamId}/${reservationId}-signed.pdf`;
      const signedPdfUrl = await uploadToR2({
        file: fileBuffer,
        path: signedPdfPath,
        contentType: 'application/pdf',
      });

      // Update contract
      const { contracts } = await import('@/drizzle/schema');
      await db
        .update(contracts)
        .set({
          signedAt: new Date(),
          signedPdfUrl,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, contract.id));

      // Update reservation status to confirmed
      await db
        .update(reservations)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, reservationId));

      // Send confirmation email
      if (fullReservation.customer) {
        try {
          const { sendContractSignedEmail } = await import('@/lib/resend');
          await sendContractSignedEmail({
            to: fullReservation.customer.email,
            customerName: `${fullReservation.customer.firstName} ${fullReservation.customer.lastName}`,
            vehicle: {
              brand: fullReservation.vehicle.brand,
              model: fullReservation.vehicle.model,
            },
            dates: {
              start: fullReservation.startDate.toLocaleDateString('fr-FR'),
              end: fullReservation.endDate.toLocaleDateString('fr-FR'),
            },
            pickupAddress: fullReservation.team.address || fullReservation.team.name,
            contractPdfUrl: signedPdfUrl,
          });
          console.log('[checkContractSignatureStatus] Confirmation email sent');
        } catch (emailError) {
          console.error('[checkContractSignatureStatus] Email error:', emailError);
          // Don't fail the whole operation if email fails
        }
      }

      console.log('[checkContractSignatureStatus] Contract processed successfully');

      revalidatePath(`/reservations/${reservationId}`);

      return {
        status: 'signed',
        message: 'Contract just signed - processed successfully',
        signedAt: new Date(),
        signedPdfUrl,
      };
    }

    // Return current status
    return {
      status: yousignStatus.status,
      message: `Contract status: ${yousignStatus.status}`,
    };
  } catch (error) {
    console.error('[checkContractSignatureStatus]', error);
    return { error: 'Failed to check signature status' };
  }
}

export async function sendBalancePaymentLink(reservationId: string) {
  try {
    const teamId = await getCurrentTeamId();
    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get full reservation data including team and payments
    const fullReservation = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, reservationId), eq(reservations.teamId, teamId)),
      with: {
        customer: true,
        vehicle: true,
        team: true,
        payments: true,
      },
    });

    if (!fullReservation) {
      return { error: 'Reservation not found' };
    }

    if (!fullReservation.customer) {
      return { error: 'No customer associated with this reservation' };
    }

    // Check if deposit was paid (can be either 'deposit' or 'total' payment)
    const depositPayment = fullReservation.payments.find(
      (p) => (p.type === 'deposit' || p.type === 'total') && p.status === 'succeeded'
    );

    if (!depositPayment) {
      return { error: 'Deposit must be paid before requesting balance payment' };
    }

    // Check if balance was already paid
    const balancePayment = fullReservation.payments.find(
      (p) => p.type === 'balance' && p.status === 'succeeded'
    );

    if (balancePayment) {
      return { error: 'Balance has already been paid' };
    }

    // Calculate balance amount
    const totalAmount = parseFloat(fullReservation.totalAmount);
    const depositAmount = fullReservation.depositAmount ? parseFloat(fullReservation.depositAmount) : 0;
    const balanceBeforeFees = totalAmount - depositAmount;

    // Calculate Carbly platform fees on the balance
    const { calculatePlatformFees } = await import('@/lib/pricing-config');
    const fees = calculatePlatformFees(balanceBeforeFees, fullReservation.team.plan);

    // Total balance = remaining amount + platform fees
    const totalBalanceAmount = balanceBeforeFees + fees.totalFee;

    // Generate unique token for balance payment
    const { randomBytes } = await import('crypto');
    const balanceToken = randomBytes(32).toString('hex');

    // Update reservation with balance payment token
    await db
      .update(reservations)
      .set({
        balancePaymentToken: balanceToken,
      })
      .where(eq(reservations.id, reservationId));

    // Send email to customer with payment link
    const { sendBalancePaymentEmail } = await import('@/lib/resend');
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reservation/${balanceToken}/balance`;

    await sendBalancePaymentEmail({
      to: fullReservation.customer.email,
      customerName: `${fullReservation.customer.firstName} ${fullReservation.customer.lastName}`,
      vehicle: {
        brand: fullReservation.vehicle.brand,
        model: fullReservation.vehicle.model,
      },
      dates: {
        start: fullReservation.startDate.toLocaleDateString('fr-FR'),
        end: fullReservation.endDate.toLocaleDateString('fr-FR'),
      },
      amounts: {
        totalReservation: totalAmount,
        depositPaid: depositAmount,
        balance: balanceBeforeFees,
        platformFees: fees.totalFee,
        totalToPay: totalBalanceAmount,
      },
      paymentUrl,
    });

    console.log('[sendBalancePaymentLink] Balance payment link sent to:', fullReservation.customer.email);

    revalidatePath(`/reservations/${reservationId}`);

    return {
      success: true,
      balanceAmount: totalBalanceAmount,
      paymentUrl,
    };
  } catch (error) {
    console.error('[sendBalancePaymentLink]', error);
    return { error: 'Failed to send balance payment link' };
  }
}

export async function markBalanceAsPaidCash(reservationId: string) {
  try {
    const teamId = await getCurrentTeamId();
    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get full reservation data including team and payments
    const fullReservation = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, reservationId), eq(reservations.teamId, teamId)),
      with: {
        customer: true,
        vehicle: true,
        team: true,
        payments: true,
      },
    });

    if (!fullReservation) {
      return { error: 'Reservation not found' };
    }

    // Check if deposit was paid
    const depositPayment = fullReservation.payments.find(
      (p) => (p.type === 'deposit' || p.type === 'total') && p.status === 'succeeded'
    );

    if (!depositPayment) {
      return { error: 'Deposit must be paid before marking balance as paid' };
    }

    // Check if balance was already paid
    const balancePayment = fullReservation.payments.find(
      (p) => p.type === 'balance' && p.status === 'succeeded'
    );

    if (balancePayment) {
      return { error: 'Balance has already been paid' };
    }

    // Calculate balance amount
    const totalAmount = parseFloat(fullReservation.totalAmount);
    const depositAmount = fullReservation.depositAmount ? parseFloat(fullReservation.depositAmount) : 0;
    const balanceAmount = totalAmount - depositAmount;

    // For cash payments, no platform fees are charged to the customer
    // The agency receives the full balance amount
    // Create payment record for cash payment (no fees for cash)
    await db.insert(payments).values({
      reservationId: reservationId,
      amount: balanceAmount.toString(),
      fee: '0',  // No fees for cash payments
      type: 'balance',
      status: 'succeeded',
      paidAt: new Date(),
      // No stripePaymentIntentId for cash payments
    });

    console.log('[markBalanceAsPaidCash] Balance marked as paid in cash for reservation:', reservationId);

    revalidatePath(`/reservations/${reservationId}`);

    return {
      success: true,
      message: 'Balance marked as paid in cash',
    };
  } catch (error) {
    console.error('[markBalanceAsPaidCash]', error);
    return { error: 'Failed to mark balance as paid' };
  }
}

export async function checkPaymentStatus(reservationId: string) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    // Get full reservation data
    const fullReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.teamId, teamId)
      ),
      with: {
        customer: true,
        vehicle: true,
        payments: true,
      },
    });

    if (!fullReservation) {
      return { error: 'Reservation not found' };
    }

    // If already paid, return success
    if (fullReservation.status === 'paid' || fullReservation.status === 'confirmed') {
      return {
        status: 'paid',
        message: 'Paiement déjà confirmé',
      };
    }

    // If not pending payment, nothing to check
    if (fullReservation.status !== 'pending_payment') {
      return {
        status: fullReservation.status,
        message: `Statut actuel: ${fullReservation.status}`,
      };
    }

    // Check if there's a Stripe payment intent to verify
    // Look for the most recent payment attempt
    const { stripe } = await import('@/lib/stripe');
    
    // Try to find payment intent from session
    // We need to check if there's a checkout session for this reservation
    // The magic link token can help us identify sessions
    if (!fullReservation.magicLinkToken) {
      return {
        status: 'pending_payment',
        message: 'Aucun paiement en cours trouvé',
      };
    }

    // Search for checkout sessions with this reservation ID in metadata
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    // Find session for this reservation
    const session = sessions.data.find(
      (s) => s.metadata?.reservationId === reservationId
    );

    if (!session) {
      return {
        status: 'pending_payment',
        message: 'Aucune session de paiement trouvée',
      };
    }

    // Check session status
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Payment succeeded! Update the database
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      // Update reservation status
      await db
        .update(reservations)
        .set({
          status: 'paid',
          stripePaymentIntentId: paymentIntentId || null,
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, reservationId));

      // Create payment record if it doesn't exist
      const existingPayment = fullReservation.payments.find(
        (p) => p.stripePaymentIntentId === paymentIntentId
      );

      if (!existingPayment) {
        const paymentType = session.metadata?.paymentType as 'deposit' | 'total' || 'total';
        const amountPaidTotal = session.amount_total ? session.amount_total / 100 : 0;
        const platformFee = session.metadata?.platformFeeTotal 
          ? parseFloat(session.metadata.platformFeeTotal)
          : 0.99;
        const amountPaidByCustomer = amountPaidTotal - platformFee;

        await db.insert(payments).values({
          reservationId: reservationId,
          amount: amountPaidByCustomer.toString(),
          fee: platformFee.toString(),
          type: paymentType,
          stripePaymentIntentId: paymentIntentId || null,
          status: 'succeeded',
          paidAt: new Date(),
        });
      }

      console.log('[checkPaymentStatus] Payment confirmed for reservation:', reservationId);

      revalidatePath(`/reservations/${reservationId}`);

      return {
        status: 'paid',
        message: 'Paiement confirmé avec succès !',
      };
    } else if (session.payment_status === 'unpaid') {
      return {
        status: 'pending_payment',
        message: 'En attente du paiement du client',
      };
    } else {
      return {
        status: session.payment_status,
        message: `Statut du paiement: ${session.payment_status}`,
      };
    }
  } catch (error) {
    console.error('[checkPaymentStatus]', error);
    return { error: 'Erreur lors de la vérification du statut de paiement' };
  }
}

