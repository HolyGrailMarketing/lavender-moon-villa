import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendCheckInEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret (Vercel adds this header, but we can also use authorization)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.RESERVATION_SECRET
  
  // Allow Vercel cron (no auth header) or authenticated requests
  if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find reservations that:
    // 1. Have payment (deposit_paid or paid_in_full) or are pending
    // 2. Check-in date is tomorrow (within 24 hours)
    // 3. Haven't been checked in yet
    // 4. Haven't been cancelled
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const reservations = await sql`
      SELECT 
        r.id,
        r.check_in,
        r.status,
        g.email as guest_email,
        g.first_name || ' ' || g.last_name as guest_name,
        rm.room_number,
        rm.name as room_name
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.status IN ('deposit_paid', 'paid_in_full', 'pending')
        AND r.check_in::date = ${tomorrowStr}::date
        AND r.status NOT IN ('checked_in', 'checked_out', 'cancelled')
    `

    const results = []
    
    for (const reservation of reservations) {
      try {
        // Generate secure check-in token
        const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
        const timestamp = Date.now().toString()
        const data = `${reservation.id}:${reservation.guest_email}:${timestamp}`
        const signature = crypto
          .createHmac('sha256', secret)
          .update(data)
          .digest('hex')
        
        const checkInToken = Buffer.from(`${data}:${signature}`).toString('base64url')
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net'
        const checkInUrl = `${baseUrl}/check-in/${reservation.id}?token=${checkInToken}`

        // Send check-in email
        const emailResult = await sendCheckInEmail({
          to: reservation.guest_email as string,
          guestName: reservation.guest_name as string,
          reservationId: reservation.id as number,
          roomNumber: reservation.room_number as string,
          roomName: reservation.room_name as string,
          checkInDate: reservation.check_in as string,
          checkInUrl,
        })

        if (emailResult.success) {
          console.log(`[Cron] Check-in email sent to ${reservation.guest_email} for reservation ${reservation.id}`, {
            emailId: emailResult.emailId,
          })
        } else {
          console.error(`[Cron] Failed to send check-in email:`, {
            reservationId: reservation.id,
            guestEmail: reservation.guest_email,
            error: emailResult.error?.message,
            code: emailResult.error?.code,
          })
        }

        results.push({
          reservationId: reservation.id,
          email: reservation.guest_email,
          emailSent: emailResult.success,
        })
      } catch (error: any) {
        console.error(`Error processing reservation ${reservation.id}:`, error)
        results.push({
          reservationId: reservation.id,
          email: reservation.guest_email,
          emailSent: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error: any) {
    console.error('Error sending check-in emails:', error)
    return NextResponse.json(
      { error: 'Failed to process check-in emails', details: error.message },
      { status: 500 }
    )
  }
}

