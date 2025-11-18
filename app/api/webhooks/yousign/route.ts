import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts, reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { downloadYousignSignedDocument } from '@/lib/yousign';
import { uploadToR2 } from '@/lib/r2';
import { sendContractSignedEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Yousign webhook events
    const eventType = body.event_name;

    console.log('[Yousign Webhook] Event received:', eventType);

    switch (eventType) {
      case 'signature_request.done': {
        const signatureRequestId = body.signature_request?.id;

        if (!signatureRequestId) {
          return NextResponse.json({ error: 'Missing signature request ID' }, { status: 400 });
        }

        // Find contract by Yousign signature request ID
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.yousignSignatureRequestId, signatureRequestId),
          with: {
            reservation: {
              with: {
                vehicle: true,
                customer: true,
                team: true,
              },
            },
          },
        });

        if (!contract) {
          console.warn('[Yousign Webhook] Contract not found for signature request:', signatureRequestId);
          return NextResponse.json({ received: true });
        }

        // Download signed PDF
        const documentId = body.signature_request?.documents?.[0]?.id;
        if (!documentId) {
          console.error('[Yousign Webhook] No document ID found');
          return NextResponse.json({ error: 'No document ID' }, { status: 400 });
        }

        const { fileBuffer, error } = await downloadYousignSignedDocument(
          signatureRequestId,
          documentId
        );

        if (error || !fileBuffer) {
          console.error('[Yousign Webhook] Failed to download signed document:', error);
          return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
        }

        // Upload signed PDF to R2
        const signedPdfPath = `contracts/${contract.reservation.teamId}/${contract.reservationId}-signed.pdf`;
        const signedPdfUrl = await uploadToR2({
          file: fileBuffer,
          path: signedPdfPath,
          contentType: 'application/pdf',
        });

        // Update contract
        await db
          .update(contracts)
          .set({
            signedAt: new Date(),
            signedPdfUrl,
          })
          .where(eq(contracts.id, contract.id));

        // Update reservation status to confirmed
        await db
          .update(reservations)
          .set({
            status: 'confirmed',
          })
          .where(eq(reservations.id, contract.reservationId));

        // Send confirmation email
        await sendContractSignedEmail({
          to: contract.reservation.customer.email,
          customerName: `${contract.reservation.customer.firstName} ${contract.reservation.customer.lastName}`,
          vehicle: {
            brand: contract.reservation.vehicle.brand,
            model: contract.reservation.vehicle.model,
          },
          dates: {
            start: contract.reservation.startDate.toLocaleDateString('fr-FR'),
            end: contract.reservation.endDate.toLocaleDateString('fr-FR'),
          },
          pickupAddress: contract.reservation.team.address || contract.reservation.team.name,
          contractPdfUrl: signedPdfUrl,
        });

        console.log('[Yousign Webhook] Contract signed and processed:', contract.id);
        break;
      }

      case 'signature_request.declined':
      case 'signature_request.expired': {
        const signatureRequestId = body.signature_request?.id;

        if (!signatureRequestId) {
          return NextResponse.json({ error: 'Missing signature request ID' }, { status: 400 });
        }

        // Find contract and update reservation status
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.yousignSignatureRequestId, signatureRequestId),
        });

        if (contract) {
          await db
            .update(reservations)
            .set({
              status: 'cancelled',
            })
            .where(eq(reservations.id, contract.reservationId));

          console.log('[Yousign Webhook] Contract declined/expired:', contract.id);
        }
        break;
      }

      default:
        console.log('[Yousign Webhook] Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Yousign Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
