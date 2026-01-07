'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function MyReservationPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [reservationId, setReservationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      // Request verification email
      const res = await fetch('/api/reservations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reservation_id: reservationId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to lookup reservation')
      }

      // Show success message
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-2">Manage Your Reservation</h1>
          <p className="text-gray-600 mb-8">Enter your email and reservation ID to access your booking</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold mb-2">Verification email sent!</p>
              <p className="text-sm">Please check your email inbox and click the link to access your reservation. The link will expire in 1 hour.</p>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reservation ID *</label>
              <input
                type="text"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                placeholder="Enter your reservation number"
              />
              <p className="text-xs text-gray-500 mt-2">You can find this in your confirmation email</p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-lavender-deep text-white text-lg font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Verification...' : success ? 'Email Sent!' : 'Access My Reservation'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-lavender-pale">
            <p className="text-sm text-gray-600 text-center">
              Don't have your reservation ID?{' '}
              <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

