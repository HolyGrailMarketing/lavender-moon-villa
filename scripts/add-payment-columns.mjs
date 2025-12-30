/**
 * Script to add payment tracking columns to the reservations table
 * Run with: DATABASE_URL=your_connection_string node scripts/add-payment-columns.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

async function addPaymentColumns() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-payment-columns.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('🔄 Adding payment tracking columns to reservations table...')

    // Add payment columns if they don't exist
    await sql`
      ALTER TABLE reservations 
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
    `

    console.log('✅ Successfully added payment columns to reservations table')
    console.log('   - payment_reference (VARCHAR(255))')
    console.log('   - payment_status (VARCHAR(50))')
    console.log('   - payment_transaction_id (VARCHAR(255))')
    console.log('   - payment_date (TIMESTAMP)')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding payment columns:', error.message)
    process.exit(1)
  }
}

addPaymentColumns()

