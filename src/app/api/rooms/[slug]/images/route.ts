import { NextRequest, NextResponse } from 'next/server'
import { getRoomFolder } from '@/lib/room-folder-map'
import { listRoomImages, isBlobStorageEnabled } from '@/lib/image-storage'
import { sql } from '@/lib/db'

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

    // Fetch thumbnail URL if set
    let thumbnailUrl: string | null = null
    try {
      const thumbnailResult = await sql`
        SELECT thumbnail_url 
        FROM room_thumbnails 
        WHERE room_slug = ${slug}
        LIMIT 1
      `
      if (thumbnailResult.length > 0) {
        thumbnailUrl = thumbnailResult[0].thumbnail_url
      }
    } catch (error) {
      // If table doesn't exist yet, that's okay - just continue without thumbnail
      console.warn('Error fetching thumbnail (table may not exist yet):', error)
    }

    let imageFiles: string[] = []

    // Get images from Vercel Blob Storage
    if (isBlobStorageEnabled()) {
      try {
        imageFiles = await listRoomImages(slug)
      } catch (error) {
        console.warn('Error fetching from blob storage:', error)
        imageFiles = []
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