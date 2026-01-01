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
        r.reservation_id,
        r.service_charge,
        r.additional_items,
        r.amount_paid,
        r.cancellation_reason,
        r.cancellation_notes,
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
    const { 
      room_id, 
      check_in, 
      check_out, 
      num_guests, 
      total_price, 
      status, 
      special_requests,
      source,
      use_custom_total,
      additional_guests,
      service_charge,
      additional_items,
      amount_paid
    } = data

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
        source = COALESCE(${source}, source),
        use_custom_total = COALESCE(${use_custom_total}, use_custom_total),
        additional_guests = COALESCE(${additional_guests}, additional_guests),
        service_charge = COALESCE(${service_charge}, service_charge),
        additional_items = COALESCE(${additional_items ? JSON.stringify(additional_items) : null}::jsonb, additional_items),
        amount_paid = COALESCE(${amount_paid}, amount_paid),
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

    // Get cancellation details from request body
    const body = await request.json().catch(() => ({}))
    const { cancellation_reason, cancellation_notes } = body

    // Get reservation data before cancelling for email
    const reservationData = await sql`
      SELECT 
        r.*,
        rm.name as room_name,
        rm.room_number,
        rm.id as room_id,
        g.first_name || ' ' || g.last_name as guest_name,
        g.email as guest_email
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    if (reservationData.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservation = reservationData[0]

    // Update reservation status and cancellation details
    const result = await sql`
      UPDATE reservations 
      SET 
        status = 'cancelled',
        cancellation_reason = ${cancellation_reason || null},
        cancellation_notes = ${cancellation_notes || null},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Release the room (set to available if it was occupied/cleaning, or keep current status if available/maintenance)
    // Only update room status if reservation was confirmed or checked_in
    if (reservation.status === 'confirmed' || reservation.status === 'checked_in') {
      await sql`
        UPDATE rooms 
        SET status = 'available'
        WHERE id = ${reservation.room_id}
      `
    }

    // Send cancellation email
    try {
      await sendCancellationEmail({
        guestName: reservation.guest_name as string,
        guestEmail: reservation.guest_email as string,
        reservationId: reservation.id as number,
        roomName: reservation.room_name as string,
        roomNumber: reservation.room_number as string,
        checkIn: reservation.check_in as string,
        checkOut: reservation.check_out as string,
        numGuests: reservation.num_guests as number,
        totalPrice: parseFloat(reservation.total_price as string),
        specialRequests: reservation.special_requests as string | undefined,
        status: 'cancelled',
      })
    } catch (emailError) {
      // Don't fail the cancellation if email fails
      console.error('Error sending cancellation email:', emailError)
    }

    return NextResponse.json({ success: true, reservation: result[0] })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}

