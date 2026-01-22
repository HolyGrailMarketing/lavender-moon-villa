import { NextRequest, NextResponse } from 'next/server'
import { getRoomFolder } from '@/lib/room-folder-map'
import { listRoomImages, isBlobStorageEnabled, isBlobStorageUrl } from '@/lib/image-storage'
import { sql } from '@/lib/db'

// Helper to convert blob URL to public path
function convertBlobUrlToPublicPath(blobUrl: string, roomSlug: string): string {
  try {
    const urlMatch = blobUrl.match(/\/rooms\/([^\/]+)\/(.+)$/)
    if (!urlMatch) return blobUrl

    const filename = decodeURIComponent(urlMatch[2])
    const folderName = getRoomFolder(roomSlug)
    if (!folderName) return blobUrl

    return `/Pictures/${folderName}/${filename}`
  } catch {
    return blobUrl
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Get the folder name for this room slug
    const folderName = getRoomFolder(slug)
    if (!folderName) {
      return NextResponse.json(
        { error: 'Room not found or no image folder configured' },
        { status: 404 }
      )
    }

    // Fetch thumbnail URL if set (check both room_thumbnails table and room_images table)
    let thumbnailUrl: string | null = null
    try {
      // First check room_thumbnails table
      const thumbnailResult = await sql`
        SELECT thumbnail_url 
        FROM room_thumbnails 
        WHERE room_slug = ${slug}
        LIMIT 1
      `
      if (thumbnailResult.length > 0) {
        thumbnailUrl = thumbnailResult[0].thumbnail_url
      } else {
        // Fallback to room_images table
        const dbThumbnail = await sql`
          SELECT image_url 
          FROM room_images 
          WHERE room_slug = ${slug} AND is_thumbnail = TRUE
          LIMIT 1
        `
        if (dbThumbnail.length > 0) {
          thumbnailUrl = dbThumbnail[0].image_url as string
        }
      }
      
      // Convert blob URL to public path if blob storage is disabled
      // This is necessary because blob URLs may return 403 errors
      if (thumbnailUrl && !isBlobStorageEnabled() && isBlobStorageUrl(thumbnailUrl)) {
        thumbnailUrl = convertBlobUrlToPublicPath(thumbnailUrl, slug)
      }
    } catch (error) {
      // If tables don't exist yet, that's okay - just continue without thumbnail
      console.warn('Error fetching thumbnail (table may not exist yet):', error)
    }

    // Get images from database (avoids Vercel Blob list() operations and filesystem reads)
    // Note: We can't use readdir in serverless functions as it exceeds size limits
    // All images must be stored in the database for serverless compatibility
    let imageFiles: string[] = []
    try {
      imageFiles = await listRoomImages(slug)
    } catch (error) {
      console.warn('Error fetching images:', error)
      imageFiles = []
    }

    // If no images found in database, return empty array
    // Images must be uploaded through the admin dashboard to populate the database
    if (imageFiles.length === 0) {
      console.warn(`No images found in database for ${slug}. Please upload images through the admin dashboard.`)
    }

    // Reorder images to put thumbnail first if it exists
    // Also add thumbnail to images list if it's not already there
    if (thumbnailUrl) {
      // Check if thumbnail is already in the list (compare by filename to handle URL format differences)
      const thumbnailFilename = thumbnailUrl.split('/').pop()?.toLowerCase()
      const thumbnailInList = imageFiles.some(img => {
        const imgFilename = img.split('/').pop()?.toLowerCase()
        return imgFilename === thumbnailFilename
      })
      
      if (thumbnailInList) {
        // Reorder to put thumbnail first
        imageFiles = [
          thumbnailUrl,
          ...imageFiles.filter(url => {
            const urlFilename = url.split('/').pop()?.toLowerCase()
            return urlFilename !== thumbnailFilename
          })
        ]
      } else {
        // Add thumbnail to the beginning of the list if not found
        imageFiles = [thumbnailUrl, ...imageFiles]
      }
    }

    // Log for debugging
    console.log(`[${slug}] Returning ${imageFiles.length} images, thumbnail: ${thumbnailUrl ? 'yes' : 'no'}`)
    if (imageFiles.length > 0) {
      console.log(`[${slug}] First image: ${imageFiles[0]}`)
    }

    return NextResponse.json({
      images: imageFiles,
      thumbnail: thumbnailUrl,
      folder: folderName,
      count: imageFiles.length,
      storage: isBlobStorageEnabled() ? 'blob' : 'none'
    })

  } catch (error) {
    console.error('Error fetching room images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room images' },
      { status: 500 }
    )
  }
}