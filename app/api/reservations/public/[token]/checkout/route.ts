import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { createReservationCheckoutSession } from '@/lib/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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

    // Check if team has Connect account onboarded
    if (!reservation.team.stripeConnectAccountId || !reservation.team.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: 'Payment processing not configured for this team' },
        { status: 400 }
      );
    }

    // Check if customer exists
    if (!reservation.customer) {
      return NextResponse.json(
        { error: 'Customer information required. Please complete your information first.' },
        { status: 400 }
      );
    }

    // Calculate amount to pay (deposit or total)
    const hasDeposit = !!reservation.depositAmount;
    const amountToPay = hasDeposit
      ? parseFloat(reservation.depositAmount!)
      : parseFloat(reservation.totalAmount);
    const paymentType = hasDeposit ? 'deposit' : 'total';

    // Get team plan (default to 'free' if not set)
    const teamPlan = (reservation.team.plan || 'free') as 'free' | 'starter' | 'pro' | 'business';

    console.log('[Checkout] Creating session for reservation:', reservation.id);
    console.log('[Checkout] Team ID:', reservation.teamId);
    console.log('[Checkout] Team Plan:', teamPlan);
    console.log('[Checkout] Amount to pay:', amountToPay);
    console.log('[Checkout] Payment type:', paymentType);

    // Create Stripe Connect Checkout Session
    const { url, error } = await createReservationCheckoutSession({
      amount: amountToPay,
      connectedAccountId: reservation.team.stripeConnectAccountId,
      customerEmail: reservation.customer.email,
      reservationId: reservation.id,
      teamId: reservation.teamId,
      teamPlan,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}`,
      description: `Location ${reservation.vehicle.brand} ${reservation.vehicle.model} - ${reservation.customer.firstName} ${reservation.customer.lastName}`,
      cautionAmount: reservation.depositAmount ? parseFloat(reservation.depositAmount) : undefined,
      paymentType,
    });

    if (error || !url) {
      return NextResponse.json(
        { error: error || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[POST /api/reservations/public/[token]/checkout]', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
