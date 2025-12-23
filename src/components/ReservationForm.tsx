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
      const totalPrice = Number(selectedRoom.price_per_night) * nights

      // Create or update reservation
      const url = reservationId 
        ? `/api/reservations/${reservationId}`
        : '/api/reservations'
      
      const method = reservationId ? 'PATCH' : 'POST'

      const reservationData: any = {
        check_in: formData.check_in,
        check_out: formData.check_out,
        num_guests: formData.num_guests,
        total_price: totalPrice,
        special_requests: formData.special_requests || null,
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
  const totalPrice = selectedRoom ? Number(selectedRoom.price_per_night) * nights : 0

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
        <div className="bg-lavender-pale p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Room: {selectedRoom.room_number} - {selectedRoom.name}</span>
            <span>${Number(selectedRoom.price_per_night).toFixed(2)}/night</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Nights: {nights}</span>
            <span>${(totalPrice || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${(totalPrice || 0).toFixed(2)}</span>
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

