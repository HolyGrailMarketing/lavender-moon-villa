import { NextRequest, NextResponse } from 'next/server'

/**
 * Image proxy route to serve images from Vercel Blob Storage
 * This bypasses Next.js Image optimization issues with external URLs
 * Usage: /api/image?url=https://example.com/image.jpg
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // Validate that the URL is from Vercel Blob Storage
    try {
      const url = new URL(imageUrl)
      if (
        !url.hostname.includes('blob.vercel-storage.com') &&
        !url.hostname.includes('vercel-storage.com')
      ) {
        return NextResponse.json(
          { error: 'Invalid image source' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Lavender-Moon-Villa/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
