/**
 * Script to add new rooms to the database
 * Run with: DATABASE_URL=your_connection_string node scripts/add-new-rooms.mjs
 * Or set DATABASE_URL in your environment/terminal
 */

import { neon } from '@neondatabase/serverless'

const newRooms = [
  {
    room_number: 'Alexander Suite',
    name: 'Alexander Suite',
    description: 'Luxurious suite with premium amenities and stunning views',
    price_per_night: 280.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Suite'],
    status: 'available'
  },
  {
    room_number: 'Renee Suite',
    name: 'Renee Suite',
    description: 'Elegant suite offering comfort and style',
    price_per_night: 280.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Suite'],
    status: 'available'
  },
  {
    room_number: 'Victoria Suite',
    name: 'Victoria Suite',
    description: 'Premium suite with exceptional luxury and amenities',
    price_per_night: 480.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Suite', 'Premium'],
    status: 'available'
  },
  {
    room_number: '108-JA',
    name: 'Room 108-JA',
    description: 'Comfortable room with modern amenities',
    price_per_night: 225.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    status: 'available'
  },
  {
    room_number: '109-LS',
    name: 'Room 109-LS',
    description: 'Cozy room perfect for a relaxing stay',
    price_per_night: 220.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    status: 'available'
  },
  {
    room_number: '209-JF',
    name: 'Room 209-JF',
    description: 'Well-appointed room with beautiful views',
    price_per_night: 220.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    status: 'available'
  },
  {
    room_number: '208A',
    name: 'Room 208A',
    description: 'Comfortable accommodation with essential amenities',
    price_per_night: 190.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    status: 'available'
  },
  {
    room_number: '208AB',
    name: 'Room 208AB',
    description: 'Spacious room with modern comforts',
    price_per_night: 280.00,
    max_guests: 2,
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    status: 'available'
  }
]

async function addNewRooms() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('Usage: DATABASE_URL=your_connection_string node scripts/add-new-rooms.mjs')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const room of newRooms) {
    try {
      console.log(`\nAdding ${room.name}...`)
      
      const result = await sql`
        INSERT INTO rooms (room_number, name, description, price_per_night, max_guests, amenities, status)
        VALUES (
          ${room.room_number},
          ${room.name},
          ${room.description},
          ${room.price_per_night},
          ${room.max_guests},
          ${room.amenities}::text[],
          ${room.status}
        )
        ON CONFLICT (room_number) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price_per_night = EXCLUDED.price_per_night,
          max_guests = EXCLUDED.max_guests,
          amenities = EXCLUDED.amenities,
          status = EXCLUDED.status
        RETURNING *
      `

      if (result[0]) {
        console.log(`✅ ${room.name} added/updated successfully!`)
        console.log(`   Price: $${room.price_per_night}/night`)
        successCount++
      }
    } catch (error) {
      if (error.code === '23505') {
        console.log(`ℹ️  ${room.name} already exists - updating...`)
        // Try to update instead
        try {
          const updateResult = await sql`
            UPDATE rooms 
            SET 
              name = ${room.name},
              description = ${room.description},
              price_per_night = ${room.price_per_night},
              max_guests = ${room.max_guests},
              amenities = ${room.amenities}::text[],
              status = ${room.status}
            WHERE room_number = ${room.room_number}
            RETURNING *
          `
          if (updateResult[0]) {
            console.log(`✅ ${room.name} updated successfully!`)
            successCount++
          }
        } catch (updateError) {
          console.error(`❌ Error updating ${room.name}:`, updateError.message)
          errorCount++
        }
      } else {
        console.error(`❌ Error adding ${room.name}:`, error.message)
        errorCount++
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Summary:')
  console.log(`✅ Successfully added/updated: ${successCount} rooms`)
  console.log(`⚠️  Skipped: ${skipCount} rooms`)
  console.log(`❌ Errors: ${errorCount} rooms`)
  console.log('='.repeat(50))
}

addNewRooms()




