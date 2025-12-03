import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, payments } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { calculatePlatformFees, type PlanType } from '@/lib/pricing-config';

export async function GET(
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

    // Check if deposit was paid (can be either 'deposit' or 'total' payment)
    const depositPayment = reservation.payments.find(
      (p) => (p.type === 'deposit' || p.type === 'total') && p.status === 'succeeded'
    );

    if (!depositPayment) {
      return NextResponse.json({ error: 'L\'acompte n\'a pas été payé' }, { status: 400 });
    }

    // Check if balance was already paid
    const balancePayment = reservation.payments.find(
      (p) => p.type === 'balance' && p.status === 'succeeded'
    );

    if (balancePayment) {
      return NextResponse.json({
        reservation,
        balanceInfo: {
          alreadyPaid: true,
        },
      });
    }

    // Calculate balance amounts
    const totalAmount = parseFloat(reservation.totalAmount);
    const depositAmount = reservation.depositAmount ? parseFloat(reservation.depositAmount) : 0;
    const balanceBeforeFees = totalAmount - depositAmount;

    // Calculate Carbly platform fees on the balance
    const teamPlan = (reservation.team.plan || 'free') as PlanType;
    const fees = calculatePlatformFees(balanceBeforeFees, teamPlan);

    const balanceInfo = {
      totalReservation: totalAmount,
      depositPaid: depositAmount,
      balance: balanceBeforeFees,
      platformFees: fees.totalFee,
      totalToPay: balanceBeforeFees + fees.totalFee,
      alreadyPaid: false,
    };

    return NextResponse.json({
      reservation,
      balanceInfo,
    });
  } catch (error) {
    console.error('[GET /api/reservations/public/[token]/balance]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la réservation' },
      { status: 500 }
    );
  }
}
