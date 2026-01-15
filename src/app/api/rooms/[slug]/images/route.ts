import { NextRequest, NextResponse } from 'next/server'
import { getRoomFolder } from '@/lib/room-folder-map'
import { listRoomImages, isBlobStorageEnabled, isBlobStorageUrl } from '@/lib/image-storage'
import { sql } from '@/lib/db'
import { readdir } from 'fs/promises'
import { join } from 'path'

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
      if (thumbnailUrl && !isBlobStorageEnabled() && isBlobStorageUrl(thumbnailUrl)) {
        thumbnailUrl = convertBlobUrlToPublicPath(thumbnailUrl, slug)
      }
    } catch (error) {
      // If tables don't exist yet, that's okay - just continue without thumbnail
      console.warn('Error fetching thumbnail (table may not exist yet):', error)
    }

    // Get images from database (avoids Vercel Blob list() operations)
    let imageFiles: string[] = []
    try {
      imageFiles = await listRoomImages(slug)
    } catch (error) {
      console.warn('Error fetching images:', error)
      imageFiles = []
    }

    // If no images found, fallback to reading from public folder directly
    if (imageFiles.length === 0) {
      try {
        const publicFolderPath = join(process.cwd(), 'public', 'Pictures', folderName)
        const files = await readdir(publicFolderPath)
        
        // Filter for image files and create paths
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
        imageFiles = files
          .filter(file => imageExtensions.some(ext => file.endsWith(ext)))
          .map(file => `/Pictures/${folderName}/${file}`)
          .sort()
        
        console.log(`Found ${imageFiles.length} images in public folder for ${slug}`)
      } catch (error) {
        console.warn(`Error reading public folder for ${slug}:`, error)
        // Continue with empty array
      }
    }

    // Reorder images to put thumbnail first if it exists
    if (thumbnailUrl && imageFiles.includes(thumbnailUrl)) {
      imageFiles = [
        thumbnailUrl,
        ...imageFiles.filter(url => url !== thumbnailUrl)
      ]
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