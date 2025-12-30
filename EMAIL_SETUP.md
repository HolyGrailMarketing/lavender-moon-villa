# Email Notifications Setup

This document explains how to set up email notifications for the Lavender Moon Villas booking system.

## Overview

The system sends automated emails for:
- ✅ **Booking Confirmations** - When payment is successful
- ✅ **Reservation Updates** - When admin modifies a reservation
- ✅ **Cancellations** - When a reservation is cancelled

## Email Service: Resend

We use [Resend](https://resend.com) for email delivery, which is:
- Easy to set up with Vercel
- Reliable and fast
- Free tier: 3,000 emails/month, 100 emails/day
- No credit card required for free tier

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Navigate to **API Keys** in the Resend dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "Lavender Moon Villas Production")
4. Copy the API key (you'll only see it once!)

### 3. Add Domain (Optional but Recommended)

For production, you should verify your domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain: `lavendermoon.net`
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (usually takes a few minutes)

**Note**: You can use Resend's default domain for testing, but production should use your own domain.

### 4. Configure Environment Variables

Add these to your `.env.local` file and Vercel environment variables:

```env
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email Configuration (optional - defaults provided)
EMAIL_FROM=Lavender Moon Villas <noreply@lavendermoon.net>
EMAIL_REPLY_TO=reservations@lavendermoon.net
```

**For Vercel:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `RESEND_API_KEY` with your API key
4. Optionally add `EMAIL_FROM` and `EMAIL_REPLY_TO`

### 5. Install Dependencies

```bash
npm install resend
```

## Email Templates

The system includes three email templates:

### Booking Confirmation
- Sent when payment is successful
- Includes reservation details, dates, room info, and total price
- Professional HTML template with branding

### Reservation Update
- Sent when admin modifies a reservation
- Lists all changes made
- Shows updated reservation details

### Cancellation
- Sent when a reservation is cancelled
- Confirms cancellation details
- Friendly message for future bookings

## Testing

### Test Email Sending

1. Complete a booking with payment
2. Check the guest's email inbox
3. Verify email formatting and content

### Development Mode

In development, if `RESEND_API_KEY` is not set, emails will be logged to the console instead of being sent. This prevents accidental email sends during development.

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check Domain**: If using custom domain, ensure DNS records are verified
3. **Check Logs**: Look for email errors in Vercel function logs
4. **Check Spam**: Emails might be in spam folder

### Common Errors

- **"RESEND_API_KEY not configured"**: Add the API key to environment variables
- **"Invalid API key"**: Verify the API key is correct and active
- **"Domain not verified"**: Complete domain verification in Resend dashboard

## Email Limits

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Unlimited domains

**Paid Plans:**
- Start at $20/month for 50,000 emails
- Higher limits available

## Security Notes

- Never commit API keys to git
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Monitor email sending in Resend dashboard

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
- Check Vercel function logs for email sending errors



