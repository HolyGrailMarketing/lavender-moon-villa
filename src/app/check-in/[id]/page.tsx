'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckInPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = params.id as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing access token')
      setLoading(false)
      return
    }

    // Update current time every minute
    const updateTime = () => setCurrentTime(new Date())
    updateTime()
    const interval = setInterval(updateTime, 60000)

    fetchReservation()

    return () => clearInterval(interval)
  }, [reservationId, token])

  async function fetchReservation() {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/checkin?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reservation')
      }

      setReservation(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn() {
    if (!confirm('Are you ready to check in? This will confirm your arrival.')) {
      return
    }

    setError('')
    setCheckingIn(true)

    try {
      const res = await fetch(`/api/reservations/${reservationId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in')
      }

      // Redirect to success page
      router.push(`/check-in/${reservationId}/success?token=${token}`)
    } catch (err: any) {
      setError(err.message)
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-deep"></div>
      </div>
    )
  }

  if (error && !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Link href="/" className="text-lavender-deep hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  // Check if current time is within check-in window (3 PM - 9 PM)
  const now = currentTime || new Date()
  const checkInDate = new Date(reservation.check_in)
  const checkInDateStr = checkInDate.toDateString()
  const todayStr = now.toDateString()
  
  const isCheckInDate = checkInDateStr === todayStr
  const currentHour = now.getHours()
  const canCheckIn = isCheckInDate && currentHour >= 15 && currentHour < 21 // 3 PM to 9 PM
  const isAfterHours = isCheckInDate && currentHour >= 21 // After 9 PM

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
          <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-2">Check-In</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {reservation.status === 'checked_in' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">You're already checked in!</p>
              <p className="text-sm mt-1">Your reservation has been confirmed. Enjoy your stay!</p>
            </div>
          )}

          {!isCheckInDate && reservation.status !== 'checked_in' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Check-in Not Available Yet</p>
              <p className="text-sm mt-1">
                Check-in is only available on your check-in date ({new Date(reservation.check_in).toLocaleDateString()}) between 3:00 PM and 9:00 PM.
              </p>
            </div>
          )}

          {isAfterHours && reservation.status !== 'checked_in' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">After-Hours Check-In</p>
              <p className="text-sm mt-1">
                Self check-in is no longer available after 9:00 PM. Please contact security to collect your key.
              </p>
              <p className="text-sm mt-2">
                <strong>Security Contact:</strong> +1 (876) 506-8440
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-lavender-pale rounded-lg p-6">
              <h2 className="font-semibold text-lavender-deep mb-4">Reservation Details</h2>
              <div className="space-y-2">
                <p><strong>Reservation #:</strong> {reservation.id}</p>
                <p><strong>Guest:</strong> {reservation.guest_name}</p>
                <p><strong>Room:</strong> {reservation.room_number} - {reservation.room_name}</p>
                <p><strong>Check-in Date:</strong> {new Date(reservation.check_in).toLocaleDateString()}</p>
                <p><strong>Check-in Time:</strong> 3:00 PM - 9:00 PM</p>
              </div>
            </div>

            {canCheckIn && reservation.status !== 'checked_in' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2">Ready to Check In</h3>
                <p className="text-sm text-green-700 mb-4">
                  You can now check yourself in. Click the button below to confirm your arrival.
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {checkingIn ? 'Checking In...' : 'Check In Now'}
                </button>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">
                If you need assistance with check-in or have any questions, please contact us:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>📧 <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a></li>
                <li>📱 WhatsApp: <a href="https://wa.me/18765068440" className="text-lavender-deep hover:underline">+1 (876) 506-8440</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

