/**
 * Script to update max_guests for all rooms
 * Run with: DATABASE_URL=your_connection_string node scripts/update-max-guests.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

// Room updates: room_number -> max_guests
const roomUpdates = {
  '206-A': 2,
  '206-B': 2,
  '207-B': 2,
  '208A': 4,
  '208AB': 6,
  '209-JF': 4,
  '109-LS': 4,
  '108-JA': 4,
  '107-CF': 4,
  '106-JW': 4,
  'Renee Suite': 2,
  'Alexander Suite': 2,
}

async function updateMaxGuests() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/update-max-guests.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0

  console.log('Starting max_guests updates...\n')

  for (const [roomNumber, maxGuests] of Object.entries(roomUpdates)) {
    try {
      console.log(`Updating ${roomNumber} to max_guests = ${maxGuests}...`)
      
      const result = await sql`
        UPDATE rooms 
        SET max_guests = ${maxGuests}
        WHERE room_number = ${roomNumber}
        RETURNING id, room_number, name, max_guests
      `

      if (result.length > 0) {
        const room = result[0]
        console.log(`✅ ${room.name} updated successfully! (max_guests: ${room.max_guests})`)
        successCount++
      } else {
        console.log(`⚠️  Room "${roomNumber}" not found in database`)
        notFoundCount++
      }
    } catch (error) {
      console.error(`❌ Error updating ${roomNumber}:`, error.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Summary:')
  console.log(`✅ Successfully updated: ${successCount} rooms`)
  if (notFoundCount > 0) {
    console.log(`⚠️  Not found: ${notFoundCount} rooms`)
  }
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} rooms`)
  }
  console.log('='.repeat(50))
  
  // Note about extra guest charges
  console.log('\nNote: The following rooms support extra guests with $60 charge:')
  console.log('  - 106-JW: base 4, can accommodate up to 5')
  console.log('  - 107-CF: base 4, can accommodate up to 5')
  console.log('  - Renee Suite: base 2, can accommodate up to 3')
  console.log('  - Alexander Suite: base 2, can accommodate up to 3')
  console.log('\nThese extra guest capabilities are currently handled in application logic.')
  console.log('Consider adding extra_guest_max and extra_guest_charge columns to the database if needed.')
}

updateMaxGuests()
