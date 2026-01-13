#!/usr/bin/env node

/**
 * Script to update room capacities in the database
 * Run with: DATABASE_URL=your_connection_string node scripts/update-room-capacities.mjs
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

// Room capacities mapping (room_number -> max_guests)
// Based on the user's requirements:
// 206a-2, 206b-2, 206A-4, 207b-2, 208A-4, 208AB-6, 209-4, 109-4, 108-4, 107-4 (with +1 at $60), 106-4 (with +1 at $60)
// Renee and Alexander suite 2 and 1 extra at $60.00 charge
const roomCapacities = {
  // Suites
  'Alexander Suite': 2,
  'Renee Suite': 2,
  'Victoria Suite': 6, // Unchanged
  
  // Rooms
  '106-JW': 4,
  '107-CF': 4,
  '108-JA': 4,
  '109-LS': 4,
  '206-A': 4,
  '206-B': 2,
  '207-A': 2, // Not in user's list, keeping current
  '207-B': 2,
  '208A': 4,
  '208AB': 6,
  '209-JF': 4,
  
  // Alternative room number formats that might exist in database
  'Room 106-JW': 4,
  'Room 107-CF': 4,
  'Room 108-JA': 4,
  'Room 109-LS': 4,
  'Room 206-A': 4,
  'Room 206-B': 2,
  'Room 207-A': 2,
  'Room 207-B': 2,
  'Room 208A': 4,
  'Room 208AB': 6,
  'Room 208-A': 4,
  'Room 208-B': 4, // 208AB is 6, but 208-B might be separate
  'Room 209-JF': 4,
  '106': 4,
  '107': 4,
  '108': 4,
  '109': 4,
  '206A': 4,
  '206B': 2,
  '206-A': 4,
  '206-B': 2,
  '207A': 2,
  '207B': 2,
  '208A': 4,
  '208AB': 6,
  '209': 4,
}

async function updateRoomCapacities() {
  try {
    console.log('🔄 Updating room capacities in database...\n')

    // Get all rooms from database
    const rooms = await sql`
      SELECT id, room_number, name, max_guests
      FROM rooms
      ORDER BY room_number
    `

    if (rooms.length === 0) {
      console.log('⚠️  No rooms found in database')
      return
    }

    console.log(`📋 Found ${rooms.length} rooms in database\n`)

    let updatedCount = 0
    let skippedCount = 0
    let notFoundCount = 0

    for (const room of rooms) {
      // Try to find matching capacity by room_number or name
      let newCapacity = roomCapacities[room.room_number] || 
                       roomCapacities[room.name] ||
                       null

      // If not found, try case-insensitive match
      if (!newCapacity) {
        for (const [key, value] of Object.entries(roomCapacities)) {
          if (room.room_number?.toLowerCase() === key.toLowerCase() || 
              room.name?.toLowerCase() === key.toLowerCase()) {
            newCapacity = value
            break
          }
        }
      }

      if (!newCapacity) {
        console.log(`⚠️  No capacity mapping found for: ${room.room_number} (${room.name}) - keeping current: ${room.max_guests}`)
        notFoundCount++
        continue
      }

      if (room.max_guests === newCapacity) {
        console.log(`✓ ${room.room_number} (${room.name}): ${room.max_guests} (no change)`)
        skippedCount++
        continue
      }

      // Update the room capacity
      await sql`
        UPDATE rooms
        SET max_guests = ${newCapacity}
        WHERE id = ${room.id}
      `

      console.log(`✅ ${room.room_number} (${room.name}): ${room.max_guests} → ${newCapacity}`)
      updatedCount++
    }

    console.log('\n📊 Update Summary')
    console.log('==================')
    console.log(`✅ Updated: ${updatedCount}`)
    console.log(`⏭️  Skipped (no change): ${skippedCount}`)
    console.log(`⚠️  Not found in mapping: ${notFoundCount}`)

    if (updatedCount > 0) {
      console.log('\n🎉 Room capacities updated successfully!')
    } else {
      console.log('\n✨ All rooms already have the correct capacities (or no matching mappings found)')
    }

  } catch (error) {
    console.error('❌ Error updating room capacities:', error)
    process.exit(1)
  }
}

updateRoomCapacities()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })