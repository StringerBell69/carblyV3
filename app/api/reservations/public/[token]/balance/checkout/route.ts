import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, payments } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { calculatePlatformFees, type PlanType } from '@/lib/pricing-config';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Find reservation by balancePaymentToken
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.balancePaymentToken, token),
      with: {
        customer: true,
        vehicle: true,
        team: true,
        payments: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    if (!reservation.customer) {
      return NextResponse.json({ error: 'Client manquant' }, { status: 400 });
    }

    // Check if Stripe Connect account is set up
    if (!reservation.team.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Le compte de paiement de l\'agence n\'est pas configuré' },
        { status: 400 }
      );
    }

    // Check if deposit was paid
    const depositPayment = reservation.payments.find(
      (p) => p.type === 'deposit' && p.status === 'succeeded'
    );

    if (!depositPayment) {
      return NextResponse.json(
        { error: 'L\'acompte doit être payé avant le solde' },
        { status: 400 }
      );
    }

    // Check if balance was already paid
    const balancePayment = reservation.payments.find(
      (p) => p.type === 'balance' && p.status === 'succeeded'
    );

    if (balancePayment) {
      return NextResponse.json(
        { error: 'Le solde a déjà été payé' },
        { status: 400 }
      );
    }

    // Calculate balance amounts
    const totalAmount = parseFloat(reservation.totalAmount);
    const depositAmount = reservation.depositAmount ? parseFloat(reservation.depositAmount) : 0;
    const balanceBeforeFees = totalAmount - depositAmount;

    // Calculate Carbly platform fees on the balance
    const teamPlan = (reservation.team.plan || 'free') as PlanType;
    const fees = calculatePlatformFees(balanceBeforeFees, teamPlan);

    // Total balance to pay (agency gets balanceBeforeFees, Carbly gets fees.totalFee)
    const totalBalanceAmount = balanceBeforeFees + fees.totalFee;

    // Convert to cents for Stripe
    const amountInCents = Math.round(totalBalanceAmount * 100);
    const applicationFeeInCents = Math.round(fees.totalFee * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Solde de réservation - ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
              description: `Du ${reservation.startDate.toLocaleDateString('fr-FR')} au ${reservation.endDate.toLocaleDateString('fr-FR')}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/${token}/balance/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/${token}/balance`,
      customer_email: reservation.customer.email,
      metadata: {
        reservationId: reservation.id,
        customerId: reservation.customer.id,
        teamId: reservation.team.id,
        paymentType: 'balance',
        balancePaymentToken: token,
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeInCents,
        transfer_data: {
          destination: reservation.team.stripeConnectAccountId,
        },
        metadata: {
          reservationId: reservation.id,
          paymentType: 'balance',
        },
      },
    });

    // Create payment record with pending status
    await db.insert(payments).values({
      reservationId: reservation.id,
      amount: balanceBeforeFees.toString(),
      fee: fees.totalFee.toString(),
      type: 'balance',
      status: 'pending',
    });

    console.log('[Balance Checkout] Created session:', session.id, 'for reservation:', reservation.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[POST /api/reservations/public/[token]/balance/checkout]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
