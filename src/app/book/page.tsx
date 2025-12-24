'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Room = {
  id: number
  room_number: string
  name: string
  price_per_night: number
  max_guests: number
}

export default function BookPage() {
  const router = useRouter()
  const [step, setStep] = useState<'dates' | 'rooms' | 'details' | 'confirmation'>('dates')
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [formData, setFormData] = useState({
    check_in: '',
    check_out: '',
    num_guests: 1,
    room_id: '',
    guest: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
    },
    special_requests: '',
  })
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)

  useEffect(() => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0]
    if (!formData.check_in || formData.check_in < today) {
      setFormData(prev => ({ ...prev, check_in: today }))
    }
  }, [])

  async function checkAvailability() {
    if (!formData.check_in || !formData.check_out) {
      alert('Please select check-in and check-out dates')
      return
    }

    if (new Date(formData.check_out) <= new Date(formData.check_in)) {
      alert('Check-out date must be after check-in date')
      return
    }

    setCheckingAvailability(true)
    try {
      const res = await fetch(
        `/api/reservations/availability/public?check_in=${formData.check_in}&check_out=${formData.check_out}`
      )
      if (res.ok) {
        const data = await res.json()
        setAvailableRooms(data)
        if (data.length === 0) {
          alert('No rooms available for these dates. Please try different dates.')
        } else {
          setStep('rooms')
        }
      } else {
        alert('Error checking availability')
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      alert('Error checking availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  function selectRoom(roomId: string) {
    setFormData({ ...formData, room_id: roomId })
    setStep('details')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Create guest
      const guestRes = await fetch('/api/guests/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.guest),
      })

      if (!guestRes.ok) throw new Error('Failed to create guest')
      const guest = await guestRes.json()

      // Calculate total price
      const selectedRoom = availableRooms.find(r => r.id.toString() === formData.room_id)
      if (!selectedRoom) {
        throw new Error('Room not found')
      }

      const nights = Math.ceil(
        (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      const totalPrice = Number(selectedRoom.price_per_night) * nights

      // Create reservation
      const reservationRes = await fetch('/api/reservations/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: parseInt(formData.room_id),
          guest_id: guest.id,
          check_in: formData.check_in,
          check_out: formData.check_out,
          num_guests: formData.num_guests,
          total_price: totalPrice,
          special_requests: formData.special_requests || null,
        }),
      })

      if (!reservationRes.ok) {
        const error = await reservationRes.json()
        throw new Error(error.error || 'Failed to create reservation')
      }

      const reservation = await reservationRes.json()
      setBookingId(reservation.id)
      setBookingConfirmed(true)
      setStep('confirmation')
    } catch (error: any) {
      alert(error.message || 'Error creating reservation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedRoom = availableRooms.find(r => r.id.toString() === formData.room_id)
  const nights = formData.check_in && formData.check_out
    ? Math.ceil(
        (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    : 0
  const totalPrice = selectedRoom ? Number(selectedRoom.price_per_night) * nights : 0

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[
              { key: 'dates', label: '1. Dates', icon: '📅' },
              { key: 'rooms', label: '2. Room', icon: '🛏️' },
              { key: 'details', label: '3. Details', icon: '✏️' },
              { key: 'confirmation', label: '4. Confirm', icon: '✅' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex flex-col items-center ${step === s.key ? 'text-lavender-deep' : step === 'confirmation' || ['dates', 'rooms', 'details', 'confirmation'].indexOf(step) > ['dates', 'rooms', 'details', 'confirmation'].indexOf(s.key) ? 'text-lavender-medium' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${step === s.key ? 'bg-lavender-deep text-white' : step === 'confirmation' || ['dates', 'rooms', 'details', 'confirmation'].indexOf(step) > ['dates', 'rooms', 'details', 'confirmation'].indexOf(s.key) ? 'bg-lavender-medium text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {s.icon}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{s.label}</span>
                </div>
                {i < 3 && <div className={`w-8 md:w-16 h-0.5 mx-2 ${step === 'confirmation' || ['dates', 'rooms', 'details', 'confirmation'].indexOf(step) > i ? 'bg-lavender-medium' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Dates */}
        {step === 'dates' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-2">Book Your Stay</h1>
            <p className="text-gray-600 mb-8">Select your check-in and check-out dates</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  required
                  min={formData.check_in || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none text-lg"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
              <select
                value={formData.num_guests}
                onChange={(e) => setFormData({ ...formData, num_guests: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none text-lg"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            <button
              onClick={checkAvailability}
              disabled={checkingAvailability || !formData.check_in || !formData.check_out}
              className="w-full py-4 bg-lavender-deep text-white text-lg font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingAvailability ? 'Checking Availability...' : 'Check Availability'}
            </button>
          </div>
        )}

        {/* Step 2: Select Room */}
        {step === 'rooms' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <button
              onClick={() => setStep('dates')}
              className="text-lavender-medium hover:text-lavender-deep mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h2 className="text-2xl md:text-3xl font-serif text-lavender-deep mb-6">Available Rooms</h2>
            
            {availableRooms.length === 0 ? (
              <p className="text-gray-600">No rooms available for the selected dates.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableRooms.map(room => (
                  <div
                    key={room.id}
                    onClick={() => selectRoom(room.id.toString())}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      formData.room_id === room.id.toString()
                        ? 'border-lavender-deep bg-lavender-pale'
                        : 'border-lavender-pale hover:border-lavender-medium hover:shadow-lg'
                    }`}
                  >
                    <h3 className="text-xl font-semibold text-lavender-deep mb-2">{room.room_number}</h3>
                    <p className="text-gray-600 mb-4">{room.name}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-lavender-deep">${room.price_per_night}</p>
                        <p className="text-sm text-gray-500">per night</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        Max {room.max_guests} {room.max_guests === 1 ? 'guest' : 'guests'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Guest Details */}
        {step === 'details' && selectedRoom && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <button
              onClick={() => setStep('rooms')}
              className="text-lavender-medium hover:text-lavender-deep mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h2 className="text-2xl md:text-3xl font-serif text-lavender-deep mb-6">Guest Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.guest.first_name}
                    onChange={(e) => setFormData({
                      ...formData,
                      guest: { ...formData.guest, first_name: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.guest.last_name}
                    onChange={(e) => setFormData({
                      ...formData,
                      guest: { ...formData.guest, last_name: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.guest.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, email: e.target.value }
                  })}
                  required
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.guest.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, phone: e.target.value }
                  })}
                  required
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.guest.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, address: e.target.value }
                  })}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-lavender-pale rounded-lg focus:border-lavender-medium focus:outline-none resize-none"
                  placeholder="Any special requests or notes for your stay..."
                />
              </div>

              {/* Booking Summary */}
              <div className="bg-lavender-pale rounded-lg p-6">
                <h3 className="font-semibold text-lavender-deep mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{selectedRoom.room_number} - {selectedRoom.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{new Date(formData.check_in).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{new Date(formData.check_out).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nights:</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-lavender-deep pt-2 border-t border-lavender-medium">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-lavender-deep text-white text-lg font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Booking'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && bookingConfirmed && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-lavender-deep mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-2">Thank you for your reservation.</p>
            <p className="text-sm text-gray-500 mb-8">Confirmation #: {bookingId}</p>
            <p className="text-gray-600 mb-8">
              A confirmation email will be sent to <strong>{formData.guest.email}</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

