/**
 * Application feature flags
 */

/**
 * Online payment collection at booking time.
 *
 * When false, guests complete a booking without paying and settle the balance
 * on arrival at check-in. Their reservation is created with status 'confirmed'
 * and the confirmation email is sent immediately.
 *
 * Set to true to re-enable the DimePay/PayPal step in the booking wizard.
 * All payment routes and pages under /api/payments and /book/payment remain
 * in place and dormant while this is false.
 */
export const PAYMENTS_ENABLED = false
