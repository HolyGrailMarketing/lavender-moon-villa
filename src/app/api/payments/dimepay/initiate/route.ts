import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// DimePay API configuration
const DIMEPAY_API_URL = process.env.DIMEPAY_API_URL || 'https://sandbox.api.dimepay.app/dapi/v1'
const DIMEPAY_CLIENT_KEY = process.env.DIMEPAY_CLIENT_KEY || ''
const DIMEPAY_ENVIRONMENT = process.env.DIMEPAY_ENVIRONMENT || 'sandbox' // 'production' or 'sandbox'

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

    if (!DIMEPAY_CLIENT_KEY) {
      return NextResponse.json(
        { error: 'DimePay client key not configured' },
        { status: 500 }
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

    // Get room details for order description
    const reservationDetails = await sql`
      SELECT 
        r.id,
        r.check_in,
        r.check_out,
        rm.room_number,
        rm.name as room_name
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = ${reservation_id}
    `

    if (reservationDetails.length === 0) {
      return NextResponse.json(
        { error: 'Reservation details not found' },
        { status: 404 }
      )
    }

    const resDetails = reservationDetails[0]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const orderId = `RES-${reservation_id}-${Date.now()}`
    const callbackUrl = return_url || `${baseUrl}/api/payments/dimepay/callback`
    const cancelUrl = `${baseUrl}/book/payment/failed?reservation_id=${reservation_id}`

    // Get client IP address from request headers
    // DimePay requires a valid IP address format
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    let clientIp = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || request.headers.get('x-client-ip')?.trim() || '127.0.0.1'
    
    // Validate IP address format (basic validation)
    // If it's not a valid IP, use a default
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(clientIp)) {
      console.warn('Invalid IP address format, using default:', clientIp)
      clientIp = '127.0.0.1'
    }

    // Calculate amounts (assuming 10% service charge is included, so we'll set tax to 0 or calculate separately)
    const totalAmount = parseFloat(amount.toString())
    const taxAmount = 0 // GCT is typically included in the price in Jamaica, or set to 0 if tax-exempt
    const subtotalAmount = totalAmount - taxAmount

    // Create reference transaction ID (can be same as order ID for first payment)
    const referenceTransactionId = orderId

    // Create order in DimePay with required fields
    // Ensure all string values are actually strings and not too long
    const itemId = `ROOM-${resDetails.room_number}-${reservation_id}`.substring(0, 100)
    const itemSku = `ROOM-${resDetails.room_number}`.substring(0, 100)
    const refTxId = referenceTransactionId.substring(0, 100)
    const orderIdStr = orderId.substring(0, 100)

    // Try camelCase field names as the API might expect that format
    const orderPayload = {
      orderId: orderIdStr, // camelCase
      subtotal: Number(subtotalAmount.toFixed(2)),
      total: Number(totalAmount.toFixed(2)),
      email: customer_email,
      tax: Number(taxAmount.toFixed(2)),
      ipAddress: clientIp, // camelCase
      fulfilled: false,
      referenceTransactionId: refTxId, // camelCase
      currency: 'JMD',
      description: `Reservation ${reservation_id} - ${resDetails.room_number} - ${resDetails.room_name}`,
      customer: {
        name: customer_name || '',
        email: customer_email,
        phone: customer_phone || '',
      },
      billing: {
        name: customer_name || '',
        email: customer_email,
        phone: customer_phone || '',
      },
      items: [
        {
          id: itemId, // Try 'id' instead of 'itemId'
          sku: itemSku, // Try 'sku' instead of 'itemSku'
          name: `Room ${resDetails.room_number} - ${resDetails.room_name}`,
          description: `Check-in: ${new Date(resDetails.check_in).toLocaleDateString()} - Check-out: ${new Date(resDetails.check_out).toLocaleDateString()}`,
          quantity: 1,
          price: Number(totalAmount.toFixed(2)),
        }
      ],
      returnUrl: callbackUrl, // camelCase
      cancelUrl: cancelUrl, // camelCase
    }

    // Log the payload for debugging - make sure this shows up
    console.log('=== DimePay Request Debug START ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('API URL:', `${DIMEPAY_API_URL}/orders`)
    console.log('Client Key present:', !!DIMEPAY_CLIENT_KEY)
    console.log('Client IP:', clientIp)
    console.log('Order ID:', orderIdStr)
    console.log('Order ID type:', typeof orderIdStr)
    console.log('Order ID length:', orderIdStr.length)
    console.log('Reference Transaction ID:', refTxId)
    console.log('Item ID:', itemId)
    console.log('Item SKU:', itemSku)

    // Log each field individually to ensure they're being set
    console.log('orderId field:', orderPayload.orderId) // camelCase
    console.log('subtotal field:', orderPayload.subtotal)
    console.log('total field:', orderPayload.total)
    console.log('email field:', orderPayload.email)
    console.log('tax field:', orderPayload.tax)
    console.log('ipAddress field:', orderPayload.ipAddress) // camelCase
    console.log('fulfilled field:', orderPayload.fulfilled)
    console.log('referenceTransactionId field:', orderPayload.referenceTransactionId) // camelCase
    console.log('currency field:', orderPayload.currency)
    console.log('description field:', orderPayload.description)
    console.log('items length:', orderPayload.items?.length)
    console.log('item id in items[0]:', orderPayload.items?.[0]?.id)
    console.log('item sku in items[0]:', orderPayload.items?.[0]?.sku)
    console.log('item name in items[0]:', orderPayload.items?.[0]?.name)
    console.log('item quantity in items[0]:', orderPayload.items?.[0]?.quantity)
    console.log('item price in items[0]:', orderPayload.items?.[0]?.price)

    console.log('Full payload keys:', Object.keys(orderPayload))
    console.log('Full payload as string:', JSON.stringify(orderPayload))
    console.log('=== DimePay Request Debug END ===')

    // Create order first
    let orderData: any = {}
    try {
      // Try with client_key as query parameter instead of header
      const orderUrl = `${DIMEPAY_API_URL}/orders?client_key=${encodeURIComponent(DIMEPAY_CLIENT_KEY)}`
      const orderResponse = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      const responseText = await orderResponse.text()
      console.log('DimePay order response status:', orderResponse.status)
      console.log('DimePay order response:', responseText)

      if (!orderResponse.ok) {
        let errorData: any = {}
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { message: responseText }
        }
        console.error('DimePay order creation failed:', errorData)
        return NextResponse.json(
          { 
            error: 'Failed to create order with DimePay', 
            details: errorData,
            status: orderResponse.status 
          },
          { status: 500 }
        )
      }

      try {
        orderData = JSON.parse(responseText)
      } catch {
        console.error('Failed to parse order response:', responseText)
        return NextResponse.json(
          { error: 'Invalid response from DimePay order API' },
          { status: 500 }
        )
      }
    } catch (fetchError: any) {
      console.error('Error calling DimePay order API:', fetchError)
      return NextResponse.json(
        { error: 'Failed to connect to DimePay', details: fetchError.message },
        { status: 500 }
      )
    }

    // Get order token - DimePay might return token in different fields
    const orderToken = orderData.token || orderData.orderToken || orderData.order_token || orderData.id || orderId

    // Create hosted payment page
    const paymentPagePayload = {
      orderToken: orderToken, // camelCase
      returnUrl: callbackUrl, // camelCase
      cancelUrl: cancelUrl, // camelCase
    }

    let paymentPageData: any = {}
    try {
      // Try with client_key as query parameter instead of header
      const paymentPageUrl = `${DIMEPAY_API_URL}/payments/hosted-page?client_key=${encodeURIComponent(DIMEPAY_CLIENT_KEY)}`
      const paymentPageResponse = await fetch(paymentPageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPagePayload),
      })

      const responseText = await paymentPageResponse.text()
      console.log('DimePay hosted page response status:', paymentPageResponse.status)
      console.log('DimePay hosted page response:', responseText)

      if (!paymentPageResponse.ok) {
        let errorData: any = {}
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { message: responseText }
        }
        console.error('DimePay hosted page creation failed:', errorData)
        return NextResponse.json(
          { 
            error: 'Failed to create payment page', 
            details: errorData,
            status: paymentPageResponse.status 
          },
          { status: 500 }
        )
      }

      try {
        paymentPageData = JSON.parse(responseText)
      } catch {
        console.error('Failed to parse payment page response:', responseText)
        return NextResponse.json(
          { error: 'Invalid response from DimePay payment page API' },
          { status: 500 }
        )
      }
    } catch (fetchError: any) {
      console.error('Error calling DimePay payment page API:', fetchError)
      return NextResponse.json(
        { error: 'Failed to connect to DimePay payment page', details: fetchError.message },
        { status: 500 }
      )
    }

    // Store payment reference in database
    try {
      await sql`
        UPDATE reservations 
        SET payment_reference = ${orderId}
        WHERE id = ${reservation_id}
      `
    } catch (error: any) {
      console.warn('Could not update payment_reference:', error.message)
    }

    // Return payment URL for frontend redirect
    return NextResponse.json({
      paymentUrl: paymentPageData.paymentUrl || paymentPageData.payment_url || paymentPageData.url,
      orderId: orderId,
      orderToken: orderData.token || orderData.orderToken || orderData.order_token,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error initiating DimePay payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: error.message },
      { status: 500 }
    )
  }
}

