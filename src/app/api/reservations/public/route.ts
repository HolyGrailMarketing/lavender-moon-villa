import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateReservationId } from '@/lib/reservation-id'

export const dynamic = 'force-dynamic'

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

    // Create reservation with 'pending' status (will be confirmed after payment in Phase 4.2)
    // Store guest name entered at booking time to preserve it
    const result = await sql`
      INSERT INTO reservations (room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests, status, reservation_id, guest_first_name, guest_last_name)
      VALUES (${room_id}, ${guest_id}, ${check_in}, ${check_out}, ${num_guests}, ${total_price}, ${special_requests || null}, 'pending', ${reservationId}, ${finalGuestFirstName}, ${finalGuestLastName})
      RETURNING *
    `

    const reservation = result[0]

    // NOTE: Confirmation email will be sent AFTER payment is confirmed
    // (in the payment verification/webhook routes when status becomes 'paid_in_full' or 'deposit_paid')
    // We do NOT send email here because the reservation is still 'pending' and payment hasn't been confirmed yet

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











