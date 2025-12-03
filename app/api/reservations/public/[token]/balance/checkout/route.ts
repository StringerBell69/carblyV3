import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, payments } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { calculatePlatformFees, type PlanType } from '@/lib/pricing-config';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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

    // Convert to cents for Stripe
    const balanceInCents = Math.round(balanceBeforeFees * 100);
    const applicationFeeInCents = Math.round(fees.totalFee * 100);

    // Build fee description
    let feeDescription = `${fees.percentageFee}%`;

    if (fees.isMinimumApplied) {
      feeDescription += ` (minimum ${fees.minFee}€ appliqué)`;
    } else if (fees.maxCap !== null) {
      feeDescription += ` (max ${fees.maxCap}€)`;
      if (fees.isCapped) {
        feeDescription += ' - Plafond atteint';
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card', 'sepa_debit'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Solde de réservation - ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
                description: `Du ${reservation.startDate.toLocaleDateString('fr-FR')} au ${reservation.endDate.toLocaleDateString('fr-FR')}`,
              },
              unit_amount: balanceInCents,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Frais Carbly',
                description: feeDescription,
              },
              unit_amount: applicationFeeInCents,
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
          platformFeeTotal: String(fees.totalFee), // Add fee to session metadata for webhook
        },
        payment_intent_data: {
          // Use application_fee_amount so Stripe fees are deducted from the connected account
          // Carbly takes only the platform fee, Stripe fees are paid by the rental owner
          application_fee_amount: applicationFeeInCents, // Carbly's fee only
          metadata: {
            reservationId: reservation.id,
            paymentType: 'balance',
            platformFeePercentage: String(fees.percentageFee),
            platformFeeMaxCap: fees.maxCap !== null ? String(fees.maxCap) : 'none',
            platformFeeTotal: String(fees.totalFee),
            platformFeeIsCapped: String(fees.isCapped),
          },
        },
      },
      {
        stripeAccount: reservation.team.stripeConnectAccountId, // Payment is created on the connected account
      }
    );

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
