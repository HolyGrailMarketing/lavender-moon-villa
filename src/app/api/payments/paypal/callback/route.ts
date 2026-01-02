import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

// PayPal environment configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // PayPal returns token (order ID) and PayerID on approval
    const token = searchParams.get('token')
    const payerId = searchParams.get('PayerID')

    if (!token) {
      // User cancelled or error
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url.split('/api')[0]
      return NextResponse.redirect(
        `${baseUrl}/book/payment/failed?reason=cancelled`
      )
    }

    // Find reservation by PayPal order ID (stored in payment_reference)
    const reservation = await sql`
      SELECT id, status, payment_reference FROM reservations 
      WHERE payment_reference = ${token}
      ORDER BY id DESC
      LIMIT 1
    `

    if (reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const reservationId = reservation[0].id

    // Capture the PayPal order
    try {
      const paypal = getPaypalSDK()
      const captureRequest = new paypal.orders.OrdersCaptureRequest(token)
      captureRequest.requestBody({})

      const client = paypalClient()
      const capture = await client.execute(captureRequest)

      if (capture.result.status === 'COMPLETED') {
        // Payment successful - confirm reservation
        const transactionId = capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id || token
        const capturedAmount = capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0'

        try {
          await sql`
            UPDATE reservations 
            SET 
              status = 'confirmed',
              payment_status = 'paid',
              payment_transaction_id = ${transactionId},
              payment_date = NOW()
            WHERE id = ${reservationId}
          `
        } catch (error: any) {
          // If payment columns don't exist, just update status
          console.warn('Could not update payment columns, updating status only:', error.message)
          await sql`
            UPDATE reservations 
            SET status = 'confirmed'
            WHERE id = ${reservationId}
          `
        }

        // Send confirmation email
        try {
          const reservationData = await sql`
            SELECT 
              r.id,
              r.reservation_id,
              r.check_in,
              r.check_out,
              r.num_guests,
              r.total_price,
              r.amount_paid,
              r.service_charge,
              r.additional_items,
              r.special_requests,
              r.status,
              rm.name as room_name,
              rm.room_number,
              g.first_name || ' ' || g.last_name as guest_name,
              g.email as guest_email
            FROM reservations r
            JOIN rooms rm ON r.room_id = rm.id
            JOIN guests g ON r.guest_id = g.id
            WHERE r.id = ${reservationId}
          `

          if (reservationData.length > 0) {
            const res = reservationData[0]
            const amountPaid = parseFloat(res.amount_paid as string || '0')
            const totalPrice = parseFloat(res.total_price as string)
            await sendBookingConfirmation({
              guestName: res.guest_name as string,
              guestEmail: res.guest_email as string,
              reservationId: res.id as number,
              reservationIdFormatted: res.reservation_id as string,
              roomName: res.room_name as string,
              roomNumber: res.room_number as string,
              checkIn: res.check_in as string,
              checkOut: res.check_out as string,
              numGuests: res.num_guests as number,
              totalPrice: totalPrice,
              amountPaid: amountPaid,
              outstandingBalance: totalPrice - amountPaid,
              serviceCharge: parseFloat(res.service_charge as string || '0'),
              additionalItems: res.additional_items ? JSON.parse(JSON.stringify(res.additional_items)) : [],
              specialRequests: res.special_requests as string | undefined,
              status: res.status as string,
            })
          }
        } catch (emailError) {
          // Don't fail the payment callback if email fails
          console.error('Error sending confirmation email:', emailError)
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url.split('/api')[0]
        return NextResponse.redirect(
          `${baseUrl}/book/payment/success?reservation_id=${reservationId}`
        )
      } else {
        // Order not completed
        throw new Error(`PayPal order status: ${capture.result.status}`)
      }
    } catch (captureError: any) {
      console.error('Error capturing PayPal order:', captureError)
      
      // Update reservation to failed status
      try {
        await sql`
          UPDATE reservations 
          SET 
            payment_status = 'failed',
            payment_transaction_id = ${token}
          WHERE id = ${reservationId}
        `
      } catch (error: any) {
        console.warn('Could not update payment status:', error.message)
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url.split('/api')[0]
      return NextResponse.redirect(
        `${baseUrl}/book/payment/failed?reservation_id=${reservationId}`
      )
    }

  } catch (error: any) {
    console.error('Error processing PayPal callback:', error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/book/payment/failed?reason=error`
    )
  }
}

