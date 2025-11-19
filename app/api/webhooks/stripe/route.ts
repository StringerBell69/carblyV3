import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { teams, reservations, payments } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateContractPDF } from '@/lib/pdf/generate';
import { sendPaymentConfirmedEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata as { teamId?: string; organizationId?: string; reservationId?: string };

        // Handle subscription payment (onboarding)
        if (metadata?.teamId && session.subscription) {
          await db
            .update(teams)
            .set({
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            })
            .where(eq(teams.id, metadata.teamId));

          console.log('[Stripe Webhook] Subscription activated for team:', metadata.teamId);
        }

        // Handle reservation payment
        if (metadata?.reservationId) {
          await db
            .update(reservations)
            .set({
              status: 'paid',
              stripePaymentIntentId: session.payment_intent as string,
            })
            .where(eq(reservations.id, metadata.reservationId));

          // Create payment record
          const reservation = await db.query.reservations.findFirst({
            where: eq(reservations.id, metadata.reservationId),
          });

          if (reservation) {
            await db.insert(payments).values({
              reservationId: metadata.reservationId,
              amount: reservation.totalAmount,
              fee: '0.99',
              type: 'total',
              stripePaymentIntentId: session.payment_intent as string,
              status: 'succeeded',
              paidAt: new Date(),
            });

            console.log('[Stripe Webhook] Reservation paid:', metadata.reservationId);

            // Get full reservation data
            const fullReservation = await db.query.reservations.findFirst({
              where: eq(reservations.id, metadata.reservationId),
              with: {
                vehicle: true,
                customer: true,
              },
            });

            // Check if full amount was paid (not just deposit)
            const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Stripe amounts are in cents
            const totalAmount = parseFloat(reservation.totalAmount);
            const isFullPayment = !reservation.depositAmount || amountPaid >= totalAmount;

            let contractPdfUrl: string | undefined;

            if (isFullPayment) {
              // Only generate contract if full payment was made
              console.log('[Stripe Webhook] Full payment received, generating contract');

              const contractResult = await generateContractPDF(metadata.reservationId);

              if (contractResult.error) {
                console.error('[Stripe Webhook] Failed to generate contract:', contractResult.error);
              } else {
                console.log('[Stripe Webhook] Contract generated:', contractResult.pdfUrl);
                contractPdfUrl = contractResult.pdfUrl;
              }
            } else {
              console.log('[Stripe Webhook] Deposit payment only, contract will be generated manually by agency');
            }

            if (fullReservation) {
              // Send confirmation email
              try {
                await sendPaymentConfirmedEmail({
                  to: fullReservation.customer.email,
                  customerName: `${fullReservation.customer.firstName} ${fullReservation.customer.lastName}`,
                  vehicle: {
                    brand: fullReservation.vehicle.brand,
                    model: fullReservation.vehicle.model,
                  },
                  yousignLink: contractPdfUrl, // Will be undefined if only deposit paid
                });
                console.log('[Stripe Webhook] Confirmation email sent to:', fullReservation.customer.email);
              } catch (emailError) {
                console.error('[Stripe Webhook] Failed to send confirmation email:', emailError);
              }
            }
          }
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[Stripe Webhook] Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Find team by subscription ID
        const team = await db.query.teams.findFirst({
          where: eq(teams.stripeSubscriptionId, subscription.id),
        });

        if (team) {
          await db
            .update(teams)
            .set({
              subscriptionStatus: subscription.status,
            })
            .where(eq(teams.id, team.id));

          console.log('[Stripe Webhook] Subscription updated:', subscription.id);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Find team by subscription ID
        const team = await db.query.teams.findFirst({
          where: eq(teams.stripeSubscriptionId, subscription.id),
        });

        if (team) {
          await db
            .update(teams)
            .set({
              subscriptionStatus: 'canceled',
            })
            .where(eq(teams.id, team.id));

          console.log('[Stripe Webhook] Subscription canceled:', subscription.id);
        }

        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
