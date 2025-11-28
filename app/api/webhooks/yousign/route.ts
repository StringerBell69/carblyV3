import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, reservations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { downloadYousignSignedDocument } from "@/lib/yousign";
import { uploadToR2 } from "@/lib/r2";
import { sendContractSignedEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Yousign webhook events
    const eventType = body.event_name;

    console.log("[Yousign Webhook] Event received:", eventType);
    console.log("[Yousign Webhook] Payload:", JSON.stringify(body, null, 2));

    switch (eventType) {
      case "signature_request.done": {
        // Yousign webhook v3 nests data inside body.data.signature_request
        const signatureRequestId = body.data?.signature_request?.id || body.signature_request?.id;

        if (!signatureRequestId) {
          console.error("[Yousign Webhook] Missing signature request ID");
          console.error("[Yousign Webhook] Full payload:", JSON.stringify(body, null, 2));
          return NextResponse.json(
            { error: "Missing signature request ID" },
            { status: 400 }
          );
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
          console.warn(
            "[Yousign Webhook] Contract not found for signature request:",
            signatureRequestId
          );
          // Retourner 200 pour éviter les retry de Yousign
          return NextResponse.json(
            { received: true, warning: "Contract not found" },
            { status: 200 }
          );
        }

        console.log("[Yousign Webhook] Processing contract:", contract.id);

        // Download signed PDF - check both payload structures
        const documentId = body.data?.signature_request?.documents?.[0]?.id ||
                          body.signature_request?.documents?.[0]?.id;
        if (!documentId) {
          console.error("[Yousign Webhook] No document ID found in payload");
          console.error("[Yousign Webhook] Full payload:", JSON.stringify(body, null, 2));
          return NextResponse.json(
            { error: "No document ID" },
            { status: 400 }
          );
        }

        console.log(
          "[Yousign Webhook] Downloading signed document:",
          documentId
        );

        const { fileBuffer, error } = await downloadYousignSignedDocument(
          signatureRequestId,
          documentId
        );

        if (error || !fileBuffer) {
          console.error(
            "[Yousign Webhook] Failed to download signed document:",
            error
          );
          // Retourner 200 pour éviter les retry, mais logger l'erreur
          return NextResponse.json(
            { received: true, error: "Failed to download document" },
            { status: 200 }
          );
        }

        console.log(
          "[Yousign Webhook] Document downloaded, size:",
          fileBuffer.length,
          "bytes"
        );

        // Upload signed PDF to R2
        const signedPdfPath = `contracts/${contract.reservation.teamId}/${contract.reservationId}-signed.pdf`;

        console.log("[Yousign Webhook] Uploading to R2:", signedPdfPath);

        const signedPdfUrl = await uploadToR2({
          file: fileBuffer,
          path: signedPdfPath,
          contentType: "application/pdf",
        });

        console.log("[Yousign Webhook] Uploaded to R2:", signedPdfUrl);

        // Update contract
        await db
          .update(contracts)
          .set({
            signedAt: new Date(),
            signedPdfUrl,
          })
          .where(eq(contracts.id, contract.id));

        console.log("[Yousign Webhook] Contract updated in database");

        // Update reservation status to confirmed
        await db
          .update(reservations)
          .set({
            status: "confirmed",
          })
          .where(eq(reservations.id, contract.reservationId));

        console.log(
          "[Yousign Webhook] Reservation status updated to confirmed"
        );

        // Send confirmation email
        if (contract.reservation.customer) {
          try {
            await sendContractSignedEmail({
              to: contract.reservation.customer.email,
              customerName: `${contract.reservation.customer.firstName} ${contract.reservation.customer.lastName}`,
              vehicle: {
                brand: contract.reservation.vehicle.brand,
                model: contract.reservation.vehicle.model,
              },
              dates: {
                start:
                  contract.reservation.startDate.toLocaleDateString("fr-FR"),
                end: contract.reservation.endDate.toLocaleDateString("fr-FR"),
              },
              pickupAddress:
                contract.reservation.team.address ||
                contract.reservation.team.name,
              contractPdfUrl: signedPdfUrl,
            });
            console.log(
              "[Yousign Webhook] Confirmation email sent to:",
              contract.reservation.customer.email
            );
          } catch (emailError) {
            // Ne pas échouer le webhook si l'email échoue
            console.error(
              "[Yousign Webhook] Failed to send confirmation email:",
              emailError
            );
          }
        }

        console.log(
          "[Yousign Webhook] Contract signed and processed successfully:",
          contract.id
        );
        break;
      }

      case "signature_request.declined":
      case "signature_request.expired": {
        // Yousign webhook v3 nests data inside body.data.signature_request
        const signatureRequestId = body.data?.signature_request?.id || body.signature_request?.id;

        if (!signatureRequestId) {
          console.error("[Yousign Webhook] Missing signature request ID");
          return NextResponse.json(
            { error: "Missing signature request ID" },
            { status: 400 }
          );
        }

        console.log(
          "[Yousign Webhook] Processing declined/expired signature request:",
          signatureRequestId
        );

        // Find contract and update reservation status
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.yousignSignatureRequestId, signatureRequestId),
        });

        if (contract) {
          await db
            .update(reservations)
            .set({
              status: "cancelled",
            })
            .where(eq(reservations.id, contract.reservationId));

          console.log(
            "[Yousign Webhook] Reservation cancelled for contract:",
            contract.id
          );
        } else {
          console.warn(
            "[Yousign Webhook] Contract not found for declined/expired signature:",
            signatureRequestId
          );
        }
        break;
      }

      case "signature_request.activated":
        console.log(
          "[Yousign Webhook] Signature request activated:",
          body.data?.signature_request?.id || body.signature_request?.id
        );
        break;

      case "signer.done":
        console.log(
          "[Yousign Webhook] Signer completed signing:",
          body.data?.signer?.id || body.signer?.id
        );
        break;

      default:
        console.log("[Yousign Webhook] Unhandled event type:", eventType);
    }

    // Toujours retourner 200 pour confirmer la réception
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Yousign Webhook] Error processing event:", error);

    // Retourner 200 même en cas d'erreur pour éviter les retry de Yousign
    return NextResponse.json(
      { received: true, error: "Internal error occurred" },
      { status: 200 }
    );
  }
}
