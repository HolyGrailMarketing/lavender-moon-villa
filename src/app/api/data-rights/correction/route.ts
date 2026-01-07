import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate a secure verification token (same as access route)
function generateVerificationToken(email: string): string {
  const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
  const timestamp = Date.now()
  const data = `data-correction:${email.toLowerCase()}:${timestamp}`
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

// Verify a verification token
function verifyToken(token: string, email: string): boolean {
  try {
    const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [prefix, tokenEmail, timestamp, signature] = decoded.split(':')
    
    if (prefix !== 'data-correction' || tokenEmail.toLowerCase() !== email.toLowerCase()) {
      return false
    }

    const tokenTime = parseInt(timestamp)
    // Token valid for 1 hour
    if (Date.now() - tokenTime > 60 * 60 * 1000) {
      return false
    }

    const data = `${prefix}:${tokenEmail}:${timestamp}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex')
    return signature === expectedSignature
  } catch {
    return false
  }
}

// POST: Request data correction (sends verification email)
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if guest exists
    const guest = await sql`
      SELECT id, email FROM guests WHERE LOWER(email) = LOWER(${email})
    `

    if (guest.length === 0) {
      // Don't reveal whether email exists for security
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link will be sent.'
      })
    }

    // Generate verification token
    const token = generateVerificationToken(email)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net'
    const verificationLink = `${baseUrl}/my-data/correction?email=${encodeURIComponent(email)}&token=${token}`

    // Send verification email
    const { sendEmailWithResend } = await import('@/lib/email')
    const emailResult = await sendEmailWithResend({
      to: email,
      subject: 'Update Your Information - Lavender Moon Villas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #7C6BA0;">Lavender Moon Villas</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h2 style="color: #333;">Update Your Information</h2>
            <p>You requested to update your personal information. Click the button below to access the update form:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background: #7C6BA0; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Update My Information
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>Lavender Moon Villas - Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          </div>
        </div>
      `,
    })

    if (!emailResult.success) {
      console.error('[Data Correction] Failed to send verification email:', emailResult.error?.message)
      // Still return success to user (don't reveal if email exists)
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a verification link will be sent.'
    })
  } catch (error) {
    console.error('Error processing data correction request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET: Fetch current data for correction form (with verified token)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
    }

    // Verify token
    if (!verifyToken(token, email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Fetch guest data
    const guests = await sql`
      SELECT id, first_name, last_name, email, phone, address
      FROM guests 
      WHERE LOWER(email) = LOWER(${email})
    `

    if (guests.length === 0) {
      return NextResponse.json({ error: 'No data found for this email' }, { status: 404 })
    }

    const guest = guests[0]

    return NextResponse.json({
      guest_id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      phone: guest.phone || '',
      address: guest.address || '',
    })
  } catch (error) {
    console.error('Error fetching guest data for correction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// PATCH: Update guest information (with verified token)
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
    }

    // Verify token
    if (!verifyToken(token, email)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const data = await request.json()
    const { first_name, last_name, phone, address } = data

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    // Update guest information
    const result = await sql`
      UPDATE guests
      SET 
        first_name = ${first_name},
        last_name = ${last_name},
        phone = ${phone || null},
        address = ${address || null},
        updated_at = NOW()
      WHERE LOWER(email) = LOWER(${email})
      RETURNING id, first_name, last_name, email, phone, address
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Optionally update guest names on reservations if user requests
    // This is optional - we could add a checkbox for this in the UI
    // For now, we'll update reservations that have matching guest names
    await sql`
      UPDATE reservations
      SET 
        guest_first_name = ${first_name},
        guest_last_name = ${last_name}
      WHERE guest_id = ${result[0].id}
        AND guest_first_name = (SELECT first_name FROM guests WHERE id = ${result[0].id} LIMIT 1)
        AND guest_last_name = (SELECT last_name FROM guests WHERE id = ${result[0].id} LIMIT 1)
    `

    return NextResponse.json({
      success: true,
      message: 'Your information has been updated successfully',
      guest: result[0],
    })
  } catch (error) {
    console.error('Error updating guest data:', error)
    return NextResponse.json(
      { error: 'Failed to update data' },
      { status: 500 }
    )
  }
}

