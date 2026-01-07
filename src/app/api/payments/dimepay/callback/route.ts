import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract DimePay callback parameters
    const orderToken = searchParams.get('orderToken') || searchParams.get('order_token') || searchParams.get('token')
    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')
    const transactionId = searchParams.get('transaction_id') || searchParams.get('payment_id')
    const amount = searchParams.get('amount')

    // Get order details from DimePay to verify payment and get order_id
    const DIMEPAY_API_URL = process.env.DIMEPAY_API_URL || 'https://sandbox.api.dimepay.app/dapi/v1'
    const DIMEPAY_CLIENT_KEY = process.env.DIMEPAY_CLIENT_KEY || ''

    let reservationId: number | null = null
    let paymentVerified = false
    let paymentAmount = 0
    let actualOrderId = orderId

    // If we have order_token, fetch order details to get order_id
    if (orderToken && DIMEPAY_CLIENT_KEY) {
      try {
        const orderResponse = await fetch(`${DIMEPAY_API_URL}/orders/${orderToken}`, {
          method: 'GET',
          headers: {
            'client_key': DIMEPAY_CLIENT_KEY,
          },
        })

        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          actualOrderId = orderData.orderId || orderData.order_id || orderData.id || orderToken
          
          // Check if order is paid
          if (orderData.status === 'paid' || orderData.status === 'completed') {
            paymentVerified = true
            paymentAmount = parseFloat(orderData.amount || amount || '0')
          }
        }
      } catch (error) {
        console.error('Error fetching order from DimePay:', error)
      }
    }

    // If we have order_id directly, extract reservation ID
    // DimePay order ID format: RES-{reservation_id}-{timestamp}
    if (actualOrderId) {
      const reservationIdMatch = actualOrderId.match(/^RES-(\d+)-/)
      if (reservationIdMatch) {
        reservationId = parseInt(reservationIdMatch[1])
      } else {
        // Try to get reservation by payment_reference
        const reservationByRef = await sql`
          SELECT id FROM reservations WHERE payment_reference = ${actualOrderId}
        `
        if (reservationByRef.length > 0) {
          reservationId = reservationByRef[0].id
        }
      }
    }

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Could not determine reservation ID from order' },
        { status: 400 }
      )
    }

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

    // Determine payment status
    const isSuccess = status === 'success' || status === 'paid' || status === 'completed' || paymentVerified

    if (isSuccess) {
      // Get current reservation to check payment amounts
      const currentReservation = await sql`
        SELECT total_price, amount_paid FROM reservations WHERE id = ${reservationId}
      `
      
      if (currentReservation.length > 0) {
        const totalPrice = parseFloat(currentReservation[0].total_price as string)
        const currentAmountPaid = parseFloat(currentReservation[0].amount_paid as string || '0')
        // Payment amount from DimePay
        const paymentAmountValue = paymentAmount || parseFloat(amount || '0')
        const newAmountPaid = currentAmountPaid + paymentAmountValue
        
        // Determine status based on payment amount
        let newStatus = 'deposit_paid'
        if (newAmountPaid >= totalPrice) {
          newStatus = 'paid_in_full'
        } else if (newAmountPaid > 0) {
          newStatus = 'deposit_paid'
        }
        
        // Update reservation
        try {
          await sql`
            UPDATE reservations 
            SET 
              status = ${newStatus},
              amount_paid = ${newAmountPaid},
              payment_status = 'paid',
              payment_transaction_id = ${transactionId || null},
              payment_date = NOW()
            WHERE id = ${reservationId}
          `
        } catch (error: any) {
          // Check if it's a constraint violation for status
          if (error.code === '23514' && error.constraint === 'reservations_status_check') {
            console.error('[Callback] Database constraint error: status value not allowed:', {
              reservationId,
              attemptedStatus: newStatus,
              error: error.message,
            })
            // Don't fail the callback, but log the error
            // The webhook or verify endpoint should handle the status update
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url.split('/api')[0]
            return NextResponse.redirect(
              `${baseUrl}/book/payment/success?reservation_id=${reservationId}&error=status_constraint`
            )
          }
          
          // If payment columns don't exist, just update status and amount_paid
          if (error.message?.includes('payment_status') || error.message?.includes('column')) {
            console.warn('[Callback] Could not update payment columns, updating status only:', error.message)
            try {
              await sql`
                UPDATE reservations 
                SET 
                  status = ${newStatus},
                  amount_paid = ${newAmountPaid}
                WHERE id = ${reservationId}
              `
            } catch (retryError: any) {
              if (retryError.code === '23514' && retryError.constraint === 'reservations_status_check') {
                console.error('[Callback] Status constraint violation on retry:', {
                  reservationId,
                  attemptedStatus: newStatus,
                })
                // Still redirect to success, but log the error
              } else {
                throw retryError
              }
            }
          } else {
            throw error
          }
        }
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
            r.guest_first_name,
            r.guest_last_name,
            rm.name as room_name,
            rm.room_number,
            COALESCE(r.guest_first_name || ' ' || r.guest_last_name, g.first_name || ' ' || g.last_name) as guest_name,
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
          const emailResult = await sendBookingConfirmation({
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
          
          if (emailResult.success) {
            console.log(`[Callback] Confirmation email sent for reservation ${reservationId}`, {
              emailId: emailResult.emailId,
            })
          } else {
            console.error('[Callback] Failed to send confirmation email:', {
              reservationId,
              error: emailResult.error?.message,
              code: emailResult.error?.code,
            })
          }
        }
      } catch (emailError: any) {
        // Don't fail the payment callback if email fails
        console.error('[Callback] Exception sending confirmation email:', emailError.message)
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
    console.error('Error processing DimePay callback:', error)
    return NextResponse.json(
      { error: 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}

// Handle POST webhooks from DimePay
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // DimePay webhook format - adjust based on actual webhook structure
    const { order_id, status, transaction_id, amount } = data

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Extract reservation ID from order_id
    const reservationIdMatch = order_id.match(/^RES-(\d+)-/)
    if (!reservationIdMatch) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 })
    }

    const reservationId = parseInt(reservationIdMatch[1])

    // Process webhook similar to GET callback
    const isSuccess = status === 'paid' || status === 'completed' || status === 'success'

    if (isSuccess) {
      const currentReservation = await sql`
        SELECT total_price, amount_paid FROM reservations WHERE id = ${reservationId}
      `
      
      if (currentReservation.length > 0) {
        const totalPrice = parseFloat(currentReservation[0].total_price as string)
        const currentAmountPaid = parseFloat(currentReservation[0].amount_paid as string || '0')
        const paymentAmount = parseFloat(amount || '0')
        const newAmountPaid = currentAmountPaid + paymentAmount
        
        let newStatus = 'deposit_paid'
        if (newAmountPaid >= totalPrice) {
          newStatus = 'paid_in_full'
        } else if (newAmountPaid > 0) {
          newStatus = 'deposit_paid'
        }
        
        await sql`
          UPDATE reservations 
          SET 
            status = ${newStatus},
            amount_paid = ${newAmountPaid},
            payment_status = 'paid',
            payment_transaction_id = ${transaction_id || null},
            payment_date = NOW()
          WHERE id = ${reservationId}
        `
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error processing DimePay webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

