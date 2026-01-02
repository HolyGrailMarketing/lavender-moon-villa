import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint for checking room availability (no authentication required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'check_in and check_out dates are required' },
        { status: 400 }
      )
    }

    // Find rooms that have no conflicting reservations
    // Exclude only maintenance rooms - availability is determined by reservation dates, not current status
    const availableRooms = await sql`
      SELECT r.*
      FROM rooms r
      WHERE r.status != 'maintenance'
      AND r.id NOT IN (
        SELECT DISTINCT res.room_id
        FROM reservations res
        WHERE res.status IN ('confirmed', 'checked_in', 'pending')
        AND (
          (res.check_in <= ${checkOut}::date AND res.check_out >= ${checkIn}::date)
        )
      )
      ORDER BY r.room_number
    `

    return NextResponse.json(availableRooms)
  } catch (error: any) {
    console.error('Error checking availability:', error)
    const errorMessage = error?.message || 'Unknown error'
    const errorStack = error?.stack || ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to check availability',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

