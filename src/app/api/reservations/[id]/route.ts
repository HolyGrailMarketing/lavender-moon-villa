import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendReservationUpdate, sendCancellationEmail } from '@/lib/email'

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

    // Get current reservation data for comparison
    const currentReservation = await sql`
      SELECT 
        r.*,
        rm.name as room_name,
        rm.room_number,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    if (currentReservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const current = currentReservation[0]
    const changes: string[] = []

    // Track changes for email notification
    if (room_id && room_id !== current.room_id) {
      changes.push('Room changed')
    }
    if (check_in && check_in !== current.check_in) {
      changes.push('Check-in date changed')
    }
    if (check_out && check_out !== current.check_out) {
      changes.push('Check-out date changed')
    }
    if (num_guests && num_guests !== current.num_guests) {
      changes.push('Number of guests changed')
    }
    if (total_price && total_price !== current.total_price) {
      changes.push('Total price updated')
    }
    if (status && status !== current.status) {
      changes.push(`Status changed to ${status}`)
    }
    if (special_requests !== undefined && special_requests !== current.special_requests) {
      changes.push('Special requests updated')
    }

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

    // Get updated reservation with room and guest info
    const updatedReservation = await sql`
      SELECT 
        r.*,
        rm.name as room_name,
        rm.room_number,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    // Update room status if checking in or out
    if (status === 'checked_in') {
      await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${result[0].room_id}`
    } else if (status === 'checked_out') {
      await sql`UPDATE rooms SET status = 'cleaning' WHERE id = ${result[0].room_id}`
    }

    // Send update email if there were changes
    if (changes.length > 0 && updatedReservation.length > 0) {
      try {
        const res = updatedReservation[0]
        await sendReservationUpdate(
          {
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
          },
          changes
        )
      } catch (emailError) {
        // Don't fail the update if email fails
        console.error('Error sending update email:', emailError)
      }
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

    // Get reservation data before cancelling for email
    const reservationData = await sql`
      SELECT 
        r.*,
        rm.name as room_name,
        rm.room_number,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    const result = await sql`
      UPDATE reservations 
      SET status = 'cancelled'
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Send cancellation email
    if (reservationData.length > 0) {
      try {
        const res = reservationData[0]
        await sendCancellationEmail({
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
          status: 'cancelled',
        })
      } catch (emailError) {
        // Don't fail the cancellation if email fails
        console.error('Error sending cancellation email:', emailError)
      }
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

