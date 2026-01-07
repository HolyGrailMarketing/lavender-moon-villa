'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'lmv_cookie_consent'

type ConsentStatus = 'pending' | 'accepted' | 'rejected'

export default function CookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('pending')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (savedConsent) {
      setConsentStatus(savedConsent as ConsentStatus)
      setIsVisible(false)
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setConsentStatus('accepted')
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
    setConsentStatus('rejected')
    setIsVisible(false)
  }

  // Don't render if consent already given or not yet ready to show
  if (!isVisible || consentStatus !== 'pending') {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon */}
          <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-lavender-pale rounded-full items-center justify-center">
            <svg className="w-6 h-6 text-lavender-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Text Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">We Value Your Privacy</h3>
            <p className="text-sm text-gray-600">
              We use essential cookies to ensure our website functions properly. We also use functional cookies to remember your preferences. 
              By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
              Read our{' '}
              <Link href="/privacy" className="text-lavender-deep hover:underline">
                Privacy Policy
              </Link>
              {' '}for more information.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-lavender-deep hover:bg-lavender-medium rounded-lg transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

