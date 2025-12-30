# WiPay Payment Integration Setup

This document explains how to set up WiPay payment integration for the Lavender Moon Villas booking system.

## Environment Variables Required

Add the following environment variables to your `.env.local` file and Vercel environment:

```env
# WiPay Configuration
WIPAY_API_URL=https://jm.wipayfinancial.com/plugins/payments/request
WIPAY_ACCOUNT_NUMBER=your_account_number
WIPAY_API_KEY=your_api_key
WIPAY_COUNTRY_CODE=JM  # ISO 3166-1 alpha-2 country code (JM for Jamaica)
WIPAY_ENVIRONMENT=sandbox  # 'live' for production, 'sandbox' for testing (defaults to 'sandbox' if not set)
WIPAY_FEE_STRUCTURE=merchant_absorb  # 'customer_pay', 'split', or 'merchant_absorb' (defaults to 'merchant_absorb')

# Base URL for callbacks and origin field (REQUIRED for production)
# This is used for the WiPay 'origin' field and callback URLs
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Database Schema Updates (Optional but Recommended)

For full payment tracking, add the following columns to the `reservations` table:

```sql
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
```

**Note:** The code will work without these columns, but payment tracking information won't be stored.

## How It Works

1. **Booking Flow:**
   - User selects dates and room
   - User enters guest information
   - Reservation is created with `pending` status
   - User is redirected to payment step

2. **Payment Initiation:**
   - Payment API generates WiPay payment parameters
   - User is redirected to WiPay's secure payment page
   - Payment parameters include:
     - `account_number` - Your WiPay merchant account
     - `order_id` - Unique order identifier
     - `amount` & `total` - Payment amount (formatted to 2 decimal places)
     - `currency` - JMD (Jamaican Dollar)
     - `country_code` - ISO 3166-1 alpha-2 code (e.g., JM)
     - `environment` - 'live' for production, 'sandbox' for testing (REQUIRED)
     - `fee_structure` - Transaction fee structure: 'customer_pay', 'split', or 'merchant_absorb' (REQUIRED)
     - `origin` - Domain name only (e.g., example.com) - no protocol or paths (REQUIRED)
     - `first_name`, `last_name`, `email`, `phone` - Customer info
     - `response_url` - Callback URL after payment
     - `hash` - SHA-256 hash for security verification

3. **Payment Callback:**
   - After payment (success or failure), WiPay redirects to `/api/payments/wipay/callback`
   - Callback verifies payment hash for security
   - Reservation status is updated:
     - `confirmed` if payment successful
     - Remains `pending` if payment failed
   - User is redirected to success or failed page

## Testing

1. **Test Mode:** Use WiPay's test/sandbox environment if available
2. **Payment Flow:** Complete a booking to test the full payment integration
3. **Callback Testing:** Ensure callback URL is accessible from WiPay's servers

## Fee Structure Options

The `fee_structure` parameter determines who pays the transaction fee:

- **`merchant_absorb`** (default): Merchant absorbs the full transaction fee. Customer pays exactly the amount shown.
- **`customer_pay`**: Customer pays the full transaction fee. The final total will be higher than the original amount.
- **`split`**: Transaction fee is split between merchant and customer. Half the fee is added to the customer's total.

**Recommendation:** Use `merchant_absorb` for better customer experience, as customers pay exactly what they see.

## Security Notes

- Payment hash is generated using SHA-256 for requests
- Hash verification uses MD5 for callbacks (transaction_id + total + api_key)
- Hash verification ensures payment callbacks are legitimate
- Never expose API keys in client-side code
- All sensitive operations happen server-side

## Support

For WiPay API documentation and support:
- API Documentation: https://wipaycaribbean.com/WiPay-API-Documentation.pdf
- Contact: https://www.wipay.io/contact

