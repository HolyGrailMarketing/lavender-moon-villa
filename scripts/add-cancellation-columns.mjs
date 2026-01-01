/**
 * Script to add cancellation reason and notes columns to the reservations table
 * Run with: DATABASE_URL=your_connection_string node scripts/add-cancellation-columns.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

async function addCancellationColumns() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-cancellation-columns.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 Adding cancellation columns to reservations table...')

    // Add cancellation reason and notes columns
    await sql`
      ALTER TABLE reservations 
      ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(100),
      ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;
    `

    console.log('✅ Successfully added columns to reservations table')
    console.log('   - cancellation_reason (VARCHAR(100)) - reason for cancellation')
    console.log('   - cancellation_notes (TEXT) - additional cancellation notes')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding columns:', error.message)
    process.exit(1)
  }
}

addCancellationColumns()

