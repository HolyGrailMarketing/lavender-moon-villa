import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/session'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Verify token (same as guest route)
function verifyToken(token: string, reservationId: string, email: string): boolean {
  try {
    const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [data, signature] = decoded.split(':')
    
    const [resId, resEmail, timestamp] = data.split(':')
    
    if (resId !== reservationId || resEmail.toLowerCase() !== email.toLowerCase()) {
      return false
    }

    const tokenTime = parseInt(timestamp)
    // Token valid for 48 hours for check-in (allows for timezone differences)
    if (Date.now() - tokenTime > 48 * 60 * 60 * 1000) {
      return false
    }

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

    const reservation = await sql`
      SELECT 
        r.*,
        rm.room_number,
        rm.name as room_name,
        g.email as guest_email,
        COALESCE(r.guest_first_name || ' ' || r.guest_last_name, g.first_name || ' ' || g.last_name) as guest_name
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const res = reservation[0]

    if (!verifyToken(token, params.id, res.guest_email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check if it's check-in date
    const checkInDate = new Date(res.check_in)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkInDate.setHours(0, 0, 0, 0)
    const isCheckInDate = checkInDate.getTime() === today.getTime()
    
    // Check time window (3 PM - 9 PM)
    const now = new Date()
    const currentHour = now.getHours()
    const canCheckIn = isCheckInDate && currentHour >= 15 && currentHour < 21 // 3 PM to 9 PM
    const isAfterHours = isCheckInDate && currentHour >= 21 // After 9 PM

    return NextResponse.json({
      ...res,
      canCheckIn,
      isCheckInDate,
      currentHour,
      isAfterHours,
    })
  } catch (error: any) {
    console.error('Error fetching check-in info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in information' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if staff is logged in (dashboard check-in)
    const session = await getSession()
    
    // Parse body - may be empty for staff check-in
    let token: string | null = null
    try {
      const body = await request.json()
      token = body.token || null
    } catch {
      // Empty body is okay for staff check-in
    }

    // Must have either a session (staff) or a token (guest self-check-in)
    if (!session && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservation = await sql`
      SELECT 
        r.*,
        g.email as guest_email,
        rm.id as room_id
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ${params.id}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const res = reservation[0]

    // If guest self-check-in (token provided), verify token and time window
    if (token) {
      if (!verifyToken(token, params.id, res.guest_email)) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      }

      // Check if already checked in
      if (res.status === 'checked_in') {
        return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
      }

      // Verify it's check-in date and time window for guest self-check-in
      const checkInDate = new Date(res.check_in)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      checkInDate.setHours(0, 0, 0, 0)
      const isCheckInDate = checkInDate.getTime() === today.getTime()
      const currentHour = new Date().getHours()
      const canCheckIn = isCheckInDate && currentHour >= 15 && currentHour < 21

      if (!canCheckIn) {
        if (!isCheckInDate) {
          return NextResponse.json(
            { error: 'Check-in is only available on your check-in date' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Check-in is only available between 3:00 PM and 9:00 PM on your check-in date' },
          { status: 400 }
        )
      }
    } else {
      // Staff check-in - just check if already checked in
      if (res.status === 'checked_in') {
        return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
      }
    }

    // Update reservation status
    await sql`
      UPDATE reservations 
      SET 
        status = 'checked_in',
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    // Update room status
    await sql`
      UPDATE rooms 
      SET status = 'occupied'
      WHERE id = ${res.room_id}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error checking in:', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}
