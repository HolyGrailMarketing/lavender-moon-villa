/**
 * Script to update the thumbnail for room-109-ls
 * Changes from the toilet image to a different image
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function updateThumbnail() {
  try {
    const roomSlug = 'room-109-ls'
    
    // Get all available images for this room from public folder
    // The first image (PHOTO-2026-01-03-15-47-21.jpg) will be used as the new thumbnail
    const newThumbnailUrl = '/Pictures/109-LS/PHOTO-2026-01-03-15-47-21.jpg'
    
    console.log(`Updating thumbnail for ${roomSlug}...`)
    console.log(`New thumbnail URL: ${newThumbnailUrl}`)
    
    // Update or insert thumbnail
    const result = await sql`
      INSERT INTO room_thumbnails (room_slug, thumbnail_url, updated_at)
      VALUES (${roomSlug}, ${newThumbnailUrl}, NOW())
      ON CONFLICT (room_slug) 
      DO UPDATE SET 
        thumbnail_url = EXCLUDED.thumbnail_url,
        updated_at = NOW()
      RETURNING *
    `
    
    // Also update room_images table if it exists
    try {
      await sql`
        UPDATE room_images 
        SET is_thumbnail = (image_url = ${newThumbnailUrl})
        WHERE room_slug = ${roomSlug}
      `
      console.log('Updated room_images table')
    } catch (error) {
      console.warn('room_images table may not exist yet:', error.message)
    }
    
    console.log('✅ Thumbnail updated successfully!')
    console.log('Result:', result[0])
    
  } catch (error) {
    console.error('❌ Error updating thumbnail:', error)
    process.exit(1)
  }
}

updateThumbnail()
