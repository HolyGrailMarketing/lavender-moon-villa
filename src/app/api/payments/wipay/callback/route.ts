import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

const WIPAY_API_KEY = process.env.WIPAY_API_KEY || ''

// Verify WiPay callback hash
// According to WiPay docs: hash = MD5(transaction_id + total + api_key) with no separators
function verifyWipayHash(transactionId: string, total: string, hash: string, apiKey: string): boolean {
  // Hash is only present for successful transactions
  if (!hash) {
    return false
  }
  
  // Concatenate: transaction_id + total + api_key (no separators)
  const hashString = transactionId + total + apiKey
  const calculatedHash = crypto.createHash('md5').update(hashString).digest('hex')
  
  return calculatedHash.toLowerCase() === hash.toLowerCase()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract WiPay callback parameters
    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')
    const transactionId = searchParams.get('transaction_id') || ''
    const total = searchParams.get('total') || ''
    const hash = searchParams.get('hash') || ''

    // Verify hash (only for successful transactions - hash is conditionally absent for failed/error)
    if (status === 'success' && hash) {
      if (!verifyWipayHash(transactionId, total, hash, WIPAY_API_KEY)) {
        console.error('Hash verification failed', { transactionId, total, receivedHash: hash })
        return NextResponse.json(
          { error: 'Invalid hash' },
          { status: 400 }
        )
      }
    }

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Extract reservation ID from order_id (format: RES-{id}-{timestamp})
    const reservationIdMatch = orderId.match(/^RES-(\d+)-/)
    if (!reservationIdMatch) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      )
    }

    const reservationId = parseInt(reservationIdMatch[1])

    // Check if reservation exists
    const reservation = await sql`
      SELECT id, status, payment_reference FROM reservations WHERE id = ${reservationId}
    `

    if (reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Update reservation based on payment status
    // WiPay status values: 'success', 'failed', or 'error'
    if (status === 'success') {
      // Payment successful - confirm reservation
      // Update status - payment columns are optional (add them to schema if needed)
      try {
        await sql`
          UPDATE reservations 
          SET 
            status = 'confirmed',
            payment_status = 'paid',
            payment_transaction_id = ${transactionId || null},
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
            r.check_in,
            r.check_out,
            r.num_guests,
            r.total_price,
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
          await sendBookingConfirmation({
            guestName: res.guest_name as string,
            guestEmail: res.guest_email as string,
            reservationId: res.id as number,
            roomName: res.room_name as string,
            roomNumber: res.room_number as string,
            checkIn: res.check_in as string,
            checkOut: res.check_out as string,
            numGuests: res.num_guests as number,
            totalPrice: parseFloat(res.total_price as string),
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
      // Payment failed or cancelled - keep as pending
      try {
        await sql`
          UPDATE reservations 
          SET 
            payment_status = 'failed',
            payment_transaction_id = ${transactionId || null}
          WHERE id = ${reservationId}
        `
      } catch (error: any) {
        // If payment columns don't exist, reservation stays as pending
        console.warn('Could not update payment status:', error.message)
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url.split('/api')[0]
      return NextResponse.redirect(
        `${baseUrl}/book/payment/failed?reservation_id=${reservationId}`
      )
    }

  } catch (error: any) {
    console.error('Error processing WiPay callback:', error)
    return NextResponse.json(
      { error: 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}

// Handle POST callbacks (webhook) as well
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Similar processing for POST webhooks
    // This is a simplified version - adjust based on WiPay webhook format
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error processing WiPay webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

