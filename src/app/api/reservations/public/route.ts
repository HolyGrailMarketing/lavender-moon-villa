import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint for reservation creation (no authentication required)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests } = data

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

    // Create reservation with 'pending' status (will be confirmed after payment in Phase 4.2)
    const result = await sql`
      INSERT INTO reservations (room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests, status)
      VALUES (${room_id}, ${guest_id}, ${check_in}, ${check_out}, ${num_guests}, ${total_price}, ${special_requests || null}, 'pending')
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
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








