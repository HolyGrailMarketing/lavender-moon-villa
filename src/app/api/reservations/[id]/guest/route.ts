import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import { sendReservationUpdate, sendCancellationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Verify token
function verifyToken(token: string, reservationId: string, email: string): boolean {
  try {
    const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [data, signature] = decoded.split(':')
    
    const [resId, resEmail, timestamp] = data.split(':')
    
    // Check if token matches
    if (resId !== reservationId || resEmail.toLowerCase() !== email.toLowerCase()) {
      return false
    }

    // Check if token is expired (1 hour)
    const tokenTime = parseInt(timestamp)
    if (Date.now() - tokenTime > 60 * 60 * 1000) {
      return false
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
    
    return signature === expectedSignature
  } catch {
    return false
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    // Get reservation with guest email
    const reservation = await sql`
      SELECT 
        r.*,
        rm.room_number,
        rm.name as room_name,
        rm.price_per_night,
        COALESCE(r.guest_first_name || ' ' || r.guest_last_name, g.first_name || ' ' || g.last_name) as guest_name,
        g.email as guest_email,
        g.phone as guest_phone,
        g.address as guest_address
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const res = reservation[0]

    // Verify token
    if (!verifyToken(token, params.id, res.guest_email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    return NextResponse.json({
      ...res,
      room_id: res.room_id,
    })
  } catch (error: any) {
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
    const data = await request.json()
    const { token, check_in, check_out, num_guests, special_requests, guest_phone, guest_address } = data

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    // Get reservation with guest email
    const reservation = await sql`
      SELECT 
        r.*,
        g.email as guest_email,
        rm.price_per_night,
        rm.room_number,
        rm.name as room_name,
        g.first_name || ' ' || g.last_name as guest_name
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const res = reservation[0]

    // Verify token
    if (!verifyToken(token, params.id, res.guest_email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check if reservation can be edited
    // Can edit if pending, deposit_paid, or paid_in_full (but not checked_in, checked_out, or cancelled)
    if (res.status === 'checked_in' || res.status === 'checked_out' || res.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This reservation cannot be edited' },
        { status: 400 }
      )
    }

    // Track changes for email notification
    const changes: string[] = []
    const oldCheckIn = res.check_in
    const oldCheckOut = res.check_out
    const oldNumGuests = res.num_guests
    const oldSpecialRequests = res.special_requests

    // Check availability if dates changed
    if (check_in && check_out) {
      const newCheckIn = new Date(check_in)
      const newCheckOut = new Date(check_out)
      const oldCheckInDate = new Date(oldCheckIn)
      const oldCheckOutDate = new Date(oldCheckOut)

      if (newCheckIn.getTime() !== oldCheckInDate.getTime() || 
          newCheckOut.getTime() !== oldCheckOutDate.getTime()) {
        
        // Check for conflicts (excluding current reservation)
        const conflicts = await sql`
          SELECT id FROM reservations
          WHERE room_id = ${res.room_id}
            AND id != ${params.id}
            AND status NOT IN ('cancelled', 'checked_out')
            AND (
              (check_in <= ${check_out}::date AND check_out >= ${check_in}::date)
            )
        `

        if (conflicts.length > 0) {
          return NextResponse.json(
            { error: 'Selected dates are not available for this room' },
            { status: 409 }
          )
        }

        if (newCheckIn.getTime() !== oldCheckInDate.getTime()) {
          changes.push(`Check-in date changed from ${oldCheckInDate.toLocaleDateString()} to ${newCheckIn.toLocaleDateString()}`)
        }
        if (newCheckOut.getTime() !== oldCheckOutDate.getTime()) {
          changes.push(`Check-out date changed from ${oldCheckOutDate.toLocaleDateString()} to ${newCheckOut.toLocaleDateString()}`)
        }
      }
    }

    // Calculate new price if dates or guests changed
    let newPrice = res.total_price
    if (check_in && check_out) {
      const nights = Math.ceil(
        (new Date(check_out).getTime() - new Date(check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      newPrice = res.price_per_night * nights
      
      if (newPrice !== res.total_price) {
        changes.push(`Total price updated from $${res.total_price.toFixed(2)} to $${newPrice.toFixed(2)}`)
      }
    }

    if (num_guests && num_guests !== oldNumGuests) {
      changes.push(`Number of guests changed from ${oldNumGuests} to ${num_guests}`)
    }

    if (special_requests !== undefined && special_requests !== oldSpecialRequests) {
      changes.push('Special requests updated')
    }

    // Update reservation
    const result = await sql`
      UPDATE reservations 
      SET 
        check_in = COALESCE(${check_in}::date, check_in),
        check_out = COALESCE(${check_out}::date, check_out),
        num_guests = COALESCE(${num_guests}, num_guests),
        total_price = ${newPrice},
        special_requests = COALESCE(${special_requests}, special_requests),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    // Update guest info if provided
    if (guest_phone !== undefined || guest_address !== undefined) {
      await sql`
        UPDATE guests
        SET 
          phone = COALESCE(${guest_phone}, phone),
          address = COALESCE(${guest_address}, address)
        WHERE id = ${res.guest_id}
      `
      
      if (guest_phone !== undefined && guest_phone !== res.guest_phone) {
        changes.push('Phone number updated')
      }
      if (guest_address !== undefined && guest_address !== res.guest_address) {
        changes.push('Address updated')
      }
    }

    // Send update email if there were changes
    if (changes.length > 0) {
      const emailResult = await sendReservationUpdate(
        {
          guestName: res.guest_name as string,
          guestEmail: res.guest_email as string,
          reservationId: res.id as number,
          roomName: res.room_name as string,
          roomNumber: res.room_number as string,
          checkIn: check_in || res.check_in,
          checkOut: check_out || res.check_out,
          numGuests: num_guests || res.num_guests,
          totalPrice: newPrice,
          specialRequests: special_requests !== undefined ? special_requests : res.special_requests,
          status: res.status as string,
        },
        changes
      )
      
      if (!emailResult.success) {
        console.error('[Guest Update] Failed to send update email:', {
          reservationId: res.id,
          error: emailResult.error?.message,
          code: emailResult.error?.code,
        })
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
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
    const body = await request.json().catch(() => ({}))
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    // Get reservation with guest email
    const reservation = await sql`
      SELECT 
        r.*,
        g.email as guest_email,
        rm.room_number,
        rm.name as room_name,
        g.first_name || ' ' || g.last_name as guest_name
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const res = reservation[0]

    // Verify token
    if (!verifyToken(token, params.id, res.guest_email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check if can be cancelled
    if (res.status === 'checked_in' || res.status === 'checked_out') {
      return NextResponse.json(
        { error: 'This reservation cannot be cancelled' },
        { status: 400 }
      )
    }

    // Update to cancelled
    await sql`
      UPDATE reservations 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    // Send cancellation email
    const emailResult = await sendCancellationEmail({
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
    
    if (!emailResult.success) {
      console.error('[Guest Cancel] Failed to send cancellation email:', {
        reservationId: res.id,
        error: emailResult.error?.message,
        code: emailResult.error?.code,
      })
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}

