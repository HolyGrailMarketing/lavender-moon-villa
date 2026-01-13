import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sql } from '@/lib/db'

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

    return NextResponse.json({ thumbnailUrl: result[0].thumbnail_url })

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