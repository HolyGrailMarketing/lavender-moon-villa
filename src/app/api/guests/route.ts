import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      const guests = await sql`
        SELECT * FROM guests WHERE email = ${email} LIMIT 1
      `
      return NextResponse.json(guests[0] || null)
    }

    const guests = await sql`
      SELECT * FROM guests ORDER BY created_at DESC LIMIT 100
    `

    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
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

    const data = await request.json()
    const { first_name, last_name, email, phone, address, id_type, id_number, notes } = data

    // Check if guest already exists
    const existing = await sql`
      SELECT id FROM guests WHERE email = ${email}
    `

    if (existing.length > 0) {
      // Update existing guest
      const result = await sql`
        UPDATE guests 
        SET first_name = ${first_name}, 
            last_name = ${last_name},
            phone = ${phone},
            address = ${address},
            id_type = ${id_type},
            id_number = ${id_number},
            notes = ${notes}
        WHERE email = ${email}
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    // Create new guest
    const result = await sql`
      INSERT INTO guests (first_name, last_name, email, phone, address, id_type, id_number, notes)
      VALUES (${first_name}, ${last_name}, ${email}, ${phone}, ${address}, ${id_type}, ${id_number}, ${notes})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating/updating guest:', error)
    return NextResponse.json(
      { error: 'Failed to create/update guest' },
      { status: 500 }
    )
  }
}

