import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  message,
  from,
}: SendEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Use custom from email if provided, otherwise use default
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'CARBLY <onboarding@resend.dev>';
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: message.replace(/\n/g, '<br>'),
      text: message,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
