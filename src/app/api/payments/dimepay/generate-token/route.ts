import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// DimePay configuration
const DIMEPAY_SECRET_KEY = process.env.DIMEPAY_SECRET_KEY || ''
const DIMEPAY_ENVIRONMENT = process.env.DIMEPAY_ENVIRONMENT || 'sandbox'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { reservation_id } = data

    if (!reservation_id) {
      return NextResponse.json(
        { error: 'Missing reservation_id' },
        { status: 400 }
      )
    }

    if (!DIMEPAY_SECRET_KEY) {
      return NextResponse.json(
        { error: 'DimePay secret key not configured' },
        { status: 500 }
      )
    }

    // Get reservation details
    const reservations = await sql`
      SELECT 
        r.id,
        r.total_price,
        r.num_guests,
        r.check_in,
        r.check_out,
        r.special_requests,
        rm.room_number,
        rm.name as room_name,
        rm.price_per_night,
        g.first_name,
        g.last_name,
        g.email,
        g.phone,
        g.address
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN guests g ON r.guest_id = g.id
      WHERE r.id = ${reservation_id} AND r.status = 'pending'
    `

    if (reservations.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found or not in pending status' },
        { status: 404 }
      )
    }

    const reservation = reservations[0]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Calculate nights and amounts
    const checkIn = new Date(reservation.check_in)
    const checkOut = new Date(reservation.check_out)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    const subtotal = Number(reservation.total_price) * 0.9 // Assuming 10% service charge
    const tax = 0 // GCT typically included
    const total = Number(reservation.total_price)

    // Create DimePay payload according to their SDK format
    const payload = {
      id: `RES-${reservation.id}-${Date.now()}`,
      total: total,
      subtotal: subtotal,
      description: `Reservation for ${reservation.room_name} (Room ${reservation.room_number})`,
      tax: tax,
      currency: 'USD',
      fees: [],
      items: [
        {
          id: `ROOM-${reservation.room_number}-${reservation.id}`,
          price: Number(reservation.price_per_night),
          sku: `ROOM-${reservation.room_number}`,
          quantity: nights,
          shortDescription: `${nights} night(s) at ${reservation.room_name}`,
          name: `${reservation.room_name} - Room ${reservation.room_number}`,
          imageUrl: `${baseUrl}/Pictures/Logo.png`, // Use villa logo as placeholder
        }
      ],
      fulfilled: false,
      shippingPerson: {
        name: `${reservation.first_name} ${reservation.last_name}`,
        email: reservation.email,
        street: reservation.address || 'N/A',
        city: 'Jamaica',
        countryCode: 'JM',
        countryName: 'Jamaica',
        postalCode: '00000',
        stateOrProvinceCode: 'JM',
        stateOrProvinceName: 'Jamaica',
        phone: reservation.phone || ''
      },
      billingPerson: {
        name: `${reservation.first_name} ${reservation.last_name}`,
        email: reservation.email,
        street: reservation.address || 'N/A',
        city: 'Jamaica',
        countryCode: 'JM',
        countryName: 'Jamaica',
        postalCode: '00000',
        stateOrProvinceCode: 'JM',
        stateOrProvinceName: 'Jamaica',
        phone: reservation.phone || ''
      },
      webhookUrl: `${baseUrl}/api/payments/dimepay/webhook`,
      // Store reservation ID in the payload for webhook processing
      metadata: {
        reservation_id: reservation.id
      }
    }

    // Sign the payload with JWT
    const signedToken = jwt.sign(payload, DIMEPAY_SECRET_KEY)

    console.log('Generated DimePay JWT for reservation:', reservation.id)

    // Store the order ID in the database for tracking
    try {
      await sql`
        UPDATE reservations 
        SET payment_reference = ${payload.id}
        WHERE id = ${reservation.id}
      `
    } catch (error: any) {
      console.warn('Could not update payment_reference:', error.message)
    }

    return NextResponse.json({
      token: signedToken,
      orderId: payload.id,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error generating DimePay token:', error)
    return NextResponse.json(
      { error: 'Failed to generate payment token', details: error.message },
      { status: 500 }
    )
  }
}

