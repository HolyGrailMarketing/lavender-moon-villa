import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await sql`
      SELECT * FROM rooms ORDER BY room_number
    `

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      room_number,
      name,
      description,
      price_per_night,
      max_guests,
      amenities,
      status = 'available'
    } = await request.json()

    const result = await sql`
      INSERT INTO rooms (room_number, name, description, price_per_night, max_guests, amenities, status)
      VALUES (${room_number}, ${name}, ${description || null}, ${price_per_night}, ${max_guests || 2}, ${amenities || []}::text[], ${status})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating room:', error)
    // Check if room already exists
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: 'Room with this number already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()

    const result = await sql`
      UPDATE rooms 
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}


