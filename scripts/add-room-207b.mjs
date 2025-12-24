/**
 * Script to add Room 207-B to the database
 * Run with: DATABASE_URL=your_connection_string node scripts/add-room-207b.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

async function addRoom207B() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-room-207b.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    console.log('Adding Room 207-B to the database...')
    
    const result = await sql`
      INSERT INTO rooms (room_number, name, description, price_per_night, max_guests, amenities, status)
      VALUES (
        '207-B',
        'Room 207-B',
        'Comfortable accommodation with modern amenities',
        130,
        2,
        ${['WiFi', 'AC', 'Private Bathroom']}::text[],
        'available'
      )
      RETURNING *
    `

    console.log('✅ Room 207-B added successfully!')
    console.log('Room details:', JSON.stringify(result[0], null, 2))
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Room 207-B already exists in the database')
      console.log('No action needed.')
    } else {
      console.error('❌ Error adding room:', error.message)
      console.error('Full error:', error)
      process.exit(1)
    }
  }
}

addRoom207B()
