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
  const [step, setStep] = useState<'dates' | 'rooms' | 'details' | 'payment' | 'confirmation'>('dates')
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
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
  const [reservationId, setReservationId] = useState<number | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

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

      // Create reservation with 'pending' status (will be confirmed after payment)
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
      setReservationId(reservation.id)
      setStep('payment') // Move to payment step
    } catch (error: any) {
      alert(error.message || 'Error creating reservation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    if (!reservationId || !selectedRoom) return

    setProcessingPayment(true)

    try {
      const nights = Math.ceil(
        (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      const totalPrice = Number(selectedRoom.price_per_night) * nights

      // Initiate WiPay payment
      const paymentRes = await fetch('/api/payments/wipay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          amount: totalPrice,
          customer_name: `${formData.guest.first_name} ${formData.guest.last_name}`,
          customer_email: formData.guest.email,
          customer_phone: formData.guest.phone,
          return_url: `${window.location.origin}/api/payments/wipay/callback`,
        }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.error || 'Failed to initiate payment')
      }

      const paymentData = await paymentRes.json()

      // Create form to submit to WiPay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentData.payment_url

      // Add all payment parameters as hidden fields
      Object.entries(paymentData.payment_params).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (error: any) {
      alert(error.message || 'Error initiating payment. Please try again.')
      setProcessingPayment(false)
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
          <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto pb-2">
            {[
              { key: 'dates', label: '1. Dates' },
              { key: 'rooms', label: '2. Room' },
              { key: 'details', label: '3. Details' },
              { key: 'payment', label: '4. Payment' },
              { key: 'confirmation', label: '5. Confirm' },
            ].map((s, i) => {
              const stepOrder = ['dates', 'rooms', 'details', 'payment', 'confirmation']
              const currentStepIndex = stepOrder.indexOf(step)
              const stepIndex = stepOrder.indexOf(s.key)
              const isActive = step === s.key
              const isCompleted = currentStepIndex > stepIndex
              
              return (
                <div key={s.key} className="flex items-center">
                  <div className={`flex flex-col items-center ${isActive ? 'text-lavender-deep' : isCompleted ? 'text-lavender-medium' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-lavender-deep text-white' : isCompleted ? 'bg-lavender-medium text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {s.key === 'dates' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {s.key === 'rooms' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )}
                      {s.key === 'details' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {s.key === 'payment' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                      {s.key === 'confirmation' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs mt-1 hidden sm:block whitespace-nowrap">{s.label}</span>
                  </div>
                  {i < 4 && <div className={`w-4 md:w-8 h-0.5 mx-1 ${isCompleted ? 'bg-lavender-medium' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
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
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 'payment' && selectedRoom && reservationId && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <button
              onClick={() => setStep('details')}
              className="text-lavender-medium hover:text-lavender-deep mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h2 className="text-2xl md:text-3xl font-serif text-lavender-deep mb-6">Complete Payment</h2>
            
            <div className="bg-lavender-pale rounded-lg p-6 mb-6">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-medium">{formData.num_guests}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-lavender-deep pt-3 border-t border-lavender-medium mt-3">
                  <span>Total Amount:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p>You will be redirected to WiPay's secure payment page to complete your booking. Your reservation will be confirmed once payment is successful.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full py-4 bg-lavender-deep text-white text-lg font-medium rounded-lg hover:bg-lavender-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPayment ? 'Processing...' : `Pay ${totalPrice.toFixed(2)}`}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

