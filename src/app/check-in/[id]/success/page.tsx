'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'

function CheckInSuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const reservationId = params.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream">
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
          
          <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-4">Check-In Successful!</h1>
          <p className="text-gray-600 mb-2">You have successfully checked in.</p>
          
          {reservationId && (
            <p className="text-sm text-gray-500 mb-8">Reservation #: {reservationId}</p>
          )}
          
          <div className="bg-lavender-pale rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-lavender-deep mb-4">What's Next?</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Your room is ready and waiting for you</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>If you need anything during your stay, please don't hesitate to contact us</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>We hope you enjoy your stay at Lavender Moon Villas!</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Need Assistance?</strong> Contact us at{' '}
              <a href="mailto:reservations@lavendermoon.net" className="text-blue-600 hover:underline">
                reservations@lavendermoon.net
              </a>
              {' '}or call{' '}
              <a href="tel:+18765068440" className="text-blue-600 hover:underline">
                +1 (876) 506-8440
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckInSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-deep"></div>
      </div>
    }>
      <CheckInSuccessContent />
    </Suspense>
  )
}

