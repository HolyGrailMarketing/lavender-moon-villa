import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// WiPay API endpoint (for Jamaica - adjust based on your WiPay account location)
const WIPAY_API_URL = process.env.WIPAY_API_URL || 'https://jm.wipayfinancial.com/plugins/payments/request'
const WIPAY_ACCOUNT_NUMBER = process.env.WIPAY_ACCOUNT_NUMBER || ''
const WIPAY_API_KEY = process.env.WIPAY_API_KEY || ''
const WIPAY_COUNTRY_CODE = process.env.WIPAY_COUNTRY_CODE || 'JM' // ISO 3166-1 alpha-2 country code

// Generate WiPay payment hash
function generateWipayHash(params: Record<string, string>, apiKey: string): string {
  // Sort parameters and create hash string
  const sortedKeys = Object.keys(params).sort()
  const hashString = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiKey
  return crypto.createHash('sha256').update(hashString).digest('hex')
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { reservation_id, amount, customer_name, customer_email, customer_phone, return_url } = data

    if (!reservation_id || !amount || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify reservation exists and is pending
    const reservation = await sql`
      SELECT id, status, total_price FROM reservations WHERE id = ${reservation_id}
    `

    if (reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Reservation is not in pending status' },
        { status: 400 }
      )
    }

    // Prepare WiPay payment parameters
    const orderId = `RES-${reservation_id}-${Date.now()}`
    const currency = 'JMD' // Jamaican Dollar
    // Format amount to 2 decimal places as required by WiPay
    const totalAmount = parseFloat(amount.toString()).toFixed(2)
    const paymentParams: Record<string, string> = {
      account_number: WIPAY_ACCOUNT_NUMBER,
      order_id: orderId,
      amount: totalAmount,
      total: totalAmount, // WiPay requires total field (must be formatted with 2 decimal places)
      currency: currency,
      country_code: WIPAY_COUNTRY_CODE, // WiPay requires country_code field (ISO 3166-1 alpha-2)
      first_name: customer_name.split(' ')[0] || customer_name,
      last_name: customer_name.split(' ').slice(1).join(' ') || '',
      email: customer_email,
      phone: customer_phone || '',
      return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/wipay/callback`,
      cancel_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book/payment/failed`,
    }

    // Generate hash for WiPay
    const hash = generateWipayHash(paymentParams, WIPAY_API_KEY)

    // Store payment reference in database
    // Note: payment_reference column needs to be added to reservations table if it doesn't exist
    try {
      await sql`
        UPDATE reservations 
        SET payment_reference = ${orderId}
        WHERE id = ${reservation_id}
      `
    } catch (error: any) {
      // If payment_reference column doesn't exist, log and continue
      // The reservation will still work, we just won't store the reference
      console.warn('Could not update payment_reference:', error.message)
    }

    // Return payment URL and parameters for frontend to submit
    return NextResponse.json({
      payment_url: WIPAY_API_URL,
      payment_params: {
        ...paymentParams,
        hash: hash,
      },
      order_id: orderId,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error initiating WiPay payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}

