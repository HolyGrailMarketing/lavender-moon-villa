import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listAllRoomImages, isBlobStorageEnabled, isBlobStorageUrl } from '@/lib/image-storage'
import { getRoomFolder } from '@/lib/room-folder-map'

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

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get room slug from query parameters
    const { searchParams } = new URL(request.url)
    const roomSlug = searchParams.get('room')

    if (!roomSlug) {
      return NextResponse.json({ error: 'Room slug is required' }, { status: 400 })
    }

    // Validate room exists in mapping
    const folderName = getRoomFolder(roomSlug)
    if (!folderName) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get images from database (avoids Vercel Blob list() operations)
    const blobImages = await listAllRoomImages(roomSlug)

    // Transform data into our image objects
    // Convert blob URLs to public folder paths if blob storage is disabled
    const images = blobImages.map(blob => {
      let imageUrl = blob.url
      
      // Convert blob URL to public path if blob storage is disabled
      if (!isBlobStorageEnabled() && isBlobStorageUrl(imageUrl)) {
        imageUrl = convertBlobUrlToPublicPath(imageUrl, roomSlug)
      }
      
      return {
        url: imageUrl,
        filename: blob.filename,
        size: blob.size || null,
        uploadedAt: blob.uploadedAt instanceof Date 
          ? blob.uploadedAt.toISOString() 
          : (blob.uploadedAt as string) || null,
        storage: isBlobStorageEnabled() ? 'blob' as const : 'database' as const,
        is_thumbnail: blob.is_thumbnail || false,
        display_order: blob.display_order || 0
      }
    })

    return NextResponse.json({
      room: roomSlug,
      folder: folderName,
      images,
      count: images.length,
      storage: images.length > 0 ? 'blob' : 'none'
    })

  } catch (error) {
    console.error('Error listing room images:', error)
    return NextResponse.json(
      { error: 'Failed to list room images' },
      { status: 500 }
    )
  }
}
