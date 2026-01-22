import { list } from '@vercel/blob'
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

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables')
  console.warn('⚠️  Note: This script needs blob storage access to list existing images')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

// Room slug to folder name mapping (from room-folder-map.ts)
const roomFolderMap = {
  'victoria-suite': 'Victoria-Suite',
  'alexander-suite': 'Alexander-Suite',
  'renee-suite': 'Renee-Suite',
  'room-106': '106-JW',
  'room-107-cf': 'Room 107-CF',
  'room-108': '108-JA',
  'room-109-ls': '109-LS',
  'room-207-a': '207-A',
  'room-208a': '208-A',
  'room-208ab': '208-B', // Note: Room 208AB maps to 208-B folder
  'room-209-jf': '209-JF',
  'room-206-a': '206-A',
  'room-206-b': 'Room 206-B',
  'room-207-b': '207-B',
  'room-208-b': '208-B'
}

/**
 * Convert blob URL to public folder path
 */
function convertBlobUrlToPublicPath(blobUrl, roomSlug) {
  try {
    const urlMatch = blobUrl.match(/\/rooms\/([^\/]+)\/(.+)$/)
    if (!urlMatch) return blobUrl

    const filename = decodeURIComponent(urlMatch[2])
    const folderName = roomFolderMap[roomSlug]
    if (!folderName) return blobUrl

    return `/Pictures/${folderName}/${filename}`
  } catch {
    return blobUrl
  }
}

/**
 * Migrate all images from blob storage to database
 */
async function migrateBlobImagesToDatabase() {
  console.log('🚀 Starting migration of blob storage images to database...\n')

  const blobDisabled = process.env.BLOB_DISABLED === 'true'
  if (blobDisabled) {
    console.log('⚠️  BLOB_DISABLED=true - converting blob URLs to public paths\n')
  }

  try {
    // List all blobs with the "rooms/" prefix
    console.log('📋 Listing all images from blob storage...')
    const { blobs, hasMore, cursor } = await list({
      prefix: 'rooms/',
      limit: 1000 // Adjust if you have more than 1000 images
    })

    console.log(`✅ Found ${blobs.length} images in blob storage\n`)

    if (blobs.length === 0) {
      console.log('ℹ️  No images found in blob storage. Nothing to migrate.')
      return
    }

    // Group images by room slug
    const imagesByRoom = {}
    for (const blob of blobs) {
      // Extract room slug from pathname: "rooms/{roomSlug}/{filename}"
      const pathMatch = blob.pathname.match(/^rooms\/([^\/]+)\/(.+)$/)
      if (!pathMatch) {
        console.warn(`⚠️  Skipping blob with unexpected pathname: ${blob.pathname}`)
        continue
      }

      const roomSlug = pathMatch[1]
      const filename = pathMatch[2]

      if (!imagesByRoom[roomSlug]) {
        imagesByRoom[roomSlug] = []
      }

      imagesByRoom[roomSlug].push({
        blobUrl: blob.url,
        filename,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        pathname: blob.pathname
      })
    }

    console.log(`📦 Grouped images by room:\n`)
    for (const [roomSlug, images] of Object.entries(imagesByRoom)) {
      console.log(`  ${roomSlug}: ${images.length} images`)
    }
    console.log()

    // Migrate each room's images to database
    let totalMigrated = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const [roomSlug, images] of Object.entries(imagesByRoom)) {
      console.log(`🔄 Migrating ${images.length} images for ${roomSlug}...`)

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        // Always save the original blob URL to the database
        // Conversion to public paths happens on-the-fly when serving (in listRoomImages)
        // This way, if public folder doesn't have the files, we can still serve blob URLs
        const imageUrl = image.blobUrl

        if (blobDisabled) {
          const publicPath = convertBlobUrlToPublicPath(image.blobUrl, roomSlug)
          console.log(`  📸 ${image.filename}: blob URL (will convert to ${publicPath} when serving)`)
        } else {
          console.log(`  📸 ${image.filename}: ${imageUrl}`)
        }

        try {
          await sql`
            INSERT INTO room_images (room_slug, image_url, filename, display_order, created_at, updated_at)
            VALUES (${roomSlug}, ${imageUrl}, ${image.filename}, ${i}, ${image.uploadedAt}, NOW())
            ON CONFLICT (room_slug, image_url) DO NOTHING
          `
          totalMigrated++
        } catch (error) {
          if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            totalSkipped++
            console.log(`  ⏭️  Skipped (already exists): ${image.filename}`)
          } else {
            totalErrors++
            console.error(`  ❌ Error migrating ${image.filename}:`, error.message)
          }
        }
      }

      console.log(`  ✅ Completed ${roomSlug}\n`)
    }

    // Summary
    console.log('📊 Migration Summary:')
    console.log(`  ✅ Migrated: ${totalMigrated}`)
    console.log(`  ⏭️  Skipped (already exists): ${totalSkipped}`)
    console.log(`  ❌ Errors: ${totalErrors}`)
    console.log(`  📦 Total processed: ${blobs.length}`)

    if (hasMore) {
      console.log('\n⚠️  Warning: More images may exist. This script only processed the first batch.')
      console.log('   Re-run with pagination support if needed.')
    }

    console.log('\n✨ Migration complete!')

  } catch (error) {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  }
}

// Run migration
migrateBlobImagesToDatabase()
