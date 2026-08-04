import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateReservationId } from '@/lib/reservation-id'
import { PAYMENTS_ENABLED } from '@/lib/config'
import { sendBookingConfirmation } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Send the booking confirmation email for a pay-on-arrival reservation.
 * Never throws: the reservation is already committed, so an email failure
 * must not fail the booking request.
 */
async function sendPayOnArrivalConfirmation(reservationId: number) {
  try {
    const reservations = await sql`
      SELECT
        r.id,
        r.reservation_id,
        r.total_price,
        r.status,
        r.num_guests,
        r.check_in,
        r.check_out,
        r.special_requests,
        r.service_charge,
        r.additional_items,
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
      console.error(`[Booking] Could not load reservation ${reservationId} for confirmation email`)
      return
    }

    const reservation = reservations[0]
    const totalPrice = Number(reservation.total_price)

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
      amountPaid: 0,
      outstandingBalance: totalPrice,
      serviceCharge: Number(reservation.service_charge || 0),
      additionalItems: reservation.additional_items ? JSON.parse(JSON.stringify(reservation.additional_items)) : [],
      specialRequests: reservation.special_requests || undefined,
      status: reservation.status,
    })

    if (emailResult.success) {
      console.log(`[Booking] Confirmation email sent for reservation ${reservationId}`, {
        emailId: emailResult.emailId,
      })
    } else {
      console.error('[Booking] Failed to send confirmation email:', {
        reservationId,
        error: emailResult.error?.message,
        code: emailResult.error?.code,
      })
    }
  } catch (error: any) {
    console.error('[Booking] Exception sending confirmation email:', {
      reservationId,
      error: error?.message,
    })
  }
}

// Public endpoint for reservation creation (no authentication required)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests, guest_first_name, guest_last_name } = data

    // Verify room exists and is available
    const room = await sql`
      SELECT id, status FROM rooms WHERE id = ${room_id}
    `

    if (room.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check for conflicts with existing reservations
    const conflicts = await sql`
      SELECT id FROM reservations
      WHERE room_id = ${room_id}
        AND status NOT IN ('cancelled', 'checked_out')
        AND (
          (check_in <= ${check_in} AND check_out > ${check_in})
          OR (check_in < ${check_out} AND check_out >= ${check_out})
          OR (check_in >= ${check_in} AND check_out <= ${check_out})
        )
    `

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Room is not available for the selected dates' },
        { status: 409 }
      )
    }

    // Generate custom reservation ID: LMV22927-YYMMDD-NN
    const reservationId = await generateReservationId(check_in)

    // Get guest name from request (name entered at booking) or fallback to guest record
    let finalGuestFirstName = guest_first_name
    let finalGuestLastName = guest_last_name
    
    // If name not provided, get it from guest record
    if (!finalGuestFirstName || !finalGuestLastName) {
      const guestRecord = await sql`
        SELECT first_name, last_name FROM guests WHERE id = ${guest_id}
      `
      if (guestRecord.length > 0) {
        finalGuestFirstName = finalGuestFirstName || guestRecord[0].first_name
        finalGuestLastName = finalGuestLastName || guestRecord[0].last_name
      }
    }

    // When online payment is enabled the reservation starts as 'pending' and is
    // confirmed by the payment callback. With payments disabled the booking is
    // confirmed immediately and the balance is collected at check-in.
    const initialStatus = PAYMENTS_ENABLED ? 'pending' : 'confirmed'

    // Store guest name entered at booking time to preserve it
    const result = await sql`
      INSERT INTO reservations (room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests, status, reservation_id, guest_first_name, guest_last_name)
      VALUES (${room_id}, ${guest_id}, ${check_in}, ${check_out}, ${num_guests}, ${total_price}, ${special_requests || null}, ${initialStatus}, ${reservationId}, ${finalGuestFirstName}, ${finalGuestLastName})
      RETURNING *
    `

    const reservation = result[0]

    // With online payment enabled, the confirmation email is sent AFTER payment is
    // confirmed (in the payment verification/webhook routes). With payment disabled
    // the booking is already confirmed, so send the confirmation email now.
    if (!PAYMENTS_ENABLED) {
      await sendPayOnArrivalConfirmation(reservation.id)
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reservation:', error)
    // Check for unique constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Reservation already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}











