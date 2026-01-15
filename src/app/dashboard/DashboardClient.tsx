'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReservationForm from '@/components/ReservationForm'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import ImagesPage from './images/page'

type Reservation = {
  id: number
  room_number: string
  room_name: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  status: string
  num_guests: number
  total_price: number | string
  special_requests?: string
  created_at?: string
}

type Room = {
  id: number
  room_number: string
  name: string
  status: string
  price_per_night: number
}

export default function DashboardClient({ user }: { user: { name: string; role: string } }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<number | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingPriceRoomId, setEditingPriceRoomId] = useState<number | null>(null)
  const [priceEditValue, setPriceEditValue] = useState<string>('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationNotes, setCancellationNotes] = useState('')
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  const [changingStatusReservation, setChangingStatusReservation] = useState<Reservation | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusChangeCancellationReason, setStatusChangeCancellationReason] = useState('')
  const [statusChangeCancellationNotes, setStatusChangeCancellationNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [resRes, roomsRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/rooms')
      ])
      
      if (resRes.ok) {
        const data = await resRes.json()
        setReservations(data)
      }
      
      if (roomsRes.ok) {
        const data = await roomsRes.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to normalize dates for comparison
  const normalizeDate = (dateValue: string | Date): string => {
    if (!dateValue) return ''
    // If already a string in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue
    }
    // If string with time component, extract just the date part
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0]
    }
    // Try to parse as Date
    try {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch (e) {
      // If parsing fails, try to extract YYYY-MM-DD from string
      const match = String(dateValue).match(/(\d{4}-\d{2}-\d{2})/)
      if (match) return match[1]
    }
    return ''
  }

  // Helper function to format DATE fields (check_in, check_out) without timezone shifts
  const formatDateForDisplay = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '-'
    
    // Extract date part from string before parsing to avoid timezone issues
    let dateStr: string
    if (typeof dateValue === 'string') {
      dateStr = dateValue
    } else {
      // For Date objects, convert to ISO string first
      dateStr = dateValue.toISOString()
    }
    
    // Extract date part if it includes time (for DATE fields only)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    
    // Extract YYYY-MM-DD pattern from the string
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      // Parse the date components directly using local timezone to avoid shifts
      // This ensures the date shown matches what's stored in the database
      const year = parseInt(match[1])
      const month = parseInt(match[2]) - 1 // JavaScript months are 0-indexed
      const day = parseInt(match[3])
      const date = new Date(year, month, day)
      return date.toLocaleDateString()
    }
    
    // Fallback: try regular Date parsing (may have timezone issues)
    try {
      return new Date(dateValue).toLocaleDateString()
    } catch (e) {
      return '-'
    }
  }

  // Helper function to format TIMESTAMP fields (created_at) - converts to local time first
  const formatTimestampForDisplay = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '-'
    
    try {
      // Parse as full timestamp and convert to local date
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString()
    } catch (e) {
      return '-'
    }
  }

  // Get today's date in YYYY-MM-DD format
  const getToday = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = getToday()

  const todayArrivals = reservations.filter(r => {
    const checkInDate = normalizeDate(r.check_in)
    // Show reservations with today's check-in date that are confirmed (paid) but not yet checked in
    const matches = checkInDate === today && (r.status === 'deposit_paid' || r.status === 'paid_in_full' || r.status === 'pending')
    return matches
  })

  const todayDepartures = reservations.filter(r => {
    const checkOutDate = normalizeDate(r.check_out)
    // Show checked-in guests departing today
    const matches = checkOutDate === today && r.status === 'checked_in'
    return matches
  })

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
  const availableRooms = rooms.filter(r => r.status === 'available').length

  // Pending check-ins and check-outs for the Check In/Out tab
  // Include all confirmed reservations that haven't checked in yet, including past-due ones
  const pendingCheckIns = reservations.filter(r => {
    // Exclude already checked in, checked out, or cancelled
    if (['checked_in', 'checked_out', 'cancelled'].includes(r.status)) {
      return false
    }
    
    const checkInDate = normalizeDate(r.check_in)
    const isPastDue = checkInDate < today // Check-in date has passed
    const isConfirmed = ['deposit_paid', 'paid_in_full', 'pending'].includes(r.status)
    
    // Show confirmed reservations OR past-due reservations (regardless of status)
    return isConfirmed || isPastDue
  }).sort((a, b) => {
    // Sort past-due check-ins first
    const aDate = normalizeDate(a.check_in)
    const bDate = normalizeDate(b.check_in)
    const aPastDue = aDate < today
    const bPastDue = bDate < today

    if (aPastDue && !bPastDue) return -1
    if (!aPastDue && bPastDue) return 1
    return new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
  })

  const pendingCheckOuts = reservations.filter(r =>
    r.status === 'checked_in'
  )


  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/dashboard/login'
  }

  function openNewReservation() {
    setEditingReservation(null)
    setSelectedReservation(null)
    setShowReservationModal(true)
  }

  function openEditReservation(id: number) {
    setEditingReservation(id)
    setSelectedReservation(reservations.find(r => r.id === id) || null)
    setShowReservationModal(true)
  }

  function closeModal() {
    setShowReservationModal(false)
    setEditingReservation(null)
    setSelectedReservation(null)
  }

  async function handleReservationSuccess() {
    await fetchData()
    closeModal()
  }

  async function handleRoomStatusChange(roomId: number, newStatus: string) {
    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, status: newStatus }),
      })

      if (res.ok) {
        // Update the room in the local state
        setRooms(rooms.map(room => 
          room.id === roomId ? { ...room, status: newStatus } : room
        ))
      } else {
        alert('Failed to update room status')
      }
    } catch (error) {
      console.error('Error updating room status:', error)
      alert('Error updating room status')
    }
  }

  async function handleRoomPriceChange(roomId: number, newPrice: number) {
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price')
      return
    }

    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, price_per_night: newPrice }),
      })

      if (res.ok) {
        // Update the room in the local state
        setRooms(rooms.map(room => 
          room.id === roomId ? { ...room, price_per_night: newPrice } : room
        ))
      } else {
        alert('Failed to update room price')
      }
    } catch (error) {
      console.error('Error updating room price:', error)
      alert('Error updating room price')
    }
  }

  async function handleCheckIn(id: number) {
    if (!confirm('Check in this guest?')) return

    try {
      const res = await fetch(`/api/reservations/${id}/checkin`, { method: 'POST' })
      if (res.ok) {
        await fetchData()
        alert('Guest checked in successfully')
      } else {
        alert('Failed to check in')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in')
    }
  }

  async function handleCheckOut(id: number) {
    if (!confirm('Check out this guest?')) return

    try {
      const res = await fetch(`/api/reservations/${id}/checkout`, { method: 'POST' })
      if (res.ok) {
        await fetchData()
        alert('Guest checked out successfully')
      } else {
        alert('Failed to check out')
      }
    } catch (error) {
      console.error('Error checking out:', error)
      alert('Error checking out')
    }
  }

  function openCancelModal(reservation: Reservation) {
    setCancellingReservation(reservation)
    setCancellationReason('')
    setCancellationNotes('')
    setShowCancelModal(true)
  }

  function closeCancelModal() {
    setShowCancelModal(false)
    setCancellingReservation(null)
    setCancellationReason('')
    setCancellationNotes('')
  }

  async function handleCancelReservation() {
    if (!cancellingReservation) return
    if (!cancellationReason) {
      alert('Please select a cancellation reason')
      return
    }

    try {
      const res = await fetch(`/api/reservations/${cancellingReservation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_reason: cancellationReason,
          cancellation_notes: cancellationNotes || null,
        }),
      })

      if (res.ok) {
        await fetchData()
        closeCancelModal()
        alert('Reservation cancelled successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to cancel reservation')
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      alert('Error cancelling reservation')
    }
  }

  function openChangeStatusModal(reservation: Reservation) {
    setChangingStatusReservation(reservation)
    setNewStatus(reservation.status)
    setOpenActionMenu(null)
  }

  function closeChangeStatusModal() {
    setChangingStatusReservation(null)
    setNewStatus('')
    setStatusChangeCancellationReason('')
    setStatusChangeCancellationNotes('')
  }

  async function handleStatusChange() {
    if (!changingStatusReservation || !newStatus) return

    // If changing to cancelled, require cancellation reason and use DELETE endpoint
    if (newStatus === 'cancelled') {
      if (!statusChangeCancellationReason) {
        alert('Please select a cancellation reason')
        return
      }

      try {
        const res = await fetch(`/api/reservations/${changingStatusReservation.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancellation_reason: statusChangeCancellationReason,
            cancellation_notes: statusChangeCancellationNotes || null,
          }),
        })

        if (res.ok) {
          await fetchData()
          closeChangeStatusModal()
          alert('Reservation cancelled successfully')
        } else {
          const error = await res.json()
          alert(error.error || 'Failed to cancel reservation')
        }
      } catch (error) {
        console.error('Error cancelling reservation:', error)
        alert('Error cancelling reservation')
      }
    } else {
      // For other status changes, use PATCH endpoint
      try {
        const res = await fetch(`/api/reservations/${changingStatusReservation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })

        if (res.ok) {
          await fetchData()
          closeChangeStatusModal()
          alert('Reservation status updated successfully')
        } else {
          const error = await res.json()
          alert(error.error || 'Failed to update status')
        }
      } catch (error) {
        console.error('Error updating status:', error)
        alert('Error updating status')
      }
    }
  }

  async function handleQuickCheckIn(reservationId: number) {
    if (confirm('Are you sure you want to check in this guest?')) {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'checked_in' }),
        })

        if (res.ok) {
          await fetchData()
          alert('Guest checked in successfully')
        } else {
          const error = await res.json()
          alert(error.error || 'Failed to check in guest')
        }
      } catch (error) {
        console.error('Error checking in guest:', error)
        alert('Error checking in guest')
      }
    }
  }

  async function handleQuickCheckOut(reservationId: number) {
    if (confirm('Are you sure you want to check out this guest?')) {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'checked_out' }),
        })

        if (res.ok) {
          await fetchData()
          alert('Guest checked out successfully')
        } else {
          const error = await res.json()
          alert(error.error || 'Failed to check out guest')
        }
      } catch (error) {
        console.error('Error checking out guest:', error)
        alert('Error checking out guest')
      }
    }
  }

  function viewInvoice(reservation: Reservation) {
    // Open invoice page in a new tab
    window.open(`/invoice/${reservation.id}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-600 p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image 
            src="/Pictures/Logo.png" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="h-8 md:h-10 w-auto" 
            style={{ width: 'auto', height: '2.5rem' }} 
            quality={80}
          />
          <div className="hidden sm:block">
            <h1 className="text-base md:text-lg font-semibold text-gray-800">Front Desk Dashboard</h1>
            <p className="text-xs md:text-sm text-gray-500">Lavender Moon Villas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <span className="text-xs md:text-sm hidden sm:inline text-gray-600">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="text-xs md:text-sm text-gray-500 hover:text-lavender-deep transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
            Logout
          </button>
        </div>
      </header>

      <div className="flex relative" style={{ height: 'calc(100vh - 72px)' }}>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white border-r h-full md:h-auto md:min-h-[calc(100vh-72px)] p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto
        `}>
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'reservations', label: 'Reservations' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'rooms', label: 'Rooms' },
              { id: 'images', label: 'Images' },
              { id: 'checkin', label: 'Check In/Out' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === item.id 
                    ? 'bg-lavender-deep text-white' 
                    : 'hover:bg-lavender-pale text-gray-700'
                }`}
              >
                {item.id === 'overview' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {item.id === 'reservations' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )}
                {item.id === 'calendar' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {item.id === 'rooms' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {item.id === 'images' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {item.id === 'checkin' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="mt-8 pt-8 border-t">
            <Link href="/" className="text-sm text-lavender-medium hover:text-lavender-deep flex items-center gap-2">
              ← Back to Website
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-deep"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-lavender-deep mb-4 md:mb-6">Today&apos;s Overview</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Arrivals Today</p>
                      <p className="text-3xl font-semibold text-lavender-deep mt-2">{todayArrivals.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Departures Today</p>
                      <p className="text-3xl font-semibold text-lavender-deep mt-2">{todayDepartures.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Rooms Occupied</p>
                      <p className="text-3xl font-semibold text-lavender-deep mt-2">{occupiedRooms}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Rooms Available</p>
                      <p className="text-3xl font-semibold text-green-600 mt-2">{availableRooms}</p>
                    </div>
                  </div>

                  {/* Today's Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="font-semibold text-gray-800 mb-4">Today&apos;s Arrivals</h3>
                      {todayArrivals.length === 0 ? (
                        <p className="text-gray-500 text-sm">No arrivals today</p>
                      ) : (
                        <ul className="space-y-3">
                          {todayArrivals.map(r => (
                            <li key={r.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div>
                                <p className="font-medium">{r.guest_name}</p>
                                <p className="text-sm text-gray-500">{r.room_name}</p>
                              </div>
                              <button
                                onClick={() => handleCheckIn(r.id)}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Check In
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="font-semibold text-gray-800 mb-4">Today&apos;s Departures</h3>
                      {todayDepartures.length === 0 ? (
                        <p className="text-gray-500 text-sm">No departures today</p>
                      ) : (
                        <ul className="space-y-3">
                          {todayDepartures.map(r => (
                            <li key={r.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                              <div>
                                <p className="font-medium">{r.guest_name}</p>
                                <p className="text-sm text-gray-500">{r.room_name}</p>
                              </div>
                              <button
                                onClick={() => handleCheckOut(r.id)}
                                className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                              >
                                Check Out
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-serif text-lavender-deep">Reservations</h2>
                    <button 
                      onClick={openNewReservation}
                      className="px-4 py-2 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors text-sm md:text-base w-full sm:w-auto"
                    >
                      + New Reservation
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reservations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 md:px-6 py-8 text-center text-gray-500">
                                No reservations yet
                              </td>
                            </tr>
                          ) : (
                            reservations.map(r => (
                              <tr 
                                key={r.id} 
                                onClick={() => openEditReservation(r.id)}
                                className="hover:bg-lavender-pale/50 cursor-pointer transition-colors group"
                              >
                                <td className="px-4 md:px-6 py-4">
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm group-hover:text-lavender-deep transition-colors">{r.guest_name}</p>
                                    <p className="text-xs md:text-sm text-gray-500">{r.guest_email}</p>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{r.room_number}</td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">
                                  {formatTimestampForDisplay(r.created_at)}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{formatDateForDisplay(r.check_in)}</td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{formatDateForDisplay(r.check_out)}</td>
                                <td className="px-4 md:px-6 py-4">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    r.status === 'deposit_paid' ? 'bg-yellow-100 text-yellow-700' :
                                    r.status === 'paid_in_full' ? 'bg-green-100 text-green-700' :
                                    r.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                                    r.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                                    r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {r.status === 'deposit_paid' ? 'Deposit Paid' :
                                     r.status === 'paid_in_full' ? 'Paid in Full' :
                                     r.status === 'checked_in' ? 'Checked In' :
                                     r.status === 'checked_out' ? 'Checked Out' :
                                     r.status === 'cancelled' ? 'Cancelled' :
                                     'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 md:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="relative">
                                    <button
                                      onClick={() => setOpenActionMenu(openActionMenu === r.id ? null : r.id)}
                                      className="px-3 py-1.5 bg-lavender-pale text-lavender-deep hover:bg-lavender-light rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                    >
                                      Actions
                                      <svg className={`w-4 h-4 transition-transform ${openActionMenu === r.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  
                                  {openActionMenu === r.id && (
                                    <>
                                      {/* Backdrop to close menu when clicking outside */}
                                      <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setOpenActionMenu(null)}
                                      />
                                      
                                      {/* Dropdown menu */}
                                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        {(r.status === 'deposit_paid' || r.status === 'paid_in_full' || r.status === 'pending') && (
                                          <button
                                            onClick={() => { handleCheckIn(r.id); setOpenActionMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Check In
                                          </button>
                                        )}
                                        {r.status === 'checked_in' && (
                                          <button
                                            onClick={() => { handleCheckOut(r.id); setOpenActionMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Check Out
                                          </button>
                                        )}
                                        <button
                                          onClick={() => { viewInvoice(r); setOpenActionMenu(null); }}
                                          className="w-full px-4 py-2 text-left text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          View Invoice
                                        </button>
                                        <button
                                          onClick={() => { window.open(`/check-in-form/${r.id}`, '_blank'); setOpenActionMenu(null); }}
                                          className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                          </svg>
                                          Print Form
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                          onClick={() => { openChangeStatusModal(r); }}
                                          className="w-full px-4 py-2 text-left text-sm text-lavender-deep hover:bg-lavender-pale flex items-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                          Change Status
                                        </button>
                                      </div>
                                    </>
                                  )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-lavender-deep mb-4 md:mb-6">Availability Calendar</h2>
                  <AvailabilityCalendar />
                </div>
              )}

              {activeTab === 'rooms' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-lavender-deep mb-4 md:mb-6">Room Status</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {rooms.map(room => (
                      <div key={room.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Status Header */}
                        <div className={`px-5 py-3 ${
                          room.status === 'available' ? 'bg-green-500' :
                          room.status === 'occupied' ? 'bg-red-500' :
                          room.status === 'cleaning' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold text-white">{room.room_number}</h3>
                              <p className="text-sm text-white/80">{room.name}</p>
                            </div>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold uppercase">
                              {room.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Price Display */}
                          <div className="text-center py-3 bg-gray-50 rounded-lg">
                            {editingPriceRoomId === room.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 px-4">
                                  <span className="text-xl font-semibold text-gray-600">$</span>
                                  <input
                                    type="number"
                                    value={priceEditValue}
                                    onChange={(e) => setPriceEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        setEditingPriceRoomId(null)
                                        setPriceEditValue('')
                                      }
                                    }}
                                    autoFocus
                                    className="w-28 px-3 py-2 border-2 border-lavender-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-medium text-xl font-bold text-center"
                                    min="0"
                                    step="0.01"
                                  />
                                  <span className="text-sm text-gray-500">/night</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      const price = parseFloat(priceEditValue)
                                      if (!isNaN(price) && price >= 0) {
                                        handleRoomPriceChange(room.id, price)
                                      }
                                      setEditingPriceRoomId(null)
                                      setPriceEditValue('')
                                    }}
                                    className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPriceRoomId(null)
                                      setPriceEditValue('')
                                    }}
                                    className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-3xl font-bold text-lavender-deep">${room.price_per_night}</p>
                                <p className="text-sm text-gray-500">per night</p>
                              </>
                            )}
                          </div>

                          {/* Update Status */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Update Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleRoomStatusChange(room.id, 'available')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  room.status === 'available'
                                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                }`}
                              >
                                Available
                              </button>
                              <button
                                onClick={() => handleRoomStatusChange(room.id, 'occupied')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  room.status === 'occupied'
                                    ? 'bg-red-500 text-white ring-2 ring-red-300'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                }`}
                              >
                                Occupied
                              </button>
                              <button
                                onClick={() => handleRoomStatusChange(room.id, 'cleaning')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  room.status === 'cleaning'
                                    ? 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                                }`}
                              >
                                Cleaning
                              </button>
                              <button
                                onClick={() => handleRoomStatusChange(room.id, 'maintenance')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  room.status === 'maintenance'
                                    ? 'bg-gray-500 text-white ring-2 ring-gray-300'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                Maintenance
                              </button>
                            </div>
                          </div>

                          {/* Update Price Button */}
                          <button
                            onClick={() => {
                              setEditingPriceRoomId(room.id)
                              setPriceEditValue(room.price_per_night.toString())
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-lavender-pale text-lavender-deep rounded-lg hover:bg-lavender-medium hover:text-white transition-all font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update Price
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <ImagesPage />
              )}

              {activeTab === 'checkin' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-lavender-deep mb-4 md:mb-6">Check In / Check Out</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="font-semibold text-gray-800 mb-4">Pending Check-Ins</h3>
                      {pendingCheckIns.length === 0 ? (
                        <p className="text-gray-500 text-sm">No pending check-ins</p>
                      ) : (
                        <ul className="space-y-3">
                          {pendingCheckIns.map(r => {
                            const checkInDate = normalizeDate(r.check_in)
                            const isPastDue = checkInDate < today
                            return (
                              <li key={r.id} className={`p-4 rounded-lg border ${isPastDue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">{r.guest_name}</p>
                                      {isPastDue && (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                          Past Due
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{r.room_number} - {r.room_name}</p>
                                    <p className={`text-xs mt-1 ${isPastDue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                      Check-in: {new Date(r.check_in).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleQuickCheckIn(r.id)}
                                    className="px-3 py-1 bg-lavender-deep text-white text-sm rounded hover:bg-lavender-medium transition-colors"
                                  >
                                    Check In
                                  </button>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="font-semibold text-gray-800 mb-4">Pending Check-Outs</h3>
                      {pendingCheckOuts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No pending check-outs</p>
                      ) : (
                        <ul className="space-y-3">
                          {pendingCheckOuts.map(r => (
                            <li key={r.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{r.guest_name}</p>
                                  <p className="text-sm text-gray-600">{r.room_number} - {r.room_name}</p>
                                  <p className="text-xs text-gray-500 mt-1">Check-out: {new Date(r.check_out).toLocaleDateString()}</p>
                                </div>
                                <button
                                  onClick={() => handleQuickCheckOut(r.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                >
                                  Check Out
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-serif text-lavender-deep">
                {editingReservation ? 'Edit Reservation' : 'New Reservation'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ReservationForm
                reservationId={editingReservation || undefined}
                onSuccess={handleReservationSuccess}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {changingStatusReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-serif text-lavender-deep">Change Reservation Status</h2>
              <button
                onClick={closeChangeStatusModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-lavender-pale border border-lavender-medium rounded-lg p-4">
                <p className="font-medium text-lavender-deep mb-1">Reservation Details</p>
                <p className="text-sm text-gray-700">
                  <strong>Guest:</strong> {changingStatusReservation.guest_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Room:</strong> {changingStatusReservation.room_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Check-in:</strong> {formatDateForDisplay(changingStatusReservation.check_in)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Check-out:</strong> {formatDateForDisplay(changingStatusReservation.check_out)}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Current Status:</strong>{' '}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    changingStatusReservation.status === 'deposit_paid' ? 'bg-yellow-100 text-yellow-700' :
                    changingStatusReservation.status === 'paid_in_full' ? 'bg-green-100 text-green-700' :
                    changingStatusReservation.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                    changingStatusReservation.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                    changingStatusReservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {changingStatusReservation.status === 'deposit_paid' ? 'Deposit Paid' :
                     changingStatusReservation.status === 'paid_in_full' ? 'Paid in Full' :
                     changingStatusReservation.status === 'checked_in' ? 'Checked In' :
                     changingStatusReservation.status === 'checked_out' ? 'Checked Out' :
                     changingStatusReservation.status === 'cancelled' ? 'Cancelled' :
                     'Pending'}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="paid_in_full">Paid in Full</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {newStatus === 'cancelled' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={statusChangeCancellationReason}
                      onChange={(e) => setStatusChangeCancellationReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="Refund Applied">Refund Applied</option>
                      <option value="Non-Refundable">Non-Refundable</option>
                      <option value="Partial Refund Issued">Partial Refund Issued</option>
                      <option value="No Payment Received">No Payment Received</option>
                      <option value="Guest No-Show">Guest No-Show</option>
                      <option value="Guest Request">Guest Request</option>
                      <option value="Hotel Cancellation">Hotel Cancellation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={statusChangeCancellationNotes}
                      onChange={(e) => setStatusChangeCancellationNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                      placeholder="Add any additional notes about the cancellation..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleStatusChange}
                  disabled={!newStatus || newStatus === changingStatusReservation.status || (newStatus === 'cancelled' && !statusChangeCancellationReason)}
                  className="flex-1 px-4 py-2 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {newStatus === 'cancelled' ? 'Cancel Reservation' : 'Update Status'}
                </button>
                <button
                  onClick={closeChangeStatusModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && cancellingReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-serif text-lavender-deep">Cancel Reservation</h2>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-1">Reservation Details</p>
                <p className="text-sm text-red-700">
                  <strong>Guest:</strong> {cancellingReservation.guest_name}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Room:</strong> {cancellingReservation.room_name}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Check-in:</strong> {formatDateForDisplay(cancellingReservation.check_in)}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Check-out:</strong> {formatDateForDisplay(cancellingReservation.check_out)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Refund Applied">Refund Applied</option>
                  <option value="Non-Refundable">Non-Refundable</option>
                  <option value="Partial Refund Issued">Partial Refund Issued</option>
                  <option value="No Payment Received">No Payment Received</option>
                  <option value="Guest No-Show">Guest No-Show</option>
                  <option value="Guest Request">Guest Request</option>
                  <option value="Hotel Cancellation">Hotel Cancellation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={cancellationNotes}
                  onChange={(e) => setCancellationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-medium focus:border-transparent"
                  placeholder="Add any additional notes about the cancellation..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelReservation}
                  disabled={!cancellationReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
