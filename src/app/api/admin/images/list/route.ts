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

    // Check if blob storage is enabled
    if (!isBlobStorageEnabled()) {
      return NextResponse.json({
        room: roomSlug,
        folder: folderName,
        images: [],
        count: 0,
        storage: 'none',
        error: 'Blob storage is not configured'
      })
    }

    // Get images from Vercel Blob Storage
    const blobImages = await listAllRoomImages(roomSlug)

    // Transform blob data into our image objects
    const images = blobImages.map(blob => ({
      url: blob.url,
      filename: blob.filename,
      size: blob.size,
      uploadedAt: blob.uploadedAt?.toISOString(),
      storage: 'blob' as const
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
