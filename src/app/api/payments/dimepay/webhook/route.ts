import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const webhookData = await request.json()
    
    console.log('DimePay webhook received:', JSON.stringify(webhookData, null, 2))

    // Extract payment information from webhook
    // The exact structure depends on DimePay's webhook format
    const {
      id: orderId,
      status: paymentStatus,
      total,
      metadata,
      transactionId,
      ...rest
    } = webhookData

    // Get reservation ID from metadata or order ID
    const reservationId = metadata?.reservation_id || 
                          (orderId ? parseInt(orderId.split('-')[1]) : null)

    if (!reservationId) {
      console.error('Could not extract reservation ID from webhook')
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // Get current reservation details with guest and room info
    // Use stored guest name from reservation (name entered at booking) or fallback to guest table
    const reservations = await sql`
      SELECT 
        r.id,
        r.reservation_id,
        r.total_price,
        r.status,
        r.amount_paid,
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
      WHERE r.id = ${reservationId}
    `

    if (reservations.length === 0) {
      console.error('Reservation not found:', reservationId)
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const reservation = reservations[0]
    const totalPrice = Number(reservation.total_price)
    const paidAmount = Number(total || 0)

    // Determine new status based on payment
    let newStatus: 'paid_in_full' | 'deposit_paid' | 'pending' = 'pending'
    
    if (paymentStatus === 'completed' || paymentStatus === 'success' || paymentStatus === 'paid') {
      if (paidAmount >= totalPrice) {
        newStatus = 'paid_in_full'
      } else if (paidAmount > 0) {
        newStatus = 'deposit_paid'
      }
    }

    // Update reservation with payment info
    try {
      await sql`
        UPDATE reservations
        SET 
          status = ${newStatus},
          payment_transaction_id = ${transactionId || orderId || null},
          payment_date = NOW(),
          updated_at = NOW(),
          amount_paid = COALESCE(amount_paid, 0) + ${paidAmount}
        WHERE id = ${reservationId}
      `
    } catch (error: any) {
      // Check if it's a constraint violation for status
      if (error.code === '23514' && error.constraint === 'reservations_status_check') {
        console.error('[Webhook] Database constraint error: status value not allowed:', {
          reservationId,
          attemptedStatus: newStatus,
          error: error.message,
        })
        return NextResponse.json(
          { 
            error: 'Database constraint violation: status value not allowed',
            details: `The status '${newStatus}' is not allowed. Please update the reservations_status_check constraint.`,
          },
          { status: 500 }
        )
      }
      
      // If amount_paid column doesn't exist, try updating without it
      if (error.message?.includes('amount_paid') || error.message?.includes('column')) {
        console.warn('[Webhook] Could not update amount_paid, updating status only:', error.message)
        try {
          await sql`
            UPDATE reservations
            SET 
              status = ${newStatus},
              payment_transaction_id = ${transactionId || orderId || null},
              payment_date = NOW(),
              updated_at = NOW()
            WHERE id = ${reservationId}
          `
        } catch (retryError: any) {
          if (retryError.code === '23514' && retryError.constraint === 'reservations_status_check') {
            console.error('[Webhook] Status constraint violation on retry:', {
              reservationId,
              attemptedStatus: newStatus,
            })
            return NextResponse.json(
              { 
                error: 'Database constraint violation: status value not allowed',
                details: `The status '${newStatus}' is not allowed. Please update the reservations_status_check constraint.`,
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

    console.log(`Reservation ${reservationId} updated to status: ${newStatus}`)

    // Send confirmation email if payment was successful
    if (newStatus === 'paid_in_full' || newStatus === 'deposit_paid') {
      // Calculate current amount paid after this payment
      const currentAmountPaid = Number(reservation.amount_paid || 0)
      const finalAmountPaid = currentAmountPaid + paidAmount
      
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
        amountPaid: finalAmountPaid,
        outstandingBalance: totalPrice - finalAmountPaid,
        serviceCharge: Number(reservation.service_charge || 0),
        additionalItems: reservation.additional_items ? JSON.parse(JSON.stringify(reservation.additional_items)) : [],
        specialRequests: reservation.special_requests || undefined,
        status: newStatus,
      })
      
      if (emailResult.success) {
        console.log(`[Webhook] Confirmation email sent for reservation ${reservationId}`, {
          emailId: emailResult.emailId,
        })
      } else {
        console.error('[Webhook] Failed to send confirmation email:', {
          reservationId,
          error: emailResult.error?.message,
          code: emailResult.error?.code,
        })
      }
    }

    // Return success to DimePay
    return NextResponse.json({
      success: true,
      reservationId,
      status: newStatus
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error processing DimePay webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}

