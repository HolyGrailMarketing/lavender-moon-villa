/**
 * Script to add cancellation reason and notes columns to the reservations table
 * Run with: DATABASE_URL=your_connection_string node scripts/add-cancellation-columns.mjs
 * Or set DATABASE_URL in your environment/terminal, or it will try to load from .env.local
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to load DATABASE_URL from .env.local if not set
function loadEnvVar() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')
    for (const line of lines) {
      if (line.startsWith('DATABASE_URL=')) {
        const value = line.substring('DATABASE_URL='.length).trim()
        // Remove quotes if present
        return value.replace(/^["']|["']$/g, '')
      }
    }
  } catch (error) {
    // .env.local doesn't exist or can't be read, that's okay
  }

  return null
}

async function addCancellationColumns() {
  const databaseUrl = loadEnvVar()
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-cancellation-columns.mjs')
    console.error('Or ensure DATABASE_URL is set in .env.local')
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

