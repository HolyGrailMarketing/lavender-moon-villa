import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate a secure verification token
function generateVerificationToken(email: string): string {
  const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
  const timestamp = Date.now()
  const data = `data-access:${email.toLowerCase()}:${timestamp}`
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

// Verify a verification token
function verifyToken(token: string, email: string): boolean {
  try {
    const secret = process.env.RESERVATION_SECRET || process.env.DATABASE_URL || 'change-this-secret'
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [prefix, tokenEmail, timestamp, signature] = decoded.split(':')
    
    if (prefix !== 'data-access' || tokenEmail.toLowerCase() !== email.toLowerCase()) {
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

// POST: Request data access (sends verification email)
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
    const verificationLink = `${baseUrl}/my-data/access?email=${encodeURIComponent(email)}&token=${token}`

    // Send verification email
    const { sendEmailWithResend } = await import('@/lib/email')
    await sendEmailWithResend({
      to: email,
      subject: 'Your Data Access Request - Lavender Moon Villas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #7C6BA0;">Lavender Moon Villas</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h2 style="color: #333;">Data Access Request</h2>
            <p>You requested access to your personal data. Click the button below to view your data:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background: #7C6BA0; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View My Data
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

    return NextResponse.json({
      message: 'If an account exists with this email, a verification link will be sent.'
    })
  } catch (error) {
    console.error('Error processing data access request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET: Retrieve data (with verified token)
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
      SELECT id, first_name, last_name, email, phone, address, id_type, id_number, created_at
      FROM guests 
      WHERE LOWER(email) = LOWER(${email})
    `

    if (guests.length === 0) {
      return NextResponse.json({ error: 'No data found for this email' }, { status: 404 })
    }

    const guest = guests[0]

    // Fetch all reservations for this guest
    const reservations = await sql`
      SELECT 
        r.id,
        r.reservation_id,
        r.check_in,
        r.check_out,
        r.num_guests,
        r.total_price,
        r.status,
        r.special_requests,
        r.guest_first_name,
        r.guest_last_name,
        r.created_at,
        rm.name as room_name,
        rm.room_number
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.guest_id = ${guest.id}
      ORDER BY r.created_at DESC
    `

    // Prepare response data
    const userData = {
      request_date: new Date().toISOString(),
      personal_information: {
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        address: guest.address,
        id_type: guest.id_type,
        id_number: guest.id_number ? '***' + guest.id_number.slice(-4) : null, // Mask ID number
        account_created: guest.created_at,
      },
      reservations: reservations.map((r: any) => ({
        reservation_id: r.reservation_id || `#${r.id}`,
        room: `${r.room_number} - ${r.room_name}`,
        check_in: r.check_in,
        check_out: r.check_out,
        number_of_guests: r.num_guests,
        total_price: r.total_price,
        status: r.status,
        special_requests: r.special_requests,
        guest_name_on_booking: r.guest_first_name && r.guest_last_name 
          ? `${r.guest_first_name} ${r.guest_last_name}` 
          : null,
        booking_date: r.created_at,
      })),
      data_retention_info: {
        retention_period: '7 years from last check-out date',
        deletion_policy: 'Data will be anonymized or deleted after the retention period',
      },
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

