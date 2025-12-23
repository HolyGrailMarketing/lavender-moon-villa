import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservation = await sql`
      SELECT 
        r.*,
        rm.room_number,
        rm.name as room_name,
        g.id as guest_id,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email,
        g.phone as guest_phone,
        g.address as guest_address,
        g.id_type as guest_id_type,
        g.id_number as guest_id_number
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json(reservation[0])
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { room_id, check_in, check_out, num_guests, total_price, status, special_requests } = data

    const result = await sql`
      UPDATE reservations 
      SET 
        room_id = COALESCE(${room_id}, room_id),
        check_in = COALESCE(${check_in}::date, check_in),
        check_out = COALESCE(${check_out}::date, check_out),
        num_guests = COALESCE(${num_guests}, num_guests),
        total_price = COALESCE(${total_price}, total_price),
        status = COALESCE(${status}, status),
        special_requests = COALESCE(${special_requests}, special_requests),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Update room status if checking in or out
    if (status === 'checked_in') {
      await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${result[0].room_id}`
    } else if (status === 'checked_out') {
      await sql`UPDATE rooms SET status = 'cleaning' WHERE id = ${result[0].room_id}`
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      UPDATE reservations 
      SET status = 'cancelled'
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}

