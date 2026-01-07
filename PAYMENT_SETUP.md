# Payment Gateway Setup Guide

This document explains how to set up payment gateways for the Lavender Moon Villas booking system. The system supports both DimePay and PayPal payment options.

## Environment Variables Required

Add the following environment variables to your `.env.local` file and Vercel environment:

### DimePay Configuration

```env
# DimePay Configuration
DIMEPAY_API_URL=https://sandbox.api.dimepay.app/dapi/v1  # Use https://api.dimepay.app/dapi/v1 for production
DIMEPAY_CLIENT_KEY=your_client_key
DIMEPAY_ENVIRONMENT=sandbox  # 'production' or 'sandbox' (defaults to 'sandbox')
```

### PayPal Configuration

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # 'sandbox' for testing, 'live' for production (defaults to 'sandbox')
```

### Base URL (Required for both payment gateways)

```env
# Base URL for callbacks and origin field (REQUIRED for production)
# This is used for payment callback URLs
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Getting Your PayPal Credentials

1. **Create a PayPal Business Account**: If you don't have one, sign up at [PayPal Business](https://www.paypal.com/business)
2. **Access Developer Dashboard**: Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
3. **Create an App**:
   - Click "Create App" or "My Apps & Credentials"
   - Enter app name (e.g., "Hotel Lavender Moon")
   - Select environment (Sandbox for testing, Live for production)
   - Click "Create App"
4. **Get Credentials**:
   - Copy the **Client ID**
   - Copy the **Secret** (click "Show" to reveal)
   - Add these to your `.env.local` file

## Payment Flow

### User Payment Selection

Users can choose between DimePay and PayPal during checkout:
- **DimePay**: Credit/Debit Card payments (JMD currency)
- **PayPal**: PayPal account payments (USD currency)

### Payment Process

1. **User selects payment method** (DimePay or PayPal)
2. **Booking page calls appropriate initiate endpoint**:
   - DimePay: `/api/payments/dimepay/initiate`
   - PayPal: `/api/payments/paypal/initiate`
3. **User completes payment** on the payment gateway's secure page
4. **Payment gateway redirects to callback endpoint**:
   - DimePay: `/api/payments/dimepay/callback`
   - PayPal: `/api/payments/paypal/callback`
5. **Callback verifies payment** → Updates reservation status → Sends confirmation email
6. **User is redirected** to success or failure page

## Testing

### DimePay Testing

1. Use DimePay's sandbox environment (`DIMEPAY_ENVIRONMENT=sandbox`)
2. Use test credentials:
   - Card Number: `4111 1111 1111 1111`
   - Expiry Date: `12/25`
   - CVV: `123`
3. Complete a booking to test the full payment integration
4. Ensure callback URL is accessible from DimePay's servers

### PayPal Testing

1. Use PayPal's sandbox environment (`PAYPAL_ENVIRONMENT=sandbox`)
2. Use PayPal sandbox test accounts:
   - Personal account for buyer testing
   - Business account for merchant testing
3. Complete a booking to test the full payment integration
4. PayPal sandbox test cards can be found in PayPal Developer Dashboard

## Currency Considerations

- **DimePay**: Uses JMD (Jamaican Dollar)
- **PayPal**: Uses USD (US Dollar)

Ensure your pricing is appropriate for each currency, or implement currency conversion if needed.

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

- Never expose API keys or secrets in client-side code
- All sensitive operations happen server-side
- Payment callbacks verify payment authenticity
- DimePay uses `client_key` header authentication
- PayPal uses order capture verification

## Support

### DimePay
- API Documentation: https://docs.dimepay.net/
- Email: support@dimepay.net
- Dashboard: Submit support requests through Developer Dashboard

### PayPal
- Developer Documentation: https://developer.paypal.com/docs/
- Support: https://developer.paypal.com/support/




