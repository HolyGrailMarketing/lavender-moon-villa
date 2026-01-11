import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listRoomImages } from '@/lib/image-storage'
import { getRoomFolder } from '@/lib/room-folder-map'
import { promises as fs } from 'fs'
import path from 'path'

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

    let images: Array<{
      url: string
      filename: string
      size?: number
      uploadedAt?: string
      storage: 'blob' | 'public'
    }> = []

    // Try to get images from Vercel Blob first
    try {
      const blobImages = await listRoomImages(roomSlug)

      if (blobImages.length > 0) {
        // Transform blob URLs into our image objects
        images = blobImages.map(url => {
          const filename = url.split('/').pop() || 'unknown'
          return {
            url,
            filename,
            storage: 'blob' as const
          }
        })
      }
    } catch (error) {
      console.warn('Error fetching from blob storage, falling back to public folder:', error)
    }

    // If no blob images, fall back to public folder
    if (images.length === 0) {
      try {
        const publicPath = path.join(process.cwd(), 'public', 'Pictures', folderName)
        const files = await fs.readdir(publicPath)

        // Filter for image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase()
          return imageExtensions.includes(ext)
        })

        // Get file stats for each image
        const imagePromises = imageFiles.map(async (filename) => {
          const filePath = path.join(publicPath, filename)
          const stats = await fs.stat(filePath)

          return {
            url: `/Pictures/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`,
            filename,
            size: stats.size,
            storage: 'public' as const
          }
        })

        images = await Promise.all(imagePromises)

      } catch (error) {
        console.warn(`Could not read public folder ${folderName}:`, error)
      }
    }

    return NextResponse.json({
      room: roomSlug,
      folder: folderName,
      images,
      count: images.length,
      storage: images.length > 0 ? images[0].storage : 'none'
    })

  } catch (error) {
    console.error('Error listing room images:', error)
    return NextResponse.json(
      { error: 'Failed to list room images' },
      { status: 500 }
    )
  }
}