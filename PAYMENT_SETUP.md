# Payment Gateway Setup Guide

This document explains how to set up payment gateways for the Lavender Moon Villas booking system. The system supports both WiPay and PayPal payment options.

## Environment Variables Required

Add the following environment variables to your `.env.local` file and Vercel environment:

### WiPay Configuration

```env
# WiPay Configuration
WIPAY_API_URL=https://jm.wipayfinancial.com/plugins/payments/request
WIPAY_ACCOUNT_NUMBER=your_account_number
WIPAY_API_KEY=your_api_key
WIPAY_COUNTRY_CODE=JM  # ISO 3166-1 alpha-2 country code (JM for Jamaica)
WIPAY_ENVIRONMENT=sandbox  # 'live' for production, 'sandbox' for testing (defaults to 'sandbox' if not set)
WIPAY_FEE_STRUCTURE=merchant_absorb  # 'customer_pay', 'split', or 'merchant_absorb' (defaults to 'merchant_absorb')
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

Users can choose between WiPay and PayPal during checkout:
- **WiPay**: Credit/Debit Card payments (JMD currency)
- **PayPal**: PayPal account payments (USD currency)

### Payment Process

1. **User selects payment method** (WiPay or PayPal)
2. **Booking page calls appropriate initiate endpoint**:
   - WiPay: `/api/payments/wipay/initiate`
   - PayPal: `/api/payments/paypal/initiate`
3. **User completes payment** on the payment gateway's secure page
4. **Payment gateway redirects to callback endpoint**:
   - WiPay: `/api/payments/wipay/callback`
   - PayPal: `/api/payments/paypal/callback`
5. **Callback verifies payment** → Updates reservation status → Sends confirmation email
6. **User is redirected** to success or failure page

## Testing

### WiPay Testing

1. Use WiPay's sandbox/test environment
2. Complete a booking to test the full payment integration
3. Ensure callback URL is accessible from WiPay's servers

### PayPal Testing

1. Use PayPal's sandbox environment (`PAYPAL_ENVIRONMENT=sandbox`)
2. Use PayPal sandbox test accounts:
   - Personal account for buyer testing
   - Business account for merchant testing
3. Complete a booking to test the full payment integration
4. PayPal sandbox test cards can be found in PayPal Developer Dashboard

## Currency Considerations

- **WiPay**: Uses JMD (Jamaican Dollar)
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
- WiPay uses hash verification (MD5 for callbacks)
- PayPal uses order capture verification

## Support

### WiPay
- API Documentation: https://wipaycaribbean.com/WiPay-API-Documentation.pdf
- Contact: https://www.wipay.io/contact

### PayPal
- Developer Documentation: https://developer.paypal.com/docs/
- Support: https://developer.paypal.com/support/


