import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservations = await sql`
      SELECT 
        r.id,
        r.room_id,
        r.check_in,
        r.check_out,
        r.num_guests,
        r.total_price,
        r.status,
        r.special_requests,
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
    const { room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests } = data

    const result = await sql`
      INSERT INTO reservations (room_id, guest_id, check_in, check_out, num_guests, total_price, special_requests)
      VALUES (${room_id}, ${guest_id}, ${check_in}, ${check_out}, ${num_guests}, ${total_price}, ${special_requests})
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


