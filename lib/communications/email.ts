import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Carbly brand colors
const COLORS = {
  primary: '#3B4FD9',
  primaryDark: '#2D3FB8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

/**
 * Wrap email content in Carbly-branded HTML template
 */
function wrapEmailContent(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carbly</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.white}; letter-spacing: -0.5px;">
                🚗 Carbly
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: ${COLORS.white}; padding: 32px; border-left: 1px solid ${COLORS.border}; border-right: 1px solid ${COLORS.border};">
              <div style="color: ${COLORS.text}; font-size: 15px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.white}; padding: 24px 32px; border-top: 1px solid ${COLORS.border}; border-radius: 0 0 12px 12px; border-left: 1px solid ${COLORS.border}; border-right: 1px solid ${COLORS.border}; border-bottom: 1px solid ${COLORS.border};">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted}; text-align: center;">
                Cet email a été envoyé via <strong style="color: ${COLORS.primary};">Carbly</strong><br>
                La plateforme de gestion de location de véhicules
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Convert plain text message to styled HTML
 */
function formatMessageToHtml(message: string): string {
  // Convert line breaks to HTML
  let html = message.replace(/\n/g, '<br>');
  
  // Style bullet points
  html = html.replace(/• /g, '<span style="color: #3B4FD9;">•</span> ');
  html = html.replace(/- /g, '<span style="color: #3B4FD9;">•</span> ');
  
  return html;
}

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
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'Carbly <carbly@sumbo.fr>';
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    // Format message and wrap in template
    const htmlContent = formatMessageToHtml(message);
    const fullHtml = wrapEmailContent(htmlContent);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: fullHtml,
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

