'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('reservation_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-deep"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-lavender-pale sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Pictures/Logo.png" alt="Lavender Moon Villas" width={50} height={50} className="h-12 w-auto" style={{ width: 'auto', height: '3rem' }} />
            <span className="text-xl font-serif text-lavender-deep">Lavender Moon Villas</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-serif text-gray-800 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-2">We were unable to process your payment.</p>
          
          {reservationId && (
            <p className="text-sm text-gray-500 mb-8">Reservation #: {reservationId}</p>
          )}
          
          <div className="bg-red-50 rounded-lg p-6 mb-8 text-left border border-red-200">
            <h2 className="font-semibold text-red-800 mb-4">What happened?</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>Your payment could not be processed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>Your reservation is still pending payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>Please try again or contact us for assistance</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-8 py-3 border-2 border-lavender-deep text-lavender-deep rounded-lg hover:bg-lavender-pale transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need help?</p>
            <p className="text-sm text-gray-600">
              Contact us at <a href="tel:+18765161421" className="text-lavender-deep hover:underline">+1 (876) 516-1421</a> or{' '}
              <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


