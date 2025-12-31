/**
 * Script to add reservation source and additional guest columns to the reservations table
 * Run with: DATABASE_URL=your_connection_string node scripts/add-reservation-columns.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

async function addReservationColumns() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-reservation-columns.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 Adding new columns to reservations table...')

    // Add reservation source, custom total flag, and additional guests columns
    await sql`
      ALTER TABLE reservations 
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'direct',
      ADD COLUMN IF NOT EXISTS use_custom_total BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS additional_guests TEXT;
    `

    console.log('✅ Successfully added columns to reservations table')
    console.log('   - source (VARCHAR(50)) - booking source: direct, booking, expedia, travel_agent, other')
    console.log('   - use_custom_total (BOOLEAN) - flag for custom pricing')
    console.log('   - additional_guests (TEXT) - JSON array of additional guest names')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding columns:', error.message)
    process.exit(1)
  }
}

addReservationColumns()



