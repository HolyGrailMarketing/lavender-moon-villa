import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PayPal environment configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox' // 'sandbox' or 'live'

// Import PayPal SDK dynamically to avoid ESM/CommonJS issues
function getPaypalSDK() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@paypal/checkout-server-sdk')
}

// Create PayPal client
function paypalClient() {
  const paypal = getPaypalSDK()
  const environment = PAYPAL_ENVIRONMENT === 'live'
    ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
  
  return new paypal.core.PayPalHttpClient(environment)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { reservation_id, amount, customer_name, customer_email } = data

    if (!reservation_id || !amount || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 500 }
      )
    }

    // Verify reservation exists and is pending
    const reservation = await sql`
      SELECT id, status, total_price FROM reservations WHERE id = ${reservation_id}
    `

    if (reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Reservation is not in pending status' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/payments/paypal/callback`

    // Format amount for PayPal (2 decimal places, as string)
    const totalAmount = parseFloat(amount.toString()).toFixed(2)

    // Create PayPal order request
    const paypal = getPaypalSDK()
    const orderRequest = new paypal.orders.OrdersCreateRequest()
    orderRequest.prefer('return=representation')
    orderRequest.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `RES-${reservation_id}`,
        description: `Reservation #${reservation_id} - Lavender Moon Villas`,
        amount: {
          currency_code: 'USD', // PayPal typically uses USD
          value: totalAmount,
        },
      }],
      application_context: {
        brand_name: 'Lavender Moon Villas',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: callbackUrl,
        cancel_url: `${baseUrl}/book/payment/failed?reason=cancelled`,
      },
      payer: {
        name: {
          given_name: customer_name.split(' ')[0] || customer_name,
          surname: customer_name.split(' ').slice(1).join(' ') || '',
        },
        email_address: customer_email,
      },
    })

    // Execute PayPal order creation
    const client = paypalClient()
    const order = await client.execute(orderRequest)

    // Store PayPal order ID in database
    const paypalOrderId = order.result.id
    try {
      await sql`
        UPDATE reservations 
        SET payment_reference = ${paypalOrderId}
        WHERE id = ${reservation_id}
      `
    } catch (error: any) {
      console.warn('Could not update payment_reference:', error.message)
    }

    // Find approval URL from order links
    const approvalUrl = order.result.links?.find((link: any) => link.rel === 'approve')?.href

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'Failed to get PayPal approval URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: paypalOrderId,
      approval_url: approvalUrl,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error initiating PayPal payment:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate payment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

