import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel cron job to anonymize old guest data
// Runs monthly to comply with 7-year data retention policy
export async function GET(request: Request) {
  // Verify this is called from Vercel cron (optional security check)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Calculate date 7 years ago
    const sevenYearsAgo = new Date()
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7)

    console.log(`[Data Retention] Starting anonymization for reservations older than ${sevenYearsAgo.toISOString()}`)

    // Find guests with reservations that checked out more than 7 years ago
    // and haven't been anonymized yet
    const guestsToAnonymize = await sql`
      SELECT DISTINCT g.id, g.first_name, g.last_name, g.email
      FROM guests g
      INNER JOIN reservations r ON r.guest_id = g.id
      WHERE r.check_out < ${sevenYearsAgo.toISOString()}
        AND g.data_retention_anonymized = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM reservations r2 
          WHERE r2.guest_id = g.id 
            AND r2.check_out >= ${sevenYearsAgo.toISOString()}
        )
    `

    console.log(`[Data Retention] Found ${guestsToAnonymize.length} guests to anonymize`)

    let anonymizedCount = 0
    const errors: string[] = []

    for (const guest of guestsToAnonymize) {
      try {
        // Anonymize guest data
        // Replace name with "Guest [ID]", remove email/phone/address, keep ID type/number for legal compliance
        await sql`
          UPDATE guests
          SET 
            first_name = 'Guest',
            last_name = ${`#${guest.id}`},
            email = ${`anonymized-${guest.id}@lavendermoon.anonymized`},
            phone = NULL,
            address = NULL,
            data_retention_anonymized = TRUE,
            anonymized_at = NOW()
          WHERE id = ${guest.id}
        `

        // Also anonymize guest names on reservations (if they match the original name)
        // This preserves the name used at booking time but anonymizes if it matches the guest record
        await sql`
          UPDATE reservations
          SET 
            guest_first_name = 'Guest',
            guest_last_name = ${`#${guest.id}`}
          WHERE guest_id = ${guest.id}
            AND guest_first_name = ${guest.first_name}
            AND guest_last_name = ${guest.last_name}
        `

        anonymizedCount++
        console.log(`[Data Retention] Anonymized guest ID ${guest.id}`)
      } catch (error: any) {
        const errorMsg = `Failed to anonymize guest ${guest.id}: ${error.message}`
        console.error(`[Data Retention] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      cutoff_date: sevenYearsAgo.toISOString(),
      guests_found: guestsToAnonymize.length,
      guests_anonymized: anonymizedCount,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log(`[Data Retention] Completed: ${anonymizedCount}/${guestsToAnonymize.length} guests anonymized`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Data Retention] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

