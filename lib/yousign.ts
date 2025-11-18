'use server';

// Yousign API v3 integration
const YOUSIGN_API_URL = 'https://api-sandbox.yousign.app/v3';

interface YousignSignatureRequest {
  name: string;
  delivery_mode: 'email' | 'none';
  timezone: string;
}

interface YousignDocument {
  nature: 'signable_document';
  parse_anchors: boolean;
  file: string; // Base64 encoded file
  name: string;
}

interface YousignSigner {
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    locale: string;
  };
  signature_level: 'electronic_signature' | 'advanced_signature' | 'qualified_signature';
  signature_authentication_mode: 'no_otp' | 'otp_email' | 'otp_sms';
  fields?: Array<{
    document_id: string;
    type: 'signature' | 'text' | 'checkbox';
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
  error?: string;
}> {
  try {
    const apiKey = process.env.YOUSIGN_API_KEY;

    if (!apiKey) {
      return { error: 'Yousign API key not configured' };
    }

    // Download PDF from R2
    const pdfResponse = await fetch(data.contractPdfUrl);
    if (!pdfResponse.ok) {
      return { error: 'Failed to fetch contract PDF' };
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Step 1: Create signature request
    const signatureRequestResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Contrat de location - ${data.reservationId.slice(0, 8)}`,
        delivery_mode: 'email',
        timezone: 'Europe/Paris',
        email_custom_note: 'Veuillez signer ce contrat de location de véhicule.',
      } as YousignSignatureRequest),
    });

    if (!signatureRequestResponse.ok) {
      const errorData = await signatureRequestResponse.json();
      console.error('[Yousign] Create signature request failed:', errorData);
      return { error: 'Failed to create signature request' };
    }

    const signatureRequest = await signatureRequestResponse.json();
    const signatureRequestId = signatureRequest.id;

    // Step 2: Upload document
    const documentResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nature: 'signable_document',
          parse_anchors: false,
          file: pdfBase64,
          name: `contrat-${data.reservationId.slice(0, 8)}.pdf`,
        } as YousignDocument),
      }
    );

    if (!documentResponse.ok) {
      const errorData = await documentResponse.json();
      console.error('[Yousign] Upload document failed:', errorData);
      return { error: 'Failed to upload document' };
    }

    const document = await documentResponse.json();

    // Step 3: Add signer
    const signerResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/signers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          info: {
            first_name: data.customer.firstName,
            last_name: data.customer.lastName,
            email: data.customer.email,
            phone_number: data.customer.phone,
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: data.customer.phone ? 'otp_sms' : 'otp_email',
          fields: [
            {
              document_id: document.id,
              type: 'signature',
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
      console.error('[Yousign] Add signer failed:', errorData);
      return { error: 'Failed to add signer' };
    }

    // Step 4: Activate signature request
    const activateResponse = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/activate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!activateResponse.ok) {
      const errorData = await activateResponse.json();
      console.error('[Yousign] Activate signature request failed:', errorData);
      return { error: 'Failed to activate signature request' };
    }

    return { signatureRequestId };
  } catch (error) {
    console.error('[createYousignSignatureRequest]', error);
    return { error: 'Failed to create Yousign signature request' };
  }
}

export async function getYousignSignatureRequest(signatureRequestId: string): Promise<{
  status?: string;
  signedFileUrl?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.YOUSIGN_API_KEY;

    if (!apiKey) {
      return { error: 'Yousign API key not configured' };
    }

    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return { error: 'Failed to fetch signature request' };
    }

    const data = await response.json();

    return {
      status: data.status,
      signedFileUrl: data.documents?.[0]?.signed_file_url,
    };
  } catch (error) {
    console.error('[getYousignSignatureRequest]', error);
    return { error: 'Failed to fetch signature request' };
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
      return { error: 'Yousign API key not configured' };
    }

    const response = await fetch(
      `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents/${documentId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return { error: 'Failed to download signed document' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    return { fileBuffer };
  } catch (error) {
    console.error('[downloadYousignSignedDocument]', error);
    return { error: 'Failed to download signed document' };
  }
}
