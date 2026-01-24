'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface UserData {
  request_date: string
  personal_information: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    address: string | null
    id_type: string | null
    id_number: string | null
    account_created: string
  }
  reservations: Array<{
    reservation_id: string
    room: string
    check_in: string
    check_out: string
    number_of_guests: number
    total_price: number
    status: string
    special_requests: string | null
    guest_name_on_booking: string | null
    booking_date: string
  }>
  data_retention_info: {
    retention_period: string
    deletion_policy: string
  }
}

function DataAccessContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState('')

  const emailParam = searchParams.get('email')
  const tokenParam = searchParams.get('token')

  useEffect(() => {
    // If email and token are provided, fetch the data
    if (emailParam && tokenParam) {
      fetchUserData(emailParam, tokenParam)
    }
  }, [emailParam, tokenParam])

  async function fetchUserData(email: string, token: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/data-rights/access?email=${encodeURIComponent(email)}&token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setUserData(data)
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

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/data-rights/access', {
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

  function downloadData() {
    if (!userData) return
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lavender-moon-my-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Show data view if we have user data
  if (userData) {
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-lavender-deep text-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/" className="text-lavender-pale hover:text-white text-sm mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-serif">Your Personal Data</h1>
            <p className="text-lavender-pale mt-2">
              Requested on {new Date(userData.request_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Download Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={downloadData}
              className="px-4 py-2 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download as JSON
            </button>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-lavender-deep mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium">{userData.personal_information.first_name} {userData.personal_information.last_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{userData.personal_information.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{userData.personal_information.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Address</label>
                <p className="font-medium">{userData.personal_information.address || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">ID Type</label>
                <p className="font-medium">{userData.personal_information.id_type || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">ID Number</label>
                <p className="font-medium">{userData.personal_information.id_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Account Created</label>
                <p className="font-medium">{new Date(userData.personal_information.account_created).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
              </div>
            </div>
          </div>

          {/* Reservations */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-lavender-deep mb-4">Reservation History</h2>
            {userData.reservations.length === 0 ? (
              <p className="text-gray-500">No reservations found.</p>
            ) : (
              <div className="space-y-4">
                {userData.reservations.map((reservation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lavender-deep">{reservation.reservation_id}</p>
                        <p className="text-sm text-gray-600">{reservation.room}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        reservation.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                        reservation.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                        reservation.status === 'paid_in_full' ? 'bg-green-100 text-green-700' :
                        reservation.status === 'deposit_paid' ? 'bg-yellow-100 text-yellow-700' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {reservation.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Check-in:</span>
                        <p>{new Date(reservation.check_in).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Check-out:</span>
                        <p>{new Date(reservation.check_out).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Guests:</span>
                        <p>{reservation.number_of_guests}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p>${Number(reservation.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                    {reservation.special_requests && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Special Requests:</span>
                        <p>{reservation.special_requests}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Retention Info */}
          <div className="bg-lavender-pale/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-lavender-deep mb-4">Data Retention Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Retention Period:</strong> {userData.data_retention_info.retention_period}</p>
              <p><strong>Policy:</strong> {userData.data_retention_info.deletion_policy}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-lavender-medium">
              <p className="text-sm text-gray-600">
                To request correction or deletion of your data, please contact us at{' '}
                <a href="mailto:privacy@lavendermoon.net" className="text-lavender-deep hover:underline">
                  privacy@lavendermoon.net
                </a>
              </p>
            </div>
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
          <h1 className="text-3xl md:text-4xl font-serif">Access Your Data</h1>
          <p className="text-lavender-pale mt-2">
            View all personal data we hold about you
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
              Click the link in your email to view your data.
            </p>
            <p className="text-sm text-gray-500">
              The link expires in 1 hour.
            </p>
          </div>
        ) : !loading && !userData && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Your Data</h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we&apos;ll send you a secure link to view all your personal data.
            </p>
            
            <form onSubmit={handleRequestAccess} className="space-y-4">
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

export default function DataAccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="bg-lavender-deep text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-serif">Access Your Data</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lavender-pale border-t-lavender-deep"></div>
        </div>
      </main>
    }>
      <DataAccessContent />
    </Suspense>
  )
}

