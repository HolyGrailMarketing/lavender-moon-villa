'use client'

import { useState, useEffect } from 'react'

type Room = {
  id: number
  room_number: string
  name: string
  price_per_night: number
  max_guests: number
}


type ReservationFormProps = {
  reservationId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

type GuestData = {
  id?: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  id_type: string
  id_number: string
}

export default function ReservationForm({ reservationId, onSuccess, onCancel }: ReservationFormProps) {
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  
  const [guestId, setGuestId] = useState<number | null>(null)
  const [useCustomTotal, setUseCustomTotal] = useState(false)
  const [customTotal, setCustomTotal] = useState('')
  const [additionalGuests, setAdditionalGuests] = useState<string[]>([])
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true) // Default to enabled
  const [additionalItems, setAdditionalItems] = useState<Array<{ description: string; amount: number }>>([])
  const [amountPaid, setAmountPaid] = useState('')
  const [formData, setFormData] = useState({
    check_in: '',
    check_out: '',
    num_guests: 1,
    room_id: '',
    source: 'direct',
    guest: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      id_type: 'passport',
      id_number: '',
    } as GuestData,
    special_requests: '',
  })

  useEffect(() => {
    fetchRooms()
    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId])

  useEffect(() => {
    if (reservationId && formData.room_id && formData.check_in && formData.check_out) {
      // When editing, show all rooms (not just available ones)
      setAvailableRooms(rooms)
    }
  }, [reservationId, formData.room_id, formData.check_in, formData.check_out, rooms])

  async function fetchRooms() {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  async function fetchReservation() {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`)
      if (res.ok) {
        const data = await res.json()
        const nameParts = (data.guest_name || '').split(' ')
        setGuestId(data.guest_id)
        setFormData({
          check_in: data.check_in.split('T')[0],
          check_out: data.check_out.split('T')[0],
          num_guests: data.num_guests,
          room_id: data.room_id.toString(),
          source: data.source || 'direct',
          guest: {
            id: data.guest_id,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: data.guest_email || '',
            phone: data.guest_phone || '',
            address: data.guest_address || '',
            id_type: data.guest_id_type || 'passport',
            id_number: data.guest_id_number || '',
          },
          special_requests: data.special_requests || '',
        })
        // Load custom total if set
        if (data.use_custom_total) {
          setUseCustomTotal(true)
          setCustomTotal(data.total_price?.toString() || '')
        }
        // Load additional guests
        if (data.additional_guests) {
          try {
            setAdditionalGuests(JSON.parse(data.additional_guests))
          } catch (e) {
            setAdditionalGuests([])
          }
        }
        // Load service charge
        setServiceChargeEnabled(data.service_charge > 0)
        // Load additional items
        if (data.additional_items) {
          try {
            setAdditionalItems(Array.isArray(data.additional_items) ? data.additional_items : JSON.parse(data.additional_items))
          } catch (e) {
            setAdditionalItems([])
          }
        }
        // Load amount paid
        if (data.amount_paid) {
          setAmountPaid(data.amount_paid.toString())
        }
        // Set available rooms to all rooms when editing
        setAvailableRooms(rooms)
      }
    } catch (error) {
      console.error('Error fetching reservation:', error)
    }
  }

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
        `/api/reservations/availability?check_in=${formData.check_in}&check_out=${formData.check_out}`
      )
      if (res.ok) {
        const data = await res.json()
        setAvailableRooms(data)
        if (data.length === 0) {
          alert('No rooms available for these dates')
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      alert('Error checking availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Create or update guest
      const guestRes = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.guest),
      })

      if (!guestRes.ok) throw new Error('Failed to create/update guest')
      const guest = await guestRes.json()

      // Calculate total price
      const selectedRoom = availableRooms.find(r => r.id.toString() === formData.room_id) ||
                          rooms.find(r => r.id.toString() === formData.room_id)
      if (!selectedRoom) {
        throw new Error('Room not found')
      }

      const nights = Math.ceil(
        (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      const calculatedPrice = Number(selectedRoom.price_per_night) * nights
      const basePrice = useCustomTotal && customTotal ? parseFloat(customTotal) : calculatedPrice
      
      // Calculate service charge (15% of base price)
      const serviceChargeAmount = serviceChargeEnabled ? basePrice * 0.15 : 0
      
      // Calculate additional items total
      const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      // Calculate final total
      const finalPrice = basePrice + serviceChargeAmount + additionalItemsTotal

      // Create or update reservation
      const url = reservationId 
        ? `/api/reservations/${reservationId}`
        : '/api/reservations'
      
      const method = reservationId ? 'PATCH' : 'POST'

      const reservationData: any = {
        check_in: formData.check_in,
        check_out: formData.check_out,
        num_guests: formData.num_guests,
        total_price: finalPrice,
        special_requests: formData.special_requests || null,
        source: formData.source,
        use_custom_total: useCustomTotal,
        additional_guests: additionalGuests.length > 0 ? JSON.stringify(additionalGuests) : null,
        service_charge: serviceChargeAmount,
        additional_items: additionalItems.length > 0 ? additionalItems : [],
        amount_paid: amountPaid ? parseFloat(amountPaid) : 0,
      }

      if (!reservationId) {
        reservationData.room_id = parseInt(formData.room_id)
        reservationData.guest_id = guest.id
      } else {
        reservationData.room_id = parseInt(formData.room_id)
      }

      const reservationRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      })

      if (!reservationRes.ok) {
        const error = await reservationRes.json()
        throw new Error(error.error || 'Failed to create reservation')
      }

      if (onSuccess) onSuccess()
    } catch (error: any) {
      alert(error.message || 'Error creating reservation')
    } finally {
      setLoading(false)
    }
  }

  const selectedRoom = availableRooms.find(r => r.id.toString() === formData.room_id) ||
                      rooms.find(r => r.id.toString() === formData.room_id)
  const nights = formData.check_in && formData.check_out
    ? Math.ceil(
        (new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    : 0
  const basePrice = selectedRoom ? Number(selectedRoom.price_per_night) * nights : 0
  const roomPrice = useCustomTotal && customTotal ? parseFloat(customTotal) : basePrice
  const serviceChargeAmount = serviceChargeEnabled ? roomPrice * 0.15 : 0
  const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalPrice = roomPrice + serviceChargeAmount + additionalItemsTotal
  const paidAmount = amountPaid ? parseFloat(amountPaid) : 0
  const outstandingBalance = totalPrice - paidAmount

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
          <input
            type="date"
            value={formData.check_in}
            onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={checkAvailability}
          disabled={checkingAvailability || !formData.check_in || !formData.check_out}
          className="px-4 py-2 bg-lavender-medium text-white rounded-lg hover:bg-lavender-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkingAvailability ? 'Checking...' : 'Check Availability'}
        </button>
      </div>

      {(availableRooms.length > 0 || reservationId) && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Room</label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            >
              <option value="">Select a room</option>
              {(reservationId ? rooms : availableRooms).map(room => (
                <option key={room.id} value={room.id}>
                  {room.room_number} - {room.name} (${room.price_per_night}/night)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            >
              <option value="direct">Direct Booking</option>
              <option value="booking">Booking.com</option>
              <option value="expedia">Expedia</option>
              <option value="airbnb">Airbnb</option>
              <option value="travel_agent">Travel Agent</option>
              <option value="phone">Phone Reservation</option>
              <option value="walkin">Walk-in</option>
              <option value="other">Other</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
        <input
          type="number"
          min="1"
          max={selectedRoom?.max_guests || 4}
          value={formData.num_guests}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1
            setFormData({ ...formData, num_guests: value })
          }}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.guest.first_name}
              onChange={(e) => setFormData({
                ...formData,
                guest: { ...formData.guest, first_name: e.target.value }
              })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.guest.last_name}
              onChange={(e) => setFormData({
                ...formData,
                guest: { ...formData.guest, last_name: e.target.value }
              })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.guest.email}
            onChange={(e) => setFormData({
              ...formData,
              guest: { ...formData.guest, email: e.target.value }
            })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.guest.phone}
            onChange={(e) => setFormData({
              ...formData,
              guest: { ...formData.guest, phone: e.target.value }
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={formData.guest.address}
            onChange={(e) => setFormData({
              ...formData,
              guest: { ...formData.guest, address: e.target.value }
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
            <select
              value={formData.guest.id_type}
              onChange={(e) => setFormData({
                ...formData,
                guest: { ...formData.guest, id_type: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            >
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s License</option>
              <option value="national_id">National ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
            <input
              type="text"
              value={formData.guest.id_number}
              onChange={(e) => setFormData({
                ...formData,
                guest: { ...formData.guest, id_number: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Additional Guests */}
      {formData.num_guests > 1 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Additional Guests</h3>
            <button
              type="button"
              onClick={() => setAdditionalGuests([...additionalGuests, ''])}
              className="text-sm px-3 py-1 bg-lavender-pale text-lavender-deep rounded-lg hover:bg-lavender-medium hover:text-white transition-colors"
            >
              + Add Guest
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Add the names of other guests staying in this room</p>
          <div className="space-y-3">
            {additionalGuests.map((guest, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={guest}
                  onChange={(e) => {
                    const updated = [...additionalGuests]
                    updated[index] = e.target.value
                    setAdditionalGuests(updated)
                  }}
                  placeholder={`Guest ${index + 2} full name`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = additionalGuests.filter((_, i) => i !== index)
                    setAdditionalGuests(updated)
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {additionalGuests.length === 0 && (
              <p className="text-sm text-gray-400 italic">No additional guests added yet</p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
        <textarea
          value={formData.special_requests}
          onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
        />
      </div>

      {selectedRoom && nights > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-lavender-deep to-lavender-medium px-5 py-4">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Pricing Summary
            </h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Room Details Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">{selectedRoom.name}</p>
                  <p className="text-sm text-gray-500">Room {selectedRoom.room_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lavender-deep">${Number(selectedRoom.price_per_night).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">per night</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-600">{nights} night{nights > 1 ? 's' : ''}</span>
                <span className="font-semibold text-gray-900">${roomPrice.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Custom Price Toggle */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useCustomTotal}
                    onChange={(e) => {
                      setUseCustomTotal(e.target.checked)
                      if (!e.target.checked) setCustomTotal('')
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
                <div>
                  <span className="font-medium text-amber-800">Custom Room Price</span>
                  <p className="text-xs text-amber-600">For discounts, OTA rates, or special pricing</p>
                </div>
              </label>
              {useCustomTotal && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customTotal}
                      onChange={(e) => setCustomTotal(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Charge */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={serviceChargeEnabled}
                      onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Service Charge</span>
                    <p className="text-xs text-blue-600">15% of room price</p>
                  </div>
                </div>
                {serviceChargeEnabled && (
                  <span className="font-semibold text-blue-700">${serviceChargeAmount.toFixed(2)}</span>
                )}
              </label>
            </div>

            {/* Additional Items */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-emerald-800">Additional Charges</span>
                  <p className="text-xs text-emerald-600">Food, drinks, services, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdditionalItems([...additionalItems, { description: '', amount: 0 }])}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>
              
              {additionalItems.length > 0 ? (
                <div className="space-y-2">
                  {additionalItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-white rounded-lg p-2 border border-emerald-200">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...additionalItems]
                          updated[index].description = e.target.value
                          setAdditionalItems(updated)
                        }}
                        placeholder="Item description..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount || ''}
                          onChange={(e) => {
                            const updated = [...additionalItems]
                            updated[index].amount = parseFloat(e.target.value) || 0
                            setAdditionalItems(updated)
                          }}
                          placeholder="0.00"
                          className="w-24 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdditionalItems(additionalItems.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {additionalItemsTotal > 0 && (
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-emerald-200">
                      <span className="text-sm text-emerald-700">Items Subtotal</span>
                      <span className="font-semibold text-emerald-700">${additionalItemsTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 italic text-center py-2">No additional items added</p>
              )}
            </div>

            {/* Total Section */}
            <div className="bg-gradient-to-br from-lavender-pale to-white rounded-lg p-5 border-2 border-lavender-medium">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-lavender-deep">${totalPrice.toFixed(2)}</span>
              </div>
              
              {/* Payment Input */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Amount Paid
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent text-lg font-medium"
                  />
                </div>
              </div>

              {/* Outstanding Balance */}
              <div className={`rounded-lg p-4 flex justify-between items-center ${
                outstandingBalance > 0 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-2">
                  {outstandingBalance > 0 ? (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className={`font-semibold ${outstandingBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {outstandingBalance > 0 ? 'Balance Due' : 'Paid in Full'}
                  </span>
                </div>
                <span className={`text-xl font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(outstandingBalance).toFixed(2)}
                  {outstandingBalance < 0 && <span className="text-sm ml-1">(credit)</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <button
          type="submit"
          disabled={loading || !formData.room_id}
          className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          {loading ? 'Saving...' : reservationId ? 'Update Reservation' : 'Create Reservation'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

