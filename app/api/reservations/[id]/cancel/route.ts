import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, payments } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentSession, getCurrentTeamId } from '@/lib/session';
import { stripe } from '@/lib/stripe';
import { sendCancellationEmail } from '@/lib/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teamId = await getCurrentTeamId();
    if (!teamId) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reason, refundAmount } = body; // refundAmount: number (in euros)

    // Get reservation with all related data
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, id),
        eq(reservations.teamId, teamId)
      ),
      with: {
        payments: true,
        customer: true,
        vehicle: true,
        team: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      );
    }

    // Check if reservation has started
    const now = new Date();
    if (reservation.checkinAt && new Date(reservation.checkinAt) < now) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une réservation déjà commencée' },
        { status: 400 }
      );
    }

    // Get successful payments
    const successfulPayments = reservation.payments.filter(
      (p) => p.status === 'succeeded'
    );

    let refundResults: Array<{ paymentId: string; refundId: string; status: string | null }> = [];

    // Handle refunds if requested
    if (refundAmount > 0 && successfulPayments.length > 0) {
      // Calculate total paid amount
      const totalPaid = successfulPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      // Distribute refund proportionally across payments
      for (const payment of successfulPayments) {
        if (!payment.stripePaymentIntentId) continue;

        try {
          const paymentAmount = parseFloat(payment.amount);
          const paymentFee = parseFloat(payment.fee || '0');

          // Calculate proportional refund for this payment
          const paymentProportion = paymentAmount / totalPaid;
          const thisPaymentRefund = refundAmount * paymentProportion;

          // Convert to cents, including the fee portion
          const refundAmountCents = Math.round((thisPaymentRefund + (paymentFee * paymentProportion)) * 100);

          // Create refund on Connect account
          const refund = await stripe.refunds.create(
            {
              payment_intent: payment.stripePaymentIntentId,
              amount: refundAmountCents,
              reason: 'requested_by_customer',
              metadata: {
                reservationId: reservation.id,
                cancelReason: reason || 'cancelled_by_agency',
              },
            },
            reservation.team.stripeConnectAccountId
              ? { stripeAccount: reservation.team.stripeConnectAccountId }
              : undefined
          );

          refundResults.push({
            paymentId: payment.id,
            refundId: refund.id,
            status: refund.status,
          });

          console.log('[Cancel Reservation] Refund created:', refund.id);
        } catch (refundError) {
          console.error('[Cancel Reservation] Refund failed for payment:', payment.id, refundError);
          // Continue with other refunds even if one fails
        }
      }
    }

    // Update reservation status
    await db
      .update(reservations)
      .set({
        status: 'cancelled',
        internalNotes: reservation.internalNotes
          ? `${reservation.internalNotes}\n\n[${new Date().toISOString()}] Annulée - Raison: ${reason || 'Non spécifiée'} - Remboursement: ${refundAmount}€`
          : `[${new Date().toISOString()}] Annulée - Raison: ${reason || 'Non spécifiée'} - Remboursement: ${refundAmount}€`,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id));

    console.log('[Cancel Reservation] Reservation cancelled:', id);

    // Send cancellation email to customer
    if (reservation.customer?.email) {
      try {
        await sendCancellationEmail({
          to: reservation.customer.email,
          customerName: `${reservation.customer.firstName || ''} ${reservation.customer.lastName || ''}`.trim(),
          vehicle: {
            brand: reservation.vehicle.brand,
            model: reservation.vehicle.model,
          },
          dates: {
            start: reservation.startDate.toLocaleDateString('fr-FR'),
            end: reservation.endDate.toLocaleDateString('fr-FR'),
          },
          refundAmount,
          reason,
        });
        console.log('[Cancel Reservation] Cancellation email sent to:', reservation.customer.email);
      } catch (emailError) {
        console.error('[Cancel Reservation] Failed to send cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      refunds: refundResults,
      message: 'Réservation annulée avec succès',
    });
  } catch (error) {
    console.error('[POST /api/reservations/[id]/cancel]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de la réservation' },
      { status: 500 }
    );
  }
}
