/**
 * Script to add reservation_id, service_charge, additional_items, amount_paid columns
 * Run with: DATABASE_URL=your_connection_string node scripts/add-reservation-id-columns.mjs
 */

import { neon } from '@neondatabase/serverless'

async function addReservationColumns() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-reservation-id-columns.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 Adding new columns to reservations table...')

    await sql`
      ALTER TABLE reservations 
      ADD COLUMN IF NOT EXISTS reservation_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS service_charge DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS additional_items JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
    `

    console.log('✅ Successfully added columns to reservations table')
    console.log('   - reservation_id (VARCHAR(50)) - Format: LMV22927-YYMMDD-NN')
    console.log('   - service_charge (DECIMAL) - 15% service charge')
    console.log('   - additional_items (JSONB) - Food/drinks items')
    console.log('   - amount_paid (DECIMAL) - Amount already paid')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding columns:', error.message)
    process.exit(1)
  }
}

addReservationColumns()

