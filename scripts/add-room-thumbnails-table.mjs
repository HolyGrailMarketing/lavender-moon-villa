#!/usr/bin/env node

/**
 * Script to create room_thumbnails table for storing thumbnail image URLs
 * Run with: DATABASE_URL=your_connection_string node scripts/add-room-thumbnails-table.mjs
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

const databaseUrl = loadEnvVar()
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('   Please set it in your .env.local file or environment')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function addRoomThumbnailsTable() {
  try {
    console.log('Creating room_thumbnails table...')

    await sql`
      CREATE TABLE IF NOT EXISTS room_thumbnails (
        id SERIAL PRIMARY KEY,
        room_slug VARCHAR(100) UNIQUE NOT NULL,
        thumbnail_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    console.log('✅ room_thumbnails table created successfully')

    // Create index on room_slug for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_room_thumbnails_slug ON room_thumbnails(room_slug)
    `

    console.log('✅ Index created successfully')

  } catch (error) {
    console.error('❌ Error creating table:', error)
    process.exit(1)
  }
}

addRoomThumbnailsTable()
  .then(() => {
    console.log('🎉 Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })