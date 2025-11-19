import { db } from '@/lib/db';
import { messageTemplates } from '@/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';

export const defaultTemplates = [
  {
    name: 'Booking Confirmation',
    type: 'email' as const,
    subject: 'Your CARBLY Booking is Confirmed!',
    message: `Dear [Customer Name],

Thank you for booking with CARBLY! We're pleased to confirm your reservation.

Booking Details:
- Vehicle: [Vehicle Make & Model]
- Pickup Date: [Pickup Date]
- Return Date: [Return Date]
- Pickup Location: [Location]

Important Information:
- Please bring a valid driver's license and ID
- Arrive 15 minutes early for vehicle inspection
- Contact us at [Phone] if you need to modify your booking

We look forward to serving you!

Best regards,
The CARBLY Team`,
  },
  {
    name: 'Pickup Reminder',
    type: 'sms' as const,
    subject: null,
    message: 'Reminder: Your CARBLY rental pickup is tomorrow at [Time] at [Location]. See you soon!',
  },
  {
    name: 'Return Reminder',
    type: 'sms' as const,
    subject: null,
    message: 'Reminder: Please return your CARBLY rental by [Time] today at [Location]. Safe travels!',
  },
  {
    name: 'Thank You Message',
    type: 'email' as const,
    subject: 'Thank You for Choosing CARBLY',
    message: `Dear [Customer Name],

Thank you for choosing CARBLY for your rental needs. We hope you had a great experience!

Your feedback is important to us. Please take a moment to rate your experience and let us know how we did.

We'd love to serve you again on your next trip!

Loyalty Points Earned: [Points]

Best regards,
The CARBLY Team`,
  },
  {
    name: 'Payment Reminder',
    type: 'email' as const,
    subject: 'Payment Reminder - CARBLY Booking',
    message: `Dear [Customer Name],

This is a friendly reminder that payment for your CARBLY booking is pending.

Booking Details:
- Booking ID: [Booking ID]
- Amount Due: [Amount]
- Due Date: [Due Date]

Please complete payment at your earliest convenience to confirm your reservation.

You can make payment securely through your booking link or contact us for assistance.

Thank you,
The CARBLY Team`,
  },
  {
    name: 'Payment Confirmation',
    type: 'email' as const,
    subject: 'Payment Received - CARBLY',
    message: `Dear [Customer Name],

Thank you! We've received your payment for booking #[Booking ID].

Payment Details:
- Amount Paid: [Amount]
- Payment Date: [Date]
- Transaction ID: [Transaction ID]

Your reservation is now fully confirmed. We look forward to seeing you on [Pickup Date].

Best regards,
The CARBLY Team`,
  },
  {
    name: 'Welcome New Customer',
    type: 'email' as const,
    subject: 'Welcome to CARBLY!',
    message: `Dear [Customer Name],

Welcome to CARBLY! We're excited to have you as a customer.

With CARBLY, you can:
- Book vehicles easily online
- Manage your reservations
- Earn loyalty points with every rental
- Access exclusive member benefits

Your account is now active. Start exploring our fleet and book your next adventure!

Need help? Contact us anytime at [Email] or [Phone].

Happy travels,
The CARBLY Team`,
  },
  {
    name: 'Booking Cancellation',
    type: 'email' as const,
    subject: 'Booking Cancellation Confirmation',
    message: `Dear [Customer Name],

This email confirms the cancellation of your CARBLY booking.

Cancelled Booking:
- Booking ID: [Booking ID]
- Vehicle: [Vehicle]
- Original Dates: [Dates]

Refund Information:
- Refund Amount: [Amount]
- Processing Time: 5-7 business days

If you cancelled by mistake or need assistance with a new booking, please contact us immediately.

We hope to serve you again in the future!

Best regards,
The CARBLY Team`,
  },
  {
    name: 'Late Return Notice',
    type: 'sms' as const,
    subject: null,
    message: 'Your CARBLY rental was due at [Time]. Please return ASAP or call us at [Phone] to extend. Late fees may apply.',
  },
  {
    name: 'Damage Report',
    type: 'email' as const,
    subject: 'Vehicle Inspection Report - CARBLY',
    message: `Dear [Customer Name],

During the return inspection of your rental (Booking #[Booking ID]), we noted the following:

Inspection Findings:
[Damage Description]

Next Steps:
- We're reviewing the inspection report
- Insurance claim may be filed if applicable
- We'll contact you within 2 business days with details

If you have any questions or concerns, please contact us immediately.

Thank you for your cooperation,
The CARBLY Team`,
  },
  {
    name: 'Special Offer',
    type: 'email' as const,
    subject: 'Special Offer Just for You! 🎉',
    message: `Dear [Customer Name],

We have a special offer just for you!

[Offer Details]

Valid until: [Expiry Date]

Book now and save! Use code: [Promo Code]

Don't miss out on this exclusive deal!

Best regards,
The CARBLY Team`,
  },
];

/**
 * Seeds default message templates if they don't exist
 * Only creates templates marked as isDefault and with no teamId
 */
export async function seedDefaultTemplates() {
  try {
    // Check if default templates already exist
    const existing = await db.query.messageTemplates.findMany({
      where: eq(messageTemplates.isDefault, true),
    });

    if (existing.length > 0) {
      console.log(`Default templates already exist (${existing.length} found)`);
      return existing;
    }

    // Insert default templates
    const inserted = await db
      .insert(messageTemplates)
      .values(
        defaultTemplates.map((template) => ({
          ...template,
          teamId: null, // System-wide template
          isDefault: true,
        }))
      )
      .returning();

    console.log(`Created ${inserted.length} default templates`);
    return inserted;
  } catch (error) {
    console.error('Failed to seed default templates:', error);
    throw error;
  }
}

/**
 * Gets all default templates (system-wide)
 */
export async function getDefaultTemplates() {
  return db.query.messageTemplates.findMany({
    where: eq(messageTemplates.isDefault, true),
  });
}
