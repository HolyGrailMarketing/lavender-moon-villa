'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface GuestData {
  guest_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
}

function DataCorrectionContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [guestData, setGuestData] = useState<GuestData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  })

  const emailParam = searchParams.get('email')
  const tokenParam = searchParams.get('token')

  useEffect(() => {
    // If email and token are provided, fetch the current data
    if (emailParam && tokenParam) {
      fetchGuestData(emailParam, tokenParam)
    }
  }, [emailParam, tokenParam])

  async function fetchGuestData(email: string, token: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/data-rights/correction?email=${encodeURIComponent(email)}&token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setGuestData(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
        })
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestCorrection(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/data-rights/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setRequestSent(true)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to send request')
      }
    } catch (err) {
      setError('Failed to send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitCorrection(e: React.FormEvent) {
    e.preventDefault()
    if (!emailParam || !tokenParam) {
      setError('Missing verification credentials')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(
        `/api/data-rights/correction?email=${encodeURIComponent(emailParam)}&token=${tokenParam}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )
      if (res.ok) {
        setSuccess(true)
        // Update guestData with new values
        if (guestData) {
          setGuestData({
            ...guestData,
            ...formData,
          })
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to update information')
      }
    } catch (err) {
      setError('Failed to update information. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Show correction form if we have guest data
  if (guestData) {
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-lavender-deep text-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/" className="text-lavender-pale hover:text-white text-sm mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-serif">Update Your Information</h1>
            <p className="text-lavender-pale mt-2">
              Correct or update your personal information
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">Your information has been updated successfully!</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmitCorrection} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={guestData.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>

              <div className="bg-lavender-pale/30 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Updating your name will also update your name on future reservations. 
                  Existing reservations will retain the name used at the time of booking.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-lavender-deep text-white font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Information'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link href="/privacy" className="text-sm text-lavender-deep hover:underline">
              View Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Show request form or success message
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-lavender-deep text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-lavender-pale hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif">Update Your Information</h1>
          <p className="text-lavender-pale mt-2">
            Correct or update your personal information
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lavender-pale border-t-lavender-deep mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {requestSent ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              If an account exists with that email address, we&apos;ve sent you a verification link. 
              Click the link in your email to update your information.
            </p>
            <p className="text-sm text-gray-500">
              The link expires in 1 hour.
            </p>
          </div>
        ) : !loading && !guestData && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Update Access</h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we&apos;ll send you a secure link to update your personal information.
            </p>
            
            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-lavender-deep text-white font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Link'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Learn more about how we handle your data in our{' '}
                <Link href="/privacy" className="text-lavender-deep hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function DataCorrectionPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="bg-lavender-deep text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-serif">Update Your Information</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lavender-pale border-t-lavender-deep"></div>
        </div>
      </main>
    }>
      <DataCorrectionContent />
    </Suspense>
  )
}

