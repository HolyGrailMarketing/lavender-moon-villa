'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Reservation = {
  id: number
  room_id: number
  room_number: string
  room_name: string
  check_in: string
  check_out: string
  num_guests: number
  total_price: number
  status: string
  special_requests: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
  guest_address: string | null
  price_per_night: number
}

export default function EditReservationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservationId = params.id as string
  const token = searchParams.get('token')

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState({
    check_in: '',
    check_out: '',
    num_guests: 1,
    special_requests: '',
    guest_phone: '',
    guest_address: '',
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing access token')
      setLoading(false)
      return
    }

    fetchReservation()
  }, [reservationId, token])

  async function fetchReservation() {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/guest?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reservation')
      }

      setReservation(data)
      setFormData({
        check_in: data.check_in.split('T')[0],
        check_out: data.check_out.split('T')[0],
        num_guests: data.num_guests,
        special_requests: data.special_requests || '',
        guest_phone: data.guest_phone || '',
        guest_address: data.guest_address || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!reservation) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Check availability if dates changed
      if (formData.check_in !== reservation.check_in.split('T')[0] || 
          formData.check_out !== reservation.check_out.split('T')[0]) {
        const availRes = await fetch(
          `/api/reservations/availability/public?check_in=${formData.check_in}&check_out=${formData.check_out}`
        )
        const availableRooms = await availRes.json()
        
        // Check if current room is still available
        const roomAvailable = availableRooms.some(
          (r: any) => r.id === reservation.room_id
        )

        if (!roomAvailable) {
          throw new Error('Selected dates are not available for this room. Please choose different dates.')
        }
      }

      // Update reservation
      const updateRes = await fetch(`/api/reservations/${reservationId}/guest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          check_in: formData.check_in,
          check_out: formData.check_out,
          num_guests: formData.num_guests,
          special_requests: formData.special_requests,
          guest_phone: formData.guest_phone,
          guest_address: formData.guest_address,
        }),
      })

      const data = await updateRes.json()

      if (!updateRes.ok) {
        throw new Error(data.error || 'Failed to update reservation')
      }

      setSuccess('Reservation updated successfully! A confirmation email has been sent.')
      setEditMode(false)
      fetchReservation() // Refresh data
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) {
      return
    }

    if (!confirm('Please review the cancellation policy:\n\n- Cancellations 7+ days before check-in: Full refund less fees\n- Cancellations less than 7 days: 1 night cancellation fee applies\n\nDo you still want to cancel?')) {
      return
    }

    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/reservations/${reservationId}/guest`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel reservation')
      }

      alert('Reservation cancelled successfully. A confirmation email has been sent.')
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
            <Link href="/my-reservation" className="text-lavender-deep hover:underline">
              Try again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  const canEdit = reservation.status === 'pending' || reservation.status === 'deposit_paid' || reservation.status === 'paid_in_full'
  const nights = Math.ceil(
    (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
    (1000 * 60 * 60 * 24)
  )

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-2">
                Reservation #{reservation.id}
              </h1>
              <p className="text-gray-600">Status: <span className="font-semibold">
                {reservation.status === 'deposit_paid' ? 'Deposit Paid' :
                 reservation.status === 'paid_in_full' ? 'Paid in Full' :
                 reservation.status === 'checked_in' ? 'Checked In' :
                 reservation.status === 'checked_out' ? 'Checked Out' :
                 reservation.status === 'cancelled' ? 'Cancelled' :
                 'Pending'}
              </span></p>
            </div>
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
              >
                Edit Reservation
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              {reservation.status === 'checked_in' 
                ? 'This reservation cannot be edited as check-in has already occurred.'
                : reservation.status === 'cancelled'
                ? 'This reservation has been cancelled.'
                : 'This reservation cannot be edited.'}
            </div>
          )}

          <div className="space-y-6">
            {/* Room Information */}
            <div className="bg-lavender-pale rounded-lg p-6">
              <h2 className="font-semibold text-lavender-deep mb-4">Room Details</h2>
              <p className="text-lg">{reservation.room_number} - {reservation.room_name}</p>
            </div>

            {/* Dates and Guests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                {editMode && canEdit ? (
                  <input
                    type="date"
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                ) : (
                  <p className="text-gray-900">{new Date(reservation.check_in).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                {editMode && canEdit ? (
                  <input
                    type="date"
                    value={formData.check_out}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    min={formData.check_in || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                ) : (
                  <p className="text-gray-900">{new Date(reservation.check_out).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                {editMode && canEdit ? (
                  <select
                    value={formData.num_guests}
                    onChange={(e) => setFormData({ ...formData, num_guests: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{reservation.num_guests}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nights</label>
                <p className="text-gray-900">{nights}</p>
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-lavender-pale rounded-lg p-6">
              <h2 className="font-semibold text-lavender-deep mb-4">Guest Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{reservation.guest_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{reservation.guest_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {editMode && canEdit ? (
                    <input
                      type="tel"
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{reservation.guest_phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {editMode && canEdit ? (
                    <input
                      type="text"
                      value={formData.guest_address}
                      onChange={(e) => setFormData({ ...formData, guest_address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{reservation.guest_address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
              {editMode && canEdit ? (
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none resize-none"
                />
              ) : (
                <p className="text-gray-900 bg-lavender-pale rounded-lg p-4">
                  {reservation.special_requests || 'None'}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-lavender-pale rounded-lg p-6">
              <h2 className="font-semibold text-lavender-deep mb-4">Pricing</h2>
              <div className="flex justify-between text-lg font-bold text-lavender-deep">
                <span>Total:</span>
                <span>${reservation.total_price.toFixed(2)}</span>
              </div>
              {editMode && (formData.check_in !== reservation.check_in.split('T')[0] || 
                           formData.check_out !== reservation.check_out.split('T')[0]) && (
                <p className="text-sm text-gray-600 mt-2">
                  * Price will be recalculated based on new dates
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {editMode && canEdit && (
              <div className="flex gap-4 pt-6 border-t border-lavender-pale">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false)
                    setError('')
                    setSuccess('')
                    fetchReservation()
                  }}
                  disabled={saving}
                  className="px-6 py-3 border-2 border-lavender-deep text-lavender-deep rounded-lg hover:bg-lavender-pale transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {canEdit && !editMode && (
              <div className="pt-6 border-t border-lavender-pale">
                <button
                  onClick={handleCancel}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Reservation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

