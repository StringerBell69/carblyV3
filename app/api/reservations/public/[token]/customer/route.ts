import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, customers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

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

    // Find reservation by token
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.magicLinkToken, token),
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

    // Check if customer already exists with this email
    let customer = await db.query.customers.findFirst({
      where: eq(customers.email, email.toLowerCase()),
    });

    // If not, create new customer
    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
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
