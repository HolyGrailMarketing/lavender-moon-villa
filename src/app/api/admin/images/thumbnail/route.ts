import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sql } from '@/lib/db'
import { isBlobStorageEnabled, isBlobStorageUrl, clearImageCache } from '@/lib/image-storage'
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

    const { searchParams } = new URL(request.url)
    const roomSlug = searchParams.get('room')

    if (!roomSlug) {
      return NextResponse.json({ error: 'Room slug is required' }, { status: 400 })
    }

    const result = await sql`
      SELECT thumbnail_url 
      FROM room_thumbnails 
      WHERE room_slug = ${roomSlug}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ thumbnailUrl: null })
    }

    let thumbnailUrl = result[0].thumbnail_url

    // Convert blob URL to public path if blob storage is disabled
    if (thumbnailUrl && !isBlobStorageEnabled() && isBlobStorageUrl(thumbnailUrl)) {
      thumbnailUrl = convertBlobUrlToPublicPath(thumbnailUrl, roomSlug)
    }

    return NextResponse.json({ thumbnailUrl })

  } catch (error) {
    console.error('Error fetching thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomSlug, thumbnailUrl } = await request.json()

    if (!roomSlug || !thumbnailUrl) {
      return NextResponse.json(
        { error: 'Room slug and thumbnail URL are required' },
        { status: 400 }
      )
    }

    // Upsert thumbnail (insert or update if exists)
    const result = await sql`
      INSERT INTO room_thumbnails (room_slug, thumbnail_url, updated_at)
      VALUES (${roomSlug}, ${thumbnailUrl}, NOW())
      ON CONFLICT (room_slug) 
      DO UPDATE SET 
        thumbnail_url = EXCLUDED.thumbnail_url,
        updated_at = NOW()
      RETURNING *
    `

    // Also update room_images table to mark this image as thumbnail
    try {
      await sql`
        UPDATE room_images 
        SET is_thumbnail = (image_url = ${thumbnailUrl})
        WHERE room_slug = ${roomSlug}
      `
    } catch (error) {
      console.warn('Error updating room_images thumbnail flag:', error)
      // Continue even if this fails - thumbnail is still set in room_thumbnails table
    }

    // Clear image cache for this room so homepage gets fresh data
    clearImageCache(roomSlug)

    return NextResponse.json({
      success: true,
      thumbnail: result[0]
    })

  } catch (error) {
    console.error('Error setting thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to set thumbnail' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomSlug = searchParams.get('room')

    if (!roomSlug) {
      return NextResponse.json({ error: 'Room slug is required' }, { status: 400 })
    }

    await sql`
      DELETE FROM room_thumbnails 
      WHERE room_slug = ${roomSlug}
    `

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to delete thumbnail' },
      { status: 500 }
    )
  }
}