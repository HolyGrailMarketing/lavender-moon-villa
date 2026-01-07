'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function DimePayPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const sdkInitialized = useRef(false)

  const token = searchParams.get('token')
  const orderId = searchParams.get('orderId')
  const reservationId = searchParams.get('reservationId')
  const customReservationId = searchParams.get('customReservationId')

  useEffect(() => {
    if (!token || !orderId || !reservationId) {
      setError('Missing payment information')
      setLoading(false)
      return
    }

    // Only initialize once
    if (sdkInitialized.current) return
    sdkInitialized.current = true

    // Load DimePay SDK dynamically
    const loadDimePaySDK = async () => {
      try {
        // Import the DimePay Web SDK - it exports { initPayment, initCard }
        const { initPayment } = await import('@dimepay/web-sdk')

        // Get client ID from environment
        const clientId = process.env.NEXT_PUBLIC_DIMEPAY_CLIENT_ID

        if (!clientId) {
          throw new Error('DimePay client ID not configured')
        }

        console.log('Initializing DimePay with token:', token?.substring(0, 20) + '...')

        // Decode JWT to get order details (we need currency, total, order_id)
        // JWT is base64url encoded, so we can decode it
        let orderDetails: any = {}
        try {
          const payload = token.split('.')[1]
          const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
          orderDetails = decoded
          console.log('Decoded JWT order details:', orderDetails)
        } catch (e) {
          console.warn('Could not decode JWT:', e)
        }

        // Initialize DimePay SDK using initPayment function
        const paymentConfig = {
            mountId: 'dimepay-container',
            client_id: clientId, // snake_case as per SDK
            order_id: orderId || orderDetails.id, // Required by SDK
            total: orderDetails.total, // Required by SDK
            currency: orderDetails.currency || 'USD', // Required by SDK
            data: token, // JWT with full order details
            test: process.env.NEXT_PUBLIC_DIMEPAY_ENVIRONMENT !== 'production',
            styles: {
              primaryColor: '#7c3aed',
              buttonColor: '#7c3aed',
              buttonTextColor: '#FFFFFF',
              backgroundColor: '#f9fafb',
              noBorderRadius: false,
              width: '100%',
              height: '600px'
            },
            payment_methods: { // snake_case as per SDK
              apple_pay: true,
              google_pay: true,
              samsung_pay: true
            },
            onReady: () => {
              console.log('✅ DimePay ready')
              setLoading(false)
            },
            onSuccess: async (data: any) => {
              console.log('✅ Payment successful:', data)
              
              // Verify payment and update reservation status
              try {
                const verifyRes = await fetch('/api/payments/dimepay/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reservation_id: reservationId,
                    order_id: orderId,
                    payment_data: data,
                  }),
                })

                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json()
                  console.log('Payment verified and reservation updated:', verifyData)
                } else {
                  const errorData = await verifyRes.json()
                  console.error('Failed to verify payment:', errorData)
                  // Still redirect to success page even if verification fails
                }
              } catch (error) {
                console.error('Error verifying payment:', error)
                // Continue to success page even if verification fails
              }

              // Redirect to success page with custom reservation ID if available
              const successParams = new URLSearchParams({
                reservation_id: reservationId || '',
              })
              if (customReservationId) {
                successParams.set('reservation_id', customReservationId)
              }
              router.push(`/book/payment/success?${successParams.toString()}`)
            },
            onFailed: (err: any) => {
              console.error('❌ Payment failed:', err)
              setError('Payment failed. Please try again.')
              setLoading(false)
            },
            onError: (err: any) => {
              console.error('❌ Payment error:', err)
              setError('An error occurred during payment. Please try again.')
              setLoading(false)
            },
            onCancel: () => {
              console.log('⚠️ Payment cancelled')
              // Redirect back to booking page
              router.push(`/book?error=payment_cancelled`)
            },
            onLoading: () => {
              console.log('⏳ Loading payment widget...')
              setLoading(true)
            }
          }

        console.log('DimePay config:', paymentConfig)

        // Call initPayment - this will mount the SDK automatically
        initPayment(paymentConfig)
      } catch (err: any) {
        console.error('Failed to load DimePay SDK:', err)
        console.error('Error details:', err.message, err.stack)
        setError('Failed to load payment system. Please try again.')
        setLoading(false)
      }
    }

    loadDimePaySDK()
  }, [token, orderId, reservationId, router])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/book"
            className="inline-block px-6 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
          >
            Return to Booking
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-lavender-deep text-white px-6 py-4">
            <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            <p className="text-lavender-pale mt-1">Reservation #{reservationId}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lavender-pale border-t-lavender-deep mb-4"></div>
              <p className="text-gray-600">Loading secure payment...</p>
            </div>
          )}

          {/* DimePay Container */}
          <div 
            id="dimepay-container" 
            ref={containerRef}
            className={`${loading ? 'hidden' : 'block'} min-h-[500px]`}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your payment is processed securely by DimePay</p>
          <p className="mt-2">
            <Link href="/book" className="text-lavender-deep hover:underline">
              ← Return to booking
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function DimePayPaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lavender-pale border-t-lavender-deep mb-4"></div>
              <p className="text-gray-600">Loading payment page...</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <DimePayPaymentContent />
    </Suspense>
  )
}

