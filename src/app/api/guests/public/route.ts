import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint for guest creation (no authentication required)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { first_name, last_name, email, phone, address } = data

    // Normalize email for comparison (trim whitespace, lowercase)
    const normalizedEmail = (email || '').trim().toLowerCase()
    
    // Normalize names for comparison (trim whitespace, lowercase)
    const normalizeName = (name: string) => (name || '').trim().toLowerCase()
    const normalizedFirstName = normalizeName(first_name)
    const normalizedLastName = normalizeName(last_name)

    // Check if guest already exists by email (case-insensitive comparison)
    // Select all fields to ensure we return the complete existing record
    const existingByEmail = await sql`
      SELECT id, first_name, last_name, email, phone, address, created_at
      FROM guests 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(${email}))
      LIMIT 1
    `

    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0]
      
      // Normalize existing names for comparison
      const existingFirstName = normalizeName(existing.first_name || '')
      const existingLastName = normalizeName(existing.last_name || '')
      
      // Check if name matches (case-insensitive, trimmed)
      if (existingFirstName === normalizedFirstName && existingLastName === normalizedLastName) {
        // Same person - update contact info only (NEVER change name)
        try {
          const result = await sql`
            UPDATE guests
            SET 
              phone = ${phone || null},
              address = ${address || null},
              updated_at = NOW()
            WHERE id = ${existing.id}
            RETURNING *
          `
          return NextResponse.json(result[0])
        } catch (error: any) {
          // If updated_at column doesn't exist, update without it
          if (error.code === '42703' && error.message?.includes('updated_at')) {
            const result = await sql`
              UPDATE guests
              SET 
                phone = ${phone || null},
                address = ${address || null}
              WHERE id = ${existing.id}
              RETURNING *
            `
            return NextResponse.json(result[0])
          }
          throw error
        }
      } else {
        // Email exists but name is different - return existing guest WITHOUT updating ANYTHING
        // This prevents overwriting the name on existing reservations
        // The new reservation will be linked to the existing guest with their original name
        console.warn(`[Guest] ⚠️ Email ${email} exists with DIFFERENT name!`)
        console.warn(`[Guest]   Existing name in DB: "${existing.first_name} ${existing.last_name}"`)
        console.warn(`[Guest]   New name provided: "${first_name} ${last_name}"`)
        console.warn(`[Guest]   Action: Returning existing guest record WITHOUT any database updates`)
        console.warn(`[Guest]   Result: New reservation will use existing name: "${existing.first_name} ${existing.last_name}"`)
        
        // CRITICAL: Return the existing guest record as-is (NO database UPDATE executed)
        // This ensures:
        // 1. Existing reservations keep their original guest names
        // 2. The new reservation will be linked to the existing guest_id with the original name
        // 3. No data corruption occurs
        // 4. The guest record in the database remains unchanged
        
        // Verify we're using the existing name from the database, not the new one
        // IMPORTANT: We use existing.email (from DB) not the input email to ensure consistency
        const existingGuest: any = {
          id: existing.id,
          first_name: existing.first_name,  // CRITICAL: Use existing DB name, NOT the new one
          last_name: existing.last_name,    // CRITICAL: Use existing DB name, NOT the new one
          email: existing.email,             // CRITICAL: Use existing email from DB, not input
          phone: existing.phone,             // Keep existing phone
          address: existing.address,         // Keep existing address
          created_at: existing.created_at,
        }
        
        // Only include updated_at if it exists in the database
        if ('updated_at' in existing) {
          existingGuest.updated_at = (existing as any).updated_at
        }
        
        // Log what we're returning to verify it's the existing name
        console.log(`[Guest] ✅ Returning existing guest (NO UPDATE):`, {
          id: existingGuest.id,
          returned_name: `${existingGuest.first_name} ${existingGuest.last_name}`,
          email: existingGuest.email,
          note: 'This name will be used for the new reservation'
        })
        
        // IMPORTANT: We are NOT executing any UPDATE query here
        // We are simply returning the existing guest record as-is
        return NextResponse.json(existingGuest)
      }
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











