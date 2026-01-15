import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listAllRoomImages, isBlobStorageEnabled } from '@/lib/image-storage'
import { getRoomFolder } from '@/lib/room-folder-map'

export const runtime = 'edge'

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
    const images = blobImages.map(blob => ({
      url: blob.url,
      filename: blob.filename,
      size: blob.size || null,
      uploadedAt: blob.uploadedAt instanceof Date 
        ? blob.uploadedAt.toISOString() 
        : (blob.uploadedAt as string) || null,
      storage: isBlobStorageEnabled() ? 'blob' as const : 'database' as const,
      is_thumbnail: blob.is_thumbnail || false,
      display_order: blob.display_order || 0
    }))

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
