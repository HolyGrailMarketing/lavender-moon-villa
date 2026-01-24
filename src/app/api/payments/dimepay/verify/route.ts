import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

// DimePay configuration
const DIMEPAY_API_URL = process.env.DIMEPAY_API_URL || 'https://sandbox.api.dimepay.app/dapi/v1'
const DIMEPAY_CLIENT_KEY = process.env.DIMEPAY_CLIENT_KEY || ''

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { reservation_id, order_id, payment_data } = data

    if (!reservation_id) {
      return NextResponse.json(
        { error: 'Missing reservation_id' },
        { status: 400 }
      )
    }

    // Get reservation details with all fields needed for email
    // Use stored guest name from reservation (name entered at booking) or fallback to guest table
    const reservations = await sql`
      SELECT 
        r.id,
        r.reservation_id,
        r.total_price,
        r.status,
        r.amount_paid,
        r.payment_reference,
        r.num_guests,
        r.check_in,
        r.check_out,
        r.special_requests,
        r.service_charge,
        r.additional_items,
        r.guest_first_name,
        r.guest_last_name,
        COALESCE(r.guest_first_name, g.first_name) as first_name,
        COALESCE(r.guest_last_name, g.last_name) as last_name,
        g.email,
        rm.name as room_name,
        rm.room_number
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ${reservation_id}
    `

    if (reservations.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const reservation = reservations[0]
    const totalPrice = Number(reservation.total_price)
    
    // Verify payment with DimePay API if we have order_id or payment_reference
    let verifiedPaidAmount = 0
    let paymentVerified = false
    const orderIdToCheck = order_id || reservation.payment_reference

    if (orderIdToCheck && DIMEPAY_CLIENT_KEY) {
      try {
        // Try to fetch order status from DimePay
        const orderResponse = await fetch(`${DIMEPAY_API_URL}/orders/${orderIdToCheck}`, {
          method: 'GET',
          headers: {
            'client_key': DIMEPAY_CLIENT_KEY,
          },
        })

        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          console.log('DimePay order verification:', orderData)
          
          if (orderData.status === 'paid' || orderData.status === 'completed' || orderData.status === 'success') {
            paymentVerified = true
            verifiedPaidAmount = Number(orderData.amount || orderData.total || totalPrice)
          }
        }
      } catch (error) {
        console.error('Error verifying payment with DimePay API:', error)
        // Fall back to payment_data if API verification fails
      }
    }

    // Use verified amount if available, otherwise use payment_data
    const paidAmount = paymentVerified 
      ? verifiedPaidAmount 
      : Number(
          payment_data?.amount || 
          payment_data?.total || 
          payment_data?.paid || 
          totalPrice
        )

    // Determine new status based on payment
    const currentAmountPaid = Number(reservation.amount_paid || 0)
    const newAmountPaid = currentAmountPaid + paidAmount
    
    let newStatus: 'paid_in_full' | 'deposit_paid' | 'pending' = 'pending'
    
    if (newAmountPaid >= totalPrice) {
      newStatus = 'paid_in_full'
    } else if (newAmountPaid > 0) {
      newStatus = 'deposit_paid'
    }

    // Update reservation with payment info
    try {
      await sql`
        UPDATE reservations
        SET 
          status = ${newStatus},
          amount_paid = ${newAmountPaid},
          payment_transaction_id = ${order_id || payment_data?.transaction_id || null},
          payment_date = NOW(),
          updated_at = NOW()
        WHERE id = ${reservation_id}
      `
    } catch (error: any) {
      // Check if it's a constraint violation for status
      if (error.code === '23514' && error.constraint === 'reservations_status_check') {
        console.error('[Payment] Database constraint error: status value not allowed:', {
          reservationId: reservation_id,
          attemptedStatus: newStatus,
          error: error.message,
        })
        return NextResponse.json(
          { 
            error: 'Database constraint violation: status value not allowed',
            details: `The status '${newStatus}' is not allowed by the database constraint. Please update the reservations_status_check constraint to include: 'pending', 'deposit_paid', 'paid_in_full', 'checked_in', 'checked_out', 'cancelled'`,
            constraint: error.constraint,
          },
          { status: 500 }
        )
      }
      
      // If amount_paid column doesn't exist, try updating without it
      if (error.message?.includes('amount_paid') || error.message?.includes('column')) {
        console.warn('[Payment] Could not update amount_paid, updating status only:', error.message)
        try {
          await sql`
            UPDATE reservations
            SET 
              status = ${newStatus},
              payment_transaction_id = ${order_id || payment_data?.transaction_id || null},
              payment_date = NOW(),
              updated_at = NOW()
            WHERE id = ${reservation_id}
          `
        } catch (retryError: any) {
          // If status constraint still fails, return error
          if (retryError.code === '23514' && retryError.constraint === 'reservations_status_check') {
            console.error('[Payment] Status constraint violation on retry:', {
              reservationId: reservation_id,
              attemptedStatus: newStatus,
            })
            return NextResponse.json(
              { 
                error: 'Database constraint violation: status value not allowed',
                details: `The status '${newStatus}' is not allowed by the database constraint. Please update the reservations_status_check constraint.`,
              },
              { status: 500 }
            )
          }
          throw retryError
        }
      } else {
        throw error
      }
    }

    console.log(`Reservation ${reservation_id} updated to status: ${newStatus}, amount paid: ${newAmountPaid}`)

    // Send confirmation email if payment was successful
    if (newStatus === 'paid_in_full' || newStatus === 'deposit_paid') {
      const emailResult = await sendBookingConfirmation({
        guestName: `${reservation.first_name} ${reservation.last_name}`,
        guestEmail: reservation.email,
        reservationId: reservation.id,
        reservationIdFormatted: reservation.reservation_id || undefined,
        roomName: reservation.room_name,
        roomNumber: reservation.room_number,
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        numGuests: reservation.num_guests,
        totalPrice: totalPrice,
        amountPaid: newAmountPaid,
        outstandingBalance: totalPrice - newAmountPaid,
        serviceCharge: Number(reservation.service_charge || 0),
        additionalItems: reservation.additional_items ? JSON.parse(JSON.stringify(reservation.additional_items)) : [],
        specialRequests: reservation.special_requests || undefined,
        status: newStatus,
      })
      
      if (emailResult.success) {
        console.log(`[Payment] Confirmation email sent for reservation ${reservation_id}`, {
          emailId: emailResult.emailId,
        })
      } else {
        console.error('[Payment] Failed to send confirmation email:', {
          reservationId: reservation_id,
          error: emailResult.error?.message,
          code: emailResult.error?.code,
        })
      }
    }

    return NextResponse.json({
      success: true,
      reservationId: reservation_id,
      status: newStatus,
      amountPaid: newAmountPaid,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error verifying DimePay payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    )
  }
}

