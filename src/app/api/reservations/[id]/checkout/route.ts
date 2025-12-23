import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update reservation status
    const result = await sql`
      UPDATE reservations 
      SET status = 'checked_out', updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Update room status to cleaning
    await sql`
      UPDATE rooms 
      SET status = 'cleaning' 
      WHERE id = ${result[0].room_id}
    `

    return NextResponse.json({ success: true, reservation: result[0] })
  } catch (error) {
    console.error('Error checking out:', error)
    return NextResponse.json(
      { error: 'Failed to check out' },
      { status: 500 }
    )
  }
}

