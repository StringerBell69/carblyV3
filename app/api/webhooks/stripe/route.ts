import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { teams, reservations, payments, contracts } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { generateContractPDF } from '@/lib/pdf/generate';
import { sendPaymentConfirmedEmail } from '@/lib/resend';
import { createYousignSignatureRequest } from '@/lib/yousign';
import { isYousignEnabled } from '@/lib/feature-flags';

// This is required to receive raw body for Stripe webhook signature verification
export const runtime = 'nodejs';

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
    console.log('[Stripe Webhook] Processing event:', event.type);
    console.log('[Stripe Webhook] Event ID:', event.id);
    console.log('[Stripe Webhook] Account:', event.account || 'platform');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata as {
          teamId?: string;
          organizationId?: string;
          reservationId?: string;
          paymentType?: 'deposit' | 'total' | 'balance' | 'caution';
          balancePaymentToken?: string;
          customerId?: string;
        };

        console.log('[Stripe Webhook] checkout.session.completed - Session ID:', session.id);
        console.log('[Stripe Webhook] Metadata:', JSON.stringify(metadata));
        console.log('[Stripe Webhook] Payment Intent:', session.payment_intent);

        // Handle subscription payment (onboarding or plan change)
        if (metadata?.teamId && (session.subscription || (metadata as any).plan)) {
          const plan = (metadata as any).plan as 'free' | 'starter' | 'pro' | 'business';

          // Determine max vehicles based on plan
          const maxVehicles =
            plan === 'free' ? 3 :
            plan === 'starter' ? 10 :
            plan === 'pro' ? 25 :
            100; // business

          const updateData: any = {
            plan: plan,
            maxVehicles: maxVehicles,
          };

          // Only update subscription fields if subscription exists
          if (session.subscription) {
            updateData.stripeSubscriptionId = session.subscription as string;
            updateData.subscriptionStatus = 'active';
          }

          await db
            .update(teams)
            .set(updateData)
            .where(eq(teams.id, metadata.teamId));

          console.log('[Stripe Webhook] Plan updated for team:', metadata.teamId, 'with plan:', plan, 'maxVehicles:', maxVehicles);
        }

        // Handle balance payment (solde)
        if (metadata?.paymentType === 'balance' && metadata?.reservationId) {
          console.log('[Stripe Webhook] Processing balance payment for:', metadata.reservationId);

          try {
            // Get payment_intent ID (can be string or object)
            const paymentIntentId = typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id;

            console.log('[Stripe Webhook] Payment Intent ID:', paymentIntentId);

            // Get platform fee from session metadata
            let platformFee = 2.5; // Default fallback for free plan
            if ((metadata as any).platformFeeTotal) {
              platformFee = parseFloat((metadata as any).platformFeeTotal);
              console.log('[Stripe Webhook] Platform fee from session metadata:', platformFee);
            } else if (paymentIntentId) {
              // Try to retrieve from payment_intent metadata
              try {
                const pi = await stripe.paymentIntents.retrieve(
                  paymentIntentId,
                  event.account ? { stripeAccount: event.account } : undefined
                );
                if (pi.metadata?.platformFeeTotal) {
                  platformFee = parseFloat(pi.metadata.platformFeeTotal);
                  console.log('[Stripe Webhook] Platform fee from payment_intent metadata:', platformFee);
                }
              } catch (piError) {
                console.error('[Stripe Webhook] Could not retrieve payment_intent:', piError);
              }
            }

            // Update payment record to succeeded
            const updateResult = await db
              .update(payments)
              .set({
                status: 'succeeded',
                paidAt: new Date(),
                stripePaymentIntentId: paymentIntentId || null,
                fee: platformFee.toString(), // Update fee if it was pending
              })
              .where(
                and(
                  eq(payments.reservationId, metadata.reservationId),
                  eq(payments.type, 'balance')
                )
              );

            console.log('[Stripe Webhook] Payment update result:', updateResult);

            // Update reservation with Stripe balance intent ID
            if (paymentIntentId) {
              await db
                .update(reservations)
                .set({
                  stripeBalanceIntentId: paymentIntentId,
                })
                .where(eq(reservations.id, metadata.reservationId));
            }

            console.log('[Stripe Webhook] Balance payment processed for reservation:', metadata.reservationId);
          } catch (dbError) {
            console.error('[Stripe Webhook] Database error processing balance payment:', dbError);
            throw dbError;
          }

          // Get full reservation data to send confirmation email
          const fullReservation = await db.query.reservations.findFirst({
            where: eq(reservations.id, metadata.reservationId),
            with: {
              vehicle: true,
              customer: true,
              team: true,
            },
          });

          if (fullReservation?.customer?.email) {
            try {
              await sendPaymentConfirmedEmail({
                to: fullReservation.customer.email,
                customerName: `${fullReservation.customer.firstName || ''} ${fullReservation.customer.lastName || ''}`.trim(),
                vehicle: {
                  brand: fullReservation.vehicle.brand,
                  model: fullReservation.vehicle.model,
                },
              });
              console.log('[Stripe Webhook] Balance payment confirmation email sent to:', fullReservation.customer.email);
            } catch (emailError) {
              console.error('[Stripe Webhook] Failed to send balance payment confirmation email:', emailError);
              // Don't throw - email failure shouldn't fail the webhook
            }
          } else {
            console.log('[Stripe Webhook] Skipping email - no customer email found');
          }
        }
        // Handle reservation payment (initial deposit or full payment)
        else if (metadata?.reservationId) {
          console.log('[Stripe Webhook] Processing reservation payment for:', metadata.reservationId);

          try {
            // Get payment_intent ID (can be string or object)
            const paymentIntentId = typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id;

            console.log('[Stripe Webhook] Payment Intent ID:', paymentIntentId);

            const updateResult = await db
              .update(reservations)
              .set({
                status: 'paid',
                stripePaymentIntentId: paymentIntentId || null,
              })
              .where(eq(reservations.id, metadata.reservationId))
              .returning();

            console.log('[Stripe Webhook] Reservation update result:', updateResult);

            // Create payment record
            const reservation = await db.query.reservations.findFirst({
              where: eq(reservations.id, metadata.reservationId),
            });

            console.log('[Stripe Webhook] Reservation after update - status:', reservation?.status);

            if (reservation) {
              // Get payment details from session
              const paymentType = (metadata.paymentType || 'total') as 'deposit' | 'total';
              const amountPaidTotal = session.amount_total ? session.amount_total / 100 : 0; // Total including fees

              // Get platform fee from metadata (more reliable than payment_intent for Connect)
              let platformFee = 0.99; // Fallback

              // Try to get fee from session metadata or payment_intent
              if (metadata && (metadata as any).platformFeeTotal) {
                platformFee = parseFloat((metadata as any).platformFeeTotal);
              } else {
                // Try to fetch payment_intent to get metadata
                try {
                  if (paymentIntentId) {
                    const pi = await stripe.paymentIntents.retrieve(
                      paymentIntentId,
                      { stripeAccount: event.account || undefined }
                    );
                    platformFee = pi.metadata?.platformFeeTotal
                      ? parseFloat(pi.metadata.platformFeeTotal)
                      : 0.99;
                  }
                } catch (piError) {
                  console.error('[Stripe Webhook] Error fetching payment intent:', piError);
                }
              }

              const amountPaidByCustomer = amountPaidTotal - platformFee; // Amount without platform fee

              await db.insert(payments).values({
                reservationId: metadata.reservationId,
                amount: amountPaidByCustomer.toString(),
                fee: platformFee.toString(),
                type: paymentType,
                stripePaymentIntentId: paymentIntentId || null,
                status: 'succeeded',
                paidAt: new Date(),
              });

              console.log('[Stripe Webhook] Payment recorded:', {
                reservationId: metadata.reservationId,
                type: paymentType,
                amount: amountPaidByCustomer,
                fee: platformFee,
              });

              // Get full reservation data
              const fullReservation = await db.query.reservations.findFirst({
                where: eq(reservations.id, metadata.reservationId),
                with: {
                  vehicle: true,
                  customer: true,
                },
              });

              // Check if full amount was paid (not just deposit)
              const totalAmount = parseFloat(reservation.totalAmount);
              const isFullPayment = paymentType === 'total';

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

                  // Initiate Yousign signature request
                  if (fullReservation?.customer && isYousignEnabled()) {
                    try {
                      const yousignResult = await createYousignSignatureRequest({
                        contractPdfUrl: contractResult.pdfUrl!,
                        customer: {
                          firstName: fullReservation.customer.firstName || '',
                          lastName: fullReservation.customer.lastName || '',
                          email: fullReservation.customer.email || '',
                          phone: fullReservation.customer.phone || undefined,
                        },
                        reservationId: metadata.reservationId,
                      });

                      if (yousignResult.error) {
                        console.error('[Stripe Webhook] Yousign error:', yousignResult.error);
                      } else if (yousignResult.signatureRequestId) {
                        // Update contract with Yousign signature request ID
                        await db
                          .update(contracts)
                          .set({
                            yousignSignatureRequestId: yousignResult.signatureRequestId,
                            updatedAt: new Date(),
                          })
                          .where(eq(contracts.reservationId, metadata.reservationId));

                        console.log('[Stripe Webhook] Yousign signature request created:', yousignResult.signatureRequestId);
                      }
                    } catch (yousignError) {
                      console.error('[Stripe Webhook] Failed to initiate Yousign:', yousignError);
                      // Continue even if Yousign fails
                    }
                  }
                }
              } else {
                console.log('[Stripe Webhook] Deposit payment only, contract will be generated manually by agency');
              }

              if (fullReservation?.customer?.email) {
                // Send confirmation email
                try {
                  await sendPaymentConfirmedEmail({
                    to: fullReservation.customer.email,
                    customerName: `${fullReservation.customer.firstName || ''} ${fullReservation.customer.lastName || ''}`.trim(),
                    vehicle: {
                      brand: fullReservation.vehicle.brand,
                      model: fullReservation.vehicle.model,
                    },
                    yousignLink: contractPdfUrl, // Will be undefined if only deposit paid
                  });
                  console.log('[Stripe Webhook] Confirmation email sent to:', fullReservation.customer.email);
                } catch (emailError) {
                  console.error('[Stripe Webhook] Failed to send confirmation email:', emailError);
                  // Don't throw - email failure shouldn't fail the webhook
                }
              } else {
                console.log('[Stripe Webhook] Skipping email - no customer email found');
              }
            }
          } catch (dbError) {
            console.error('[Stripe Webhook] Error processing reservation payment:', dbError);
            throw dbError;
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
