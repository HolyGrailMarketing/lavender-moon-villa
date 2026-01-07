'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id')
  const [customReservationId, setCustomReservationId] = useState<string | null>(null)

  useEffect(() => {
    // If reservationId starts with "LMV", it's already the custom ID
    if (reservationId && reservationId.startsWith('LMV')) {
      setCustomReservationId(reservationId)
    } else if (reservationId && /^\d+$/.test(reservationId)) {
      // It's a numeric ID, try to fetch the custom ID
      // Note: This requires authentication, so it may fail for public users
      // In that case, we'll just show the numeric ID
      fetch(`/api/reservations/${reservationId}`)
        .then(res => {
          if (!res.ok) {
            // If auth fails, just use numeric ID
            setCustomReservationId(reservationId)
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data && data.reservation_id) {
            setCustomReservationId(data.reservation_id)
          } else {
            setCustomReservationId(reservationId)
          }
        })
        .catch(err => {
          console.error('Error fetching reservation:', err)
          // Fallback to numeric ID on error
          setCustomReservationId(reservationId)
        })
    } else if (reservationId) {
      setCustomReservationId(reservationId)
    }
  }, [reservationId])

  const displayReservationId = customReservationId || reservationId

  return (
    <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-lavender-pale sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/Pictures/Logo.png" 
              alt="Lavender Moon Villas" 
              width={50} 
              height={50} 
              className="h-12 w-auto" 
              style={{ width: 'auto', height: '3rem' }} 
              priority
              quality={80}
            />
            <span className="text-xl font-serif text-lavender-deep">Lavender Moon Villas</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-2">Your booking has been confirmed.</p>
          
          {displayReservationId && (
            <p className="text-sm text-gray-500 mb-8">Reservation #: {displayReservationId}</p>
          )}
          
          <div className="bg-lavender-pale rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-lavender-deep mb-4">What's Next?</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>A confirmation email has been sent to your email address</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Please check your email for booking details and arrival instructions</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>We look forward to hosting you at Lavender Moon Villas!</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Manage Your Reservation:</strong> You can view, edit, or cancel your reservation anytime by visiting{' '}
              <Link href="/my-reservation" className="text-blue-600 hover:underline font-semibold">
                Manage My Reservation
              </Link>
              {' '}and entering your email and reservation ID.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/my-reservation"
              className="px-8 py-3 border-2 border-lavender-deep text-lavender-deep rounded-lg hover:bg-lavender-pale transition-colors"
            >
              Manage Reservation
            </Link>
            <Link
              href="/book"
              className="px-8 py-3 border-2 border-lavender-deep text-lavender-deep rounded-lg hover:bg-lavender-pale transition-colors"
            >
              Book Another Stay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-deep"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}



