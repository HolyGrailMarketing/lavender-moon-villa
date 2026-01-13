import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deleteRoomImage } from '@/lib/image-storage'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get image URL from request body
    const { url, roomSlug, filename } = await request.json()

    if (!url && (!roomSlug || !filename)) {
      return NextResponse.json({
        error: 'Either image URL or roomSlug + filename is required'
      }, { status: 400 })
    }

    let deleteUrl = url

    // If we have roomSlug and filename instead of full URL, construct the blob URL
    if (!deleteUrl && roomSlug && filename) {
      deleteUrl = `https://blob.vercel-storage.com/rooms/${roomSlug}/${filename}`
    }

    if (!deleteUrl) {
      return NextResponse.json({ error: 'Invalid image URL or parameters' }, { status: 400 })
    }

    // Delete the image
    await deleteRoomImage(roomSlug || 'unknown', filename || 'unknown')

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      deletedUrl: deleteUrl
    })

  } catch (error: any) {
    console.error('Error deleting image:', error)

    if (error.message?.includes('Vercel Blob Storage is not configured')) {
      return NextResponse.json({
        error: 'Image storage is not configured. Please set up Vercel Blob Storage first.'
      }, { status: 503 })
    }

    if (error.message?.includes('Blob not found')) {
      return NextResponse.json({
        error: 'Image not found in storage'
      }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}