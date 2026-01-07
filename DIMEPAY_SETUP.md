# DimePay Web SDK Integration Setup

This document explains how to set up DimePay Web SDK integration for the Lavender Moon Villas booking system.

## Environment Variables Required

Add the following environment variables to your `.env.local` file and Vercel environment:

```env
# DimePay Configuration (Web SDK)
DIMEPAY_CLIENT_ID=your_client_id_here
DIMEPAY_SECRET_KEY=your_secret_key_here
DIMEPAY_ENVIRONMENT=sandbox  # 'production' or 'sandbox' (defaults to 'sandbox')

# For frontend access
NEXT_PUBLIC_DIMEPAY_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_DIMEPAY_ENVIRONMENT=sandbox

# Base URL for callbacks (REQUIRED for production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Getting Your DimePay Credentials

1. **Sign up for DimePay**: Register at [DimePay Dashboard](https://docs.dimepay.net/)
2. **Navigate to Developer Section**: Get your API credentials
3. **Get your credentials**:
   - `CLIENT_ID` (e.g., `ck_xxxxxxxxxxxxxxx`) - Used in frontend SDK
   - `SECRET_KEY` - Used to sign JWT tokens on backend (keep this secret!)
4. **Add to Environment**: Add both keys to your `.env.local` file

## How It Works

### 1. **Booking Flow:**
   - User selects dates and room
   - User enters guest information
   - Reservation is created with `pending` status
   - User is redirected to payment step

### 2. **Payment Initiation:**
   - Backend generates a signed JWT containing order details
   - JWT is signed with your `SECRET_KEY`
   - User is redirected to a dedicated payment page (`/book/payment/dimepay`)
   - Page loads the DimePay Web SDK with the signed JWT

### 3. **Payment Processing:**
   - DimePay SDK handles the secure payment flow
   - User enters card details in DimePay's secure iframe
   - Payment is processed by DimePay

### 4. **Payment Callback:**
   - DimePay sends a webhook to `/api/payments/dimepay/webhook`
   - Webhook verifies payment and updates reservation:
     - `paid_in_full` if full payment received
     - `deposit_paid` if partial payment received
     - Remains `pending` if payment failed
   - User is redirected to success or failure page

## Testing

### Sandbox Environment

Use DimePay's sandbox environment for testing:

```env
DIMEPAY_ENVIRONMENT=sandbox
NEXT_PUBLIC_DIMEPAY_ENVIRONMENT=sandbox
```

### Test Cards

According to DimePay documentation:
- **Card Number**: `4111 1111 1111 1111`
- **Expiry Date**: `12/25`
- **CVV**: `123`

Use these credentials to simulate successful transactions.

## JWT Payload Structure

The backend generates a JWT with the following structure (as per DimePay SDK requirements):

```json
{
  "id": "RES-123-1234567890",
  "total": 5000,
  "subtotal": 4500,
  "description": "Reservation description",
  "tax": 0,
  "currency": "JMD",
  "items": [{
    "id": "ROOM-101-123",
    "price": 1500,
    "sku": "ROOM-101",
    "quantity": 3,
    "name": "Room 101 - Suite Name",
    "imageUrl": "https://..."
  }],
  "fulfilled": false,
  "shippingPerson": {
    "name": "Guest Name",
    "email": "guest@example.com",
    "street": "Address",
    "city": "City",
    "countryCode": "JM",
    "countryName": "Jamaica",
    "postalCode": "00000",
    "phone": "+1234567890"
  },
  "billingPerson": {...},
  "webhookUrl": "https://your-domain.com/api/payments/dimepay/webhook",
  "metadata": {
    "reservation_id": 123
  }
}
```

## Database Schema

For full payment tracking, ensure the following columns exist in the `reservations` table:

```sql
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
```

**Note:** The code will work without these columns, but payment tracking information won't be stored.

## Security Notes

- JWT tokens are signed with your `SECRET_KEY` on the backend
- **Never expose your SECRET_KEY** in client-side code
- All payment processing happens in DimePay's secure environment
- Webhooks verify payment status with DimePay
- Tokens are single-use and expire after payment completion

## Webhook Configuration

Make sure your webhook URL is accessible:
- **Development**: Use ngrok or similar for local testing
- **Production**: Ensure `https://your-domain.com/api/payments/dimepay/webhook` is publicly accessible

Configure the webhook URL in your DimePay dashboard if required.

## SDK Installation

The required packages are already installed:

```bash
npm install @dimepay/web-sdk jsonwebtoken @types/jsonwebtoken
```

## Support

For DimePay API documentation and support:
- API Documentation: https://docs.dimepay.net/
- Web SDK: https://docs.dimepay.net/-dime-sdks/dime-react-native-sdk
- Email: support@dimepay.net
- Dashboard: Submit a support request through the Developer Dashboard

## Troubleshooting

### Common Issues:

1. **"Payment token generation failed"**
   - Check that `DIMEPAY_SECRET_KEY` is set correctly
   - Verify reservation exists and is in `pending` status

2. **"DimePay client ID not configured"**
   - Ensure `NEXT_PUBLIC_DIMEPAY_CLIENT_ID` is set in environment variables
   - Restart development server after adding environment variables

3. **SDK not loading**
   - Check browser console for errors
   - Verify the `@dimepay/web-sdk` package is installed
   - Ensure you're using the correct client ID

4. **Webhook not received**
   - For local development, use ngrok or similar to expose your webhook
   - Check that webhook URL is publicly accessible
   - Verify webhook URL in DimePay dashboard

## Migration from Old API Approach

If you previously used the REST API approach (`/api/payments/dimepay/initiate`), you can now delete:
- `src/app/api/payments/dimepay/initiate/route.ts`
- `src/app/api/payments/dimepay/callback/route.ts` (if not using webhooks)

The new approach uses:
- `src/app/api/payments/dimepay/generate-token/route.ts` - Generates JWT
- `src/app/api/payments/dimepay/webhook/route.ts` - Handles payment webhooks
- `src/app/book/payment/dimepay/page.tsx` - Payment page with Web SDK

