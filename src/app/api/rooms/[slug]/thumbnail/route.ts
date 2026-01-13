import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const result = await sql`
      SELECT thumbnail_url 
      FROM room_thumbnails 
      WHERE room_slug = ${slug}
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