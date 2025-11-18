import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.magicLinkToken, token),
      with: {
        vehicle: true,
        customer: true,
        team: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Reservation already paid or invalid' },
        { status: 400 }
      );
    }

    // Calculate amount to pay (deposit or total)
    const amountToPay = reservation.depositAmount
      ? parseFloat(reservation.depositAmount)
      : parseFloat(reservation.totalAmount);

    const fee = 0.99;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Location ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
              description: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
            },
            unit_amount: Math.round(amountToPay * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de service',
            },
            unit_amount: Math.round(fee * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: reservation.customer.email,
      metadata: {
        reservationId: reservation.id,
        teamId: reservation.teamId,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[POST /api/reservations/public/[token]/checkout]', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
