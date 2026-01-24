import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/session'
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
        rm.price_per_night,
        rm.max_guests,
        rm.id as room_id,
        g.id as guest_id,
        COALESCE(r.guest_first_name || ' ' || r.guest_last_name, g.first_name || ' ' || g.last_name) as guest_name,
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

    // Auto-update status based on payment amount
    // Only if status is not being explicitly set and is a payment-related status
    let finalStatus = status
    const currentTotalPrice = total_price !== undefined ? parseFloat(total_price) : parseFloat(current.total_price as string)
    const newAmountPaid = amount_paid !== undefined ? parseFloat(amount_paid) : parseFloat(current.amount_paid as string || '0')
    
    // Only auto-update if amount_paid is being changed and status is not explicitly provided
    if (amount_paid !== undefined && !status) {
      const paymentStatuses = ['pending', 'deposit_paid', 'paid_in_full']
      const currentStatus = current.status as string
      
      // Only auto-update if current status is a payment-related status (not checked_in, checked_out, cancelled)
      if (paymentStatuses.includes(currentStatus)) {
        if (newAmountPaid >= currentTotalPrice && currentTotalPrice > 0) {
          finalStatus = 'paid_in_full'
          if (currentStatus !== 'paid_in_full') {
            changes.push('Status changed to paid_in_full (payment complete)')
          }
        } else if (newAmountPaid > 0) {
          finalStatus = 'deposit_paid'
          if (currentStatus !== 'deposit_paid') {
            changes.push('Status changed to deposit_paid')
          }
        } else {
          finalStatus = 'pending'
          if (currentStatus !== 'pending') {
            changes.push('Status changed to pending')
          }
        }
      }
    }

    const result = await sql`
      UPDATE reservations 
      SET 
        room_id = COALESCE(${room_id}, room_id),
        check_in = COALESCE(${check_in}::date, check_in),
        check_out = COALESCE(${check_out}::date, check_out),
        num_guests = COALESCE(${num_guests}, num_guests),
        total_price = COALESCE(${total_price}, total_price),
        status = COALESCE(${finalStatus}, status),
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
      await sql`UPDATE rooms SET status = 'available' WHERE id = ${result[0].room_id}`
    }

    // Send update email if there were changes
    if (changes.length > 0 && updatedReservation.length > 0) {
      try {
        const res = updatedReservation[0]
        const emailResult = await sendReservationUpdate(
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
        
        if (!emailResult.success) {
          console.error('[Staff Update] Failed to send update email:', {
            reservationId: res.id,
            error: emailResult.error?.message,
            code: emailResult.error?.code,
          })
          // Don't fail the update if email fails
        }
      } catch (emailError: any) {
        // Don't fail the update if email fails
        console.error('[Staff Update] Exception sending update email:', emailError.message)
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
    // Only update room status if reservation was paid or checked_in
    if (reservation.status === 'deposit_paid' || reservation.status === 'paid_in_full' || reservation.status === 'checked_in') {
      await sql`
        UPDATE rooms 
        SET status = 'available'
        WHERE id = ${reservation.room_id}
      `
    }

    // Send cancellation email
    const emailResult = await sendCancellationEmail({
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
    
    if (!emailResult.success) {
      console.error('[Staff Cancel] Failed to send cancellation email:', {
        reservationId: reservation.id,
        error: emailResult.error?.message,
        code: emailResult.error?.code,
      })
      // Don't fail the cancellation if email fails
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

