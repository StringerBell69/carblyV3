import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, customers, teams } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();

    const { email, firstName, lastName, phone } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find reservation by token with team info to get organizationId
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.magicLinkToken, token),
      with: {
        team: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if reservation already has a customer
    if (reservation.customerId) {
      return NextResponse.json(
        { error: 'Customer already exists for this reservation' },
        { status: 400 }
      );
    }

    const organizationId = reservation.team.organizationId;

    // Check if customer already exists with this email within the same organization
    let customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.email, email.toLowerCase()),
        eq(customers.organizationId, organizationId)
      ),
    });

    // If not, create new customer for this organization
    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          organizationId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone: phone || null,
        })
        .returning();

      customer = newCustomer;
    }

    // Update reservation with customer ID
    await db
      .update(reservations)
      .set({
        customerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, reservation.id));

    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error('[POST /api/reservations/public/[token]/customer]', error);
    return NextResponse.json(
      { error: 'Failed to save customer information' },
      { status: 500 }
    );
  }
}
