"use server";

// Yousign API v3 integration
const YOUSIGN_API_URL = "https://api-sandbox.yousign.app/v3";

interface YousignSigner {
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    locale: string;
  };
  signature_level:
    | "electronic_signature"
    | "advanced_signature"
    | "qualified_signature";
  signature_authentication_mode: "no_otp" | "otp_email" | "otp_sms";
  fields?: Array<{
    document_id: string;
    type: "signature" | "text" | "checkbox";
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
}

export async function createYousignSignatureRequest(data: {
  contractPdfUrl: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  reservationId: string;
}): Promise<{
  signatureRequestId?: string;
  signatureLink?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.YOUSIGN_API_KEY;

    if (!apiKey) {
      return { error: "Yousign API key not configured" };
    }

    // Step 1: Create signature request first
    const signatureRequestResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Contrat de location - ${data.reservationId.slice(0, 8)}`,
          delivery_mode: "email",
          timezone: "Europe/Paris",
          email_custom_note:
            "Veuillez signer ce contrat de location de véhicule.",
        }),
      }
    );

    if (!signatureRequestResponse.ok) {
      const errorData = await signatureRequestResponse.json();
      console.error("[Yousign] Create signature request failed:", errorData);
      return { error: "Failed to create signature request" };
    }

    const signatureRequest = await signatureRequestResponse.json();
    const signatureRequestId = signatureRequest.id;

    // Step 2: Download PDF and upload as multipart/form-data
    const pdfResponse = await fetch(data.contractPdfUrl);
    if (!pdfResponse.ok) {
      return { error: "Failed to fetch contract PDF" };
    }

    const pdfBlob = await pdfResponse.blob();

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append(
      "file",
      pdfBlob,
      `contrat-${data.reservationId.slice(0, 8)}.pdf`
    );
    formData.append("nature", "signable_document");

    const documentUploadResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // Ne pas définir Content-Type, FormData le fait automatiquement
        },
        body: formData,
      }
    );

    if (!documentUploadResponse.ok) {
      const errorData = await documentUploadResponse.json();
      console.error("[Yousign] Upload document failed:", errorData);
      return { error: "Failed to upload document" };
    }

    const document = await documentUploadResponse.json();
    const documentId = document.id;

    // Step 3: Add signer
    const signerResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/signers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          info: {
            first_name: data.customer.firstName,
            last_name: data.customer.lastName,
            email: data.customer.email,
            phone_number: data.customer.phone,
            locale: "fr",
          },
          signature_level: "electronic_signature",
          signature_authentication_mode: data.customer.phone
            ? "otp_sms"
            : "otp_email",
          fields: [
            {
              document_id: documentId,
              type: "signature",
              page: 1,
              x: 100,
              y: 650,
              width: 150,
              height: 50,
            },
          ],
        } as YousignSigner),
      }
    );

    if (!signerResponse.ok) {
      const errorData = await signerResponse.json();
      console.error("[Yousign] Add signer failed:", errorData);
      return { error: "Failed to add signer" };
    }

    const signer = await signerResponse.json();

    // Step 4: Activate signature request
    const activateResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/activate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!activateResponse.ok) {
      const errorData = await activateResponse.json();
      console.error("[Yousign] Activate signature request failed:", errorData);
      return { error: "Failed to activate signature request" };
    }

    // Get the signature link from the signer object
    const signatureLink = signer.signature_link;

    return { signatureRequestId, signatureLink };
  } catch (error) {
    console.error("[createYousignSignatureRequest]", error);
    return { error: "Failed to create Yousign signature request" };
  }
}

export async function getYousignSignatureRequest(
  signatureRequestId: string
): Promise<{
  status?: string;
  signedFileUrl?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.YOUSIGN_API_KEY;

    if (!apiKey) {
      return { error: "Yousign API key not configured" };
    }

    const response = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to fetch signature request" };
    }

    const data = await response.json();

    return {
      status: data.status,
      signedFileUrl: data.documents?.[0]?.signed_file_url,
    };
  } catch (error) {
    console.error("[getYousignSignatureRequest]", error);
    return { error: "Failed to fetch signature request" };
  }
}

export async function downloadYousignSignedDocument(
  signatureRequestId: string,
  documentId: string
): Promise<{
  fileBuffer?: Buffer;
  error?: string;
}> {
  try {
    const apiKey = process.env.YOUSIGN_API_KEY;

    if (!apiKey) {
      return { error: "Yousign API key not configured" };
    }

    const response = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents/${documentId}/download`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to download signed document" };
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    return { fileBuffer };
  } catch (error) {
    console.error("[downloadYousignSignedDocument]", error);
    return { error: "Failed to download signed document" };
  }
}
