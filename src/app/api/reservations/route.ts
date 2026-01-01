import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateReservationId } from '@/lib/reservation-id'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservations = await sql`
      SELECT 
        r.id,
        r.reservation_id,
        r.room_id,
        r.check_in,
        r.check_out,
        r.num_guests,
        r.total_price,
        r.status,
        r.special_requests,
        r.source,
        r.use_custom_total,
        r.additional_guests,
        r.service_charge,
        r.additional_items,
        r.amount_paid,
        r.created_at,
        r.cancellation_reason,
        r.cancellation_notes,
        rm.room_number,
        rm.name as room_name,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      ORDER BY r.check_in DESC
    `

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { 
      room_id, 
      guest_id, 
      check_in, 
      check_out, 
      num_guests, 
      total_price, 
      special_requests,
      source,
      use_custom_total,
      additional_guests,
      service_charge,
      additional_items,
      amount_paid
    } = data

    // Generate reservation ID
    const reservationId = await generateReservationId(check_in)

    const result = await sql`
      INSERT INTO reservations (
        reservation_id, room_id, guest_id, check_in, check_out, num_guests, total_price, 
        special_requests, source, use_custom_total, additional_guests,
        service_charge, additional_items, amount_paid
      )
      VALUES (
        ${reservationId}, ${room_id}, ${guest_id}, ${check_in}, ${check_out}, ${num_guests}, ${total_price}, 
        ${special_requests}, ${source || 'direct'}, ${use_custom_total || false}, ${additional_guests || null},
        ${service_charge || 0}, ${JSON.stringify(additional_items || [])}::jsonb, ${amount_paid || 0}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}


