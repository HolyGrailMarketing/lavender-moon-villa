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

/**
 * Clean duplicate images from database
 */
async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate images from database...\n')

  try {
    // Find duplicates by filename (case-insensitive)
    console.log('🔍 Finding duplicates by filename...')
    
    const duplicates = await sql`
      SELECT 
        room_slug,
        filename,
        COUNT(*) as count,
        array_agg(id ORDER BY created_at ASC) as ids,
        array_agg(image_url ORDER BY created_at ASC) as urls
      FROM room_images
      GROUP BY room_slug, LOWER(filename)
      HAVING COUNT(*) > 1
      ORDER BY room_slug, filename
    `

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found by filename')
    } else {
      console.log(`⚠️  Found ${duplicates.length} groups of duplicate images\n`)
      
      let totalDeleted = 0
      for (const dup of duplicates) {
        const ids = dup.ids
        const urls = dup.urls
        // Keep the first one (oldest), delete the rest
        const idsToDelete = ids.slice(1)
        
        console.log(`📸 ${dup.room_slug}/${dup.filename}: ${dup.count} copies`)
        console.log(`   Keeping: ${urls[0]}`)
        
        for (let i = 1; i < ids.length; i++) {
          console.log(`   Deleting: ${urls[i]} (ID: ${ids[i]})`)
          await sql`DELETE FROM room_images WHERE id = ${ids[i]}`
          totalDeleted++
        }
        console.log()
      }
      
      console.log(`✅ Deleted ${totalDeleted} duplicate images\n`)
    }

    // Also check for exact duplicate URLs (should be prevented by unique constraint, but check anyway)
    console.log('🔍 Checking for exact duplicate URLs...')
    const exactDupes = await sql`
      SELECT 
        room_slug,
        image_url,
        COUNT(*) as count
      FROM room_images
      GROUP BY room_slug, image_url
      HAVING COUNT(*) > 1
    `

    if (exactDupes.length === 0) {
      console.log('✅ No exact duplicate URLs found\n')
    } else {
      console.log(`⚠️  Found ${exactDupes.length} exact duplicate URLs (this shouldn't happen with unique constraint)\n`)
    }

    // Show summary by room
    console.log('📊 Image counts by room (after cleanup):')
    const summary = await sql`
      SELECT room_slug, COUNT(*) as count
      FROM room_images
      GROUP BY room_slug
      ORDER BY room_slug
    `
    
    for (const row of summary) {
      console.log(`  ${row.room_slug}: ${row.count} images`)
    }

    console.log('\n✨ Cleanup complete!')

  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error)
    process.exit(1)
  }
}

// Run cleanup
cleanDuplicates()
