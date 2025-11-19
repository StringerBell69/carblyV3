import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

export interface SendSMSParams {
  to: string;
  message: string;
  from?: string;
}

export async function sendSMS({
  to,
  message,
  from,
}: SendSMSParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('Twilio credentials are not configured');
      return {
        success: false,
        error: 'SMS service is not configured',
      };
    }

    if (!process.env.TWILIO_PHONE_NUMBER && !from) {
      console.error('TWILIO_PHONE_NUMBER is not configured');
      return {
        success: false,
        error: 'SMS sender number is not configured',
      };
    }

    const client = getTwilioClient();

    const messageResponse = await client.messages.create({
      body: message,
      from: from || process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return {
      success: true,
      messageId: messageResponse.sid,
    };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}
