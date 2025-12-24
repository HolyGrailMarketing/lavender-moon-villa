import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint for guest creation (no authentication required)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { first_name, last_name, email, phone, address } = data

    // Check if guest already exists by email
    const existing = await sql`
      SELECT id FROM guests WHERE email = ${email}
    `

    if (existing.length > 0) {
      // Update existing guest
      const result = await sql`
        UPDATE guests
        SET 
          first_name = ${first_name},
          last_name = ${last_name},
          phone = ${phone || null},
          address = ${address || null}
        WHERE id = ${existing[0].id}
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    // Create new guest
    const result = await sql`
      INSERT INTO guests (first_name, last_name, email, phone, address)
      VALUES (${first_name}, ${last_name}, ${email}, ${phone || null}, ${address || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating/updating guest:', error)
    return NextResponse.json(
      { error: 'Failed to create guest' },
      { status: 500 }
    )
  }
}

