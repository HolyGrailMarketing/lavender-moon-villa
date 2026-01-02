import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PayPal environment configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox' // 'sandbox' or 'live'

// Log environment on module load (for debugging - only on server)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('PayPal Configuration:', {
    environment: PAYPAL_ENVIRONMENT,
    hasClientId: !!PAYPAL_CLIENT_ID,
    hasClientSecret: !!PAYPAL_CLIENT_SECRET,
    clientIdPrefix: PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 10) + '...' : 'missing'
  })
}

// Log environment on module load (for debugging)
if (typeof window === 'undefined') {
  console.log('PayPal Configuration:', {
    environment: PAYPAL_ENVIRONMENT,
    hasClientId: !!PAYPAL_CLIENT_ID,
    hasClientSecret: !!PAYPAL_CLIENT_SECRET,
    clientIdPrefix: PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 10) + '...' : 'missing'
  })
}

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
      console.error('PayPal credentials missing:', {
        hasClientId: !!PAYPAL_CLIENT_ID,
        hasClientSecret: !!PAYPAL_CLIENT_SECRET,
        environment: PAYPAL_ENVIRONMENT
      })
      return NextResponse.json(
        { error: 'PayPal credentials not configured. Please check your environment variables.' },
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
    
    // Log order request details (without sensitive data)
    console.log('Creating PayPal order:', {
      environment: PAYPAL_ENVIRONMENT,
      intent: 'CAPTURE',
      amount: totalAmount,
      currency: 'USD',
      reservation_id: reservation_id
    })
    
    const order = await client.execute(orderRequest)
    
    // Log order creation result
    console.log('PayPal order created:', {
      orderId: order.result.id,
      status: order.result.status,
      linksCount: order.result.links?.length || 0
    })

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
      console.error('PayPal approval URL not found in order links:', order.result.links)
      return NextResponse.json(
        { error: 'Failed to get PayPal approval URL' },
        { status: 500 }
      )
    }

    // Log the approval URL for debugging (first 50 chars to avoid logging full URL with sensitive data)
    console.log('PayPal approval URL generated:', {
      urlPrefix: approvalUrl.substring(0, 50) + '...',
      environment: PAYPAL_ENVIRONMENT,
      orderId: paypalOrderId,
      isSandboxUrl: approvalUrl.includes('sandbox.paypal.com'),
      isLiveUrl: approvalUrl.includes('www.paypal.com')
    })

    // Verify URL matches environment
    if (PAYPAL_ENVIRONMENT === 'sandbox' && !approvalUrl.includes('sandbox.paypal.com')) {
      console.warn('WARNING: Sandbox environment but approval URL does not contain "sandbox.paypal.com"')
    }
    if (PAYPAL_ENVIRONMENT === 'live' && !approvalUrl.includes('www.paypal.com')) {
      console.warn('WARNING: Live environment but approval URL does not contain "www.paypal.com"')
    }

    return NextResponse.json({
      order_id: paypalOrderId,
      approval_url: approvalUrl,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error initiating PayPal payment:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    // Check for authentication errors specifically
    const isAuthError = error.statusCode === 401 || 
                       (error.message && error.message.includes('invalid_client')) ||
                       (error.message && error.message.includes('Client Authentication failed'))
    
    if (isAuthError) {
      console.error('PayPal authentication failed. Check your credentials:', {
        hasClientId: !!PAYPAL_CLIENT_ID,
        hasClientSecret: !!PAYPAL_CLIENT_SECRET,
        environment: PAYPAL_ENVIRONMENT,
        clientIdPrefix: PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 10) + '...' : 'missing'
      })
      return NextResponse.json(
        { 
          error: 'PayPal authentication failed. Please verify your PayPal credentials (Client ID and Secret) are correct and match the environment (sandbox/live).',
          details: process.env.NODE_ENV === 'development' ? 'Check your .env.local file for PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET' : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate payment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

