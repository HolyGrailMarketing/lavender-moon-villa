import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, reservation_id } = await request.json()

    if (!email || !reservation_id) {
      return NextResponse.json(
        { error: 'Email and reservation ID are required' },
        { status: 400 }
      )
    }

    // Verify reservation exists and belongs to this email
    const reservation = await sql`
      SELECT 
        r.id,
        r.status,
        g.email as guest_email,
        COALESCE(r.guest_first_name || ' ' || r.guest_last_name, g.first_name || ' ' || g.last_name) as guest_name
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${parseInt(reservation_id)}
      AND LOWER(g.email) = LOWER(${email})
    `

    if (reservation.length === 0) {
      // Don't reveal if reservation exists - security best practice
      return NextResponse.json(
        { error: 'Reservation not found or email does not match' },
        { status: 404 }
      )
    }

    const res = reservation[0]

    // Generate secure token (valid for 1 hour)
    const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
    const timestamp = Date.now().toString()
    const data = `${reservation_id}:${email}:${timestamp}`
    const signature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
    
    const verificationToken = Buffer.from(`${data}:${signature}`).toString('base64url')

    // Generate access URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const accessUrl = `${baseUrl}/my-reservation/${reservation_id}?token=${verificationToken}`

    // Send verification email
    const emailResult = await sendVerificationEmail({
      to: email,
      guestName: res.guest_name as string,
      reservationId: res.id as number,
      accessUrl,
    })

    if (!emailResult.success) {
      console.error('[Lookup] Failed to send verification email:', {
        reservationId: res.id,
        email,
        error: emailResult.error?.message,
        code: emailResult.error?.code,
      })
      // Still return success to not reveal email issues to potential attackers
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error: any) {
    console.error('Error looking up reservation:', error)
    return NextResponse.json(
      { error: 'Failed to lookup reservation' },
      { status: 500 }
    )
  }
}

