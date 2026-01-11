import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getRoomFolder } from '@/lib/room-folder-map'
import { listRoomImages, isBlobStorageEnabled } from '@/lib/image-storage'

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

    let imageFiles: string[] = []

    // Try Vercel Blob Storage first if enabled
    if (isBlobStorageEnabled()) {
      try {
        imageFiles = await listRoomImages(slug)
      } catch (error) {
        console.warn('Error fetching from blob storage, falling back to public folder:', error)
      }
    }

    // If no images from blob storage, fall back to public folder
    if (imageFiles.length === 0) {
      const imagesPath = path.join(process.cwd(), 'public', 'Pictures', folderName)

      try {
        // Read all files in the directory
        const files = await fs.readdir(imagesPath)

        // Filter for image files and supported formats
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
        imageFiles = files
          .filter(file => {
            const ext = path.extname(file).toLowerCase()
            return imageExtensions.includes(ext)
          })
          .sort() // Sort alphabetically
          .map(file => `/Pictures/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`)

      } catch (error) {
        // If folder doesn't exist or can't be read, return empty array
        console.warn(`Could not read images from folder ${folderName}:`, error)
        imageFiles = []
      }
    }

    return NextResponse.json({
      images: imageFiles,
      folder: folderName,
      count: imageFiles.length,
      storage: isBlobStorageEnabled() ? 'blob' : 'public'
    })

  } catch (error) {
    console.error('Error fetching room images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room images' },
      { status: 500 }
    )
  }
}