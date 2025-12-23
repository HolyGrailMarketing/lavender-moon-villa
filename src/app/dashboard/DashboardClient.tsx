'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReservationForm from '@/components/ReservationForm'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'

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
    const matches = checkInDate === today && (r.status === 'confirmed' || r.status === 'pending')
    return matches
  })

  const todayDepartures = reservations.filter(r => {
    const checkOutDate = normalizeDate(r.check_out)
    const matches = checkOutDate === today && (r.status === 'checked_in' || r.status === 'confirmed')
    return matches
  })

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
  const availableRooms = rooms.filter(r => r.status === 'available').length

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

  function generateInvoice(reservation: Reservation) {
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Reservation ${reservation.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #4a3f6b; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4a3f6b; margin: 0; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section h3 { color: #4a3f6b; border-bottom: 1px solid #e8e0f0; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #e8e0f0; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e8e0f0; }
          .total { font-size: 1.2em; font-weight: bold; color: #4a3f6b; text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #4a3f6b; color: #6b5e7a; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lavender Moon Villa</h1>
          <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          <p>Phone: +1 (876) 516-1421</p>
        </div>
        
        <h2>Invoice #${reservation.id}</h2>
        
        <div class="details">
          <div class="section">
            <h3>Guest Information</h3>
            <p><strong>${reservation.guest_name}</strong></p>
            <p>${reservation.guest_email}</p>
          </div>
          <div class="section">
            <h3>Reservation Details</h3>
            <p><strong>Room:</strong> ${reservation.room_number} - ${reservation.room_name}</p>
            <p><strong>Check-in:</strong> ${new Date(reservation.check_in).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> ${new Date(reservation.check_out).toLocaleDateString()}</p>
            <p><strong>Guests:</strong> ${reservation.num_guests}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Nights</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Accommodation</td>
              <td>${Math.ceil((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / (1000 * 60 * 60 * 24))}</td>
              <td>$${(Number(reservation.total_price) / Math.ceil((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}</td>
              <td>$${Number(reservation.total_price).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          Total: $${Number(reservation.total_price).toFixed(2)}
        </div>
        
        ${reservation.special_requests ? `<div class="section"><h3>Special Requests</h3><p>${reservation.special_requests}</p></div>` : ''}
        
        <div class="footer">
          <p>Thank you for staying with us!</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `
    invoiceWindow.document.write(invoiceHTML)
    invoiceWindow.document.close()
    invoiceWindow.print()
  }

  // Use the same logic as todayArrivals/todayDepartures to avoid duplication
  const pendingCheckIns = todayArrivals
  const pendingCheckOuts = todayDepartures

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-night-dark text-moon-cream px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-moon-cream p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/Pictures/Logo.png" alt="Logo" width={40} height={40} className="h-8 md:h-10 w-auto" style={{ width: 'auto', height: '2.5rem' }} />
          <div className="hidden sm:block">
            <h1 className="text-base md:text-lg font-semibold">Front Desk Dashboard</h1>
            <p className="text-xs md:text-sm text-lavender-soft">Lavender Moon Villa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <span className="text-xs md:text-sm hidden sm:inline">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="text-xs md:text-sm text-lavender-soft hover:text-moon-gold transition-colors px-2 py-1">
            Logout
          </button>
        </div>
      </header>

      <div className="flex relative">
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
          w-64 bg-white border-r min-h-[calc(100vh-72px)] p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'reservations', label: 'Reservations', icon: '📅' },
              { id: 'calendar', label: 'Calendar', icon: '📆' },
              { id: 'rooms', label: 'Rooms', icon: '🛏️' },
              { id: 'checkin', label: 'Check In/Out', icon: '✅' },
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
                <span>{item.icon}</span>
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
        <main className="flex-1 p-4 md:p-8 w-full">
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
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reservations.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-gray-500">
                                No reservations yet
                              </td>
                            </tr>
                          ) : (
                            reservations.map(r => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 md:px-6 py-4">
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{r.guest_name}</p>
                                    <p className="text-xs md:text-sm text-gray-500">{r.guest_email}</p>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{r.room_number}</td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{new Date(r.check_in).toLocaleDateString()}</td>
                                <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{new Date(r.check_out).toLocaleDateString()}</td>
                                <td className="px-4 md:px-6 py-4">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    r.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                    r.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                                    r.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                                    r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                    <button 
                                      onClick={() => openEditReservation(r.id)}
                                      className="text-lavender-deep hover:text-lavender-medium text-xs sm:text-sm"
                                    >
                                      Edit
                                    </button>
                                    {r.status === 'confirmed' && (
                                      <button
                                        onClick={() => handleCheckIn(r.id)}
                                        className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
                                      >
                                        Check In
                                      </button>
                                    )}
                                    {r.status === 'checked_in' && (
                                      <button
                                        onClick={() => handleCheckOut(r.id)}
                                        className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm"
                                      >
                                        Check Out
                                      </button>
                                    )}
                                    <button
                                      onClick={() => generateInvoice(r)}
                                      className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm"
                                    >
                                      Invoice
                                    </button>
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
                      <div key={room.id} className={`p-6 rounded-xl border-2 ${
                        room.status === 'available' ? 'bg-green-50 border-green-200' :
                        room.status === 'occupied' ? 'bg-red-50 border-red-200' :
                        room.status === 'cleaning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{room.room_number}</h3>
                            <p className="text-sm text-gray-600">{room.name}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${
                            room.status === 'available' ? 'bg-green-200 text-green-800' :
                            room.status === 'occupied' ? 'bg-red-200 text-red-800' :
                            room.status === 'cleaning' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {room.status}
                          </span>
                        </div>
                        <p className="text-2xl font-semibold text-lavender-deep">${room.price_per_night}<span className="text-sm font-normal text-gray-500">/night</span></p>
                      </div>
                    ))}
                  </div>
                </div>
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
                          {pendingCheckIns.map(r => (
                            <li key={r.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{r.guest_name}</p>
                                  <p className="text-sm text-gray-600">{r.room_number} - {r.room_name}</p>
                                  <p className="text-xs text-gray-500 mt-1">Check-in: {new Date(r.check_in).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleCheckIn(r.id)}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                >
                                  Check In
                                </button>
                                <button
                                  onClick={() => generateInvoice(r)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                  Invoice
                                </button>
                              </div>
                            </li>
                          ))}
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
                            <li key={r.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{r.guest_name}</p>
                                  <p className="text-sm text-gray-600">{r.room_number} - {r.room_name}</p>
                                  <p className="text-xs text-gray-500 mt-1">Check-out: {new Date(r.check_out).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleCheckOut(r.id)}
                                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                                >
                                  Check Out
                                </button>
                                <button
                                  onClick={() => generateInvoice(r)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                  Invoice
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
    </div>
  )
}
