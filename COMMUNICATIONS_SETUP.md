# Communications System Setup Guide

This guide will help you configure the communications system to send emails and SMS messages to your customers.

## Overview

The communications system integrates with:
- **Resend** - For sending emails
- **Twilio** - For sending SMS messages

## Prerequisites

### 1. Resend Setup (Email)

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. (Optional but recommended) Verify your domain to send from your own email address
   - Without domain verification, emails will be sent from `onboarding@resend.dev`
   - With domain verification, you can use `noreply@yourdomain.com`

### 2. Twilio Setup (SMS)

1. Create an account at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the console
3. Get a phone number:
   - For testing: Use the trial number provided
   - For production: Purchase a phone number

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Resend (Email)
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom sender email (must be from a verified domain)
# If not set, emails will be sent from onboarding@resend.dev
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Database Migration

Run the database migration to create the necessary tables:

```bash
npm run db:push
```

This will create:
- `message_templates` - Stores your custom message templates
- `communications` - Tracks all sent messages and their status

## Features

### 1. Template Management

Create reusable message templates for common communications:
- Booking confirmations
- Payment reminders
- Pickup/return reminders
- Thank you messages
- Custom templates for any use case

### 2. Send Messages

Send one-off messages to customers:
- **Email**: Rich text emails with custom subjects
- **SMS**: Short text messages (160 characters max)

### 3. Communication History

Track all sent messages with:
- Delivery status (pending, sent, delivered, failed)
- Timestamp
- Customer information
- Message content

## Usage

### Access the Communications Page

Navigate to `/communications` in your dashboard to:
1. Compose and send messages
2. Create and manage templates
3. View communication history

### Compose Tab
- Select message type (Email or SMS)
- Choose recipient from customer list
- Write or load from template
- Send immediately

### Templates Tab
- Create new templates
- Edit existing templates
- Delete templates
- Use templates in compose form

### History Tab
- View all sent communications
- Filter by status
- See delivery timestamps

## Testing

### Test Email (Resend)

1. Ensure `RESEND_API_KEY` is set in `.env.local`
2. Go to Communications → Compose
3. Select a customer with a valid email
4. Choose Email type
5. Enter subject and message
6. Click Send

Note: With Resend's free tier, you can send to verified email addresses only. Add test emails in your Resend dashboard.

### Test SMS (Twilio)

1. Ensure Twilio credentials are set in `.env.local`
2. Go to Communications → Compose
3. Select a customer with a valid phone number
4. Choose SMS type
5. Enter message (max 160 characters)
6. Click Send

Note: With Twilio trial account:
- You can only send to verified phone numbers
- Messages will include a trial disclaimer
- Verify phone numbers in Twilio console

## Troubleshooting

### Email not sending

- Check that `RESEND_API_KEY` is correctly set
- Verify the API key is valid in Resend dashboard
- Check customer has a valid email address
- Review error message in communication history

### SMS not sending

- Check that all Twilio credentials are set
- Verify phone number format (should include country code, e.g., +33123456789)
- Ensure customer phone number is verified (for trial accounts)
- Check Twilio console for delivery logs

### "Service is not configured" error

- Missing API keys in `.env.local`
- Restart your development server after adding environment variables

## Production Checklist

Before going live:

- [ ] Verify your domain in Resend
- [ ] Set `RESEND_FROM_EMAIL` to your domain email
- [ ] Upgrade Twilio account (remove trial limitations)
- [ ] Purchase a dedicated Twilio phone number
- [ ] Test with real customer data
- [ ] Set up monitoring for failed messages
- [ ] Review and comply with email/SMS regulations (GDPR, CAN-SPAM, etc.)

## API Integration

### Send Email Programmatically

```typescript
import { sendEmail } from '@/lib/communications';

const result = await sendEmail({
  to: 'customer@example.com',
  subject: 'Booking Confirmation',
  message: 'Your booking has been confirmed!',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Failed to send:', result.error);
}
```

### Send SMS Programmatically

```typescript
import { sendSMS } from '@/lib/communications';

const result = await sendSMS({
  to: '+33123456789',
  message: 'Your rental pickup is tomorrow at 10 AM!',
});

if (result.success) {
  console.log('SMS sent:', result.messageId);
} else {
  console.error('Failed to send:', result.error);
}
```

## Support

For issues specific to:
- **Resend**: Check [Resend Documentation](https://resend.com/docs)
- **Twilio**: Check [Twilio SMS Documentation](https://www.twilio.com/docs/sms)

## Security Notes

- Never commit `.env.local` to version control
- Keep API keys and tokens secure
- Rotate credentials regularly
- Use environment-specific credentials (dev/staging/production)
- Monitor usage to detect unusual activity
