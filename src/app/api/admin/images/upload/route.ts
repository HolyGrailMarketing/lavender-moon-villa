import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { uploadRoomImage } from '@/lib/image-storage'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const roomSlug = formData.get('roomSlug') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!roomSlug) {
      return NextResponse.json({ error: 'No room slug provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Upload the image
    const result = await uploadRoomImage(file, roomSlug)

    return NextResponse.json({
      success: true,
      url: result.url,
      pathname: result.pathname,
      roomSlug
    })

  } catch (error: any) {
    console.error('Error uploading image:', error)

    if (error.message?.includes('Vercel Blob Storage is not configured')) {
      return NextResponse.json({
        error: 'Image storage is not configured. Please set up Vercel Blob Storage first.'
      }, { status: 503 })
    }

    if (error.message?.includes('No folder mapping found')) {
      return NextResponse.json({
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}