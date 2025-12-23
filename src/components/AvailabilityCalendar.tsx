'use client'

import { useState, useEffect } from 'react'

type Reservation = {
  id: number
  room_id: number
  check_in: string
  check_out: string
  status: string
}

type Room = {
  id: number
  room_number: string
  name: string
}

type AvailabilityCalendarProps = {
  month?: number
  year?: number
  onDateSelect?: (date: Date) => void
}

export default function AvailabilityCalendar({ 
  month = new Date().getMonth(), 
  year = new Date().getFullYear(),
  onDateSelect 
}: AvailabilityCalendarProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentMonth, setCurrentMonth] = useState(month)
  const [currentYear, setCurrentYear] = useState(year)

  useEffect(() => {
    let cancelled = false
    
    async function loadData() {
      try {
        const [resRes, roomsRes] = await Promise.all([
          fetch('/api/reservations'),
          fetch('/api/rooms')
        ])
        
        if (cancelled) return
        
        const reservationData = resRes.ok ? await resRes.json() : []
        const roomData = roomsRes.ok ? await roomsRes.json() : []
        
        if (!cancelled) {
          setReservations(reservationData)
          setRooms(roomData)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching data:', error)
          setReservations([])
          setRooms([])
        }
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [currentMonth, currentYear])

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
        const data = await resRes.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  function getDaysInMonth() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i))
    }
    
    return days
  }

  function getRoomStatusForDate(roomId: number, date: Date): 'available' | 'occupied' | 'checkin' | 'checkout' {
    const dateStr = date.toISOString().split('T')[0]
    
    // Find all relevant reservations for this room
    const roomReservations = reservations.filter(r => {
      return r.room_id === roomId && 
        r.status !== 'cancelled' && 
        r.status !== 'checked_out'
    })

    // Check for check-out dates first (guests leaving)
    const checkoutReservation = roomReservations.find(r => {
      const checkOut = r.check_out.split('T')[0]
      return dateStr === checkOut
    })
    if (checkoutReservation) return 'checkout'

    // Check for check-in dates
    const checkinReservation = roomReservations.find(r => {
      const checkIn = r.check_in.split('T')[0]
      return dateStr === checkIn
    })
    if (checkinReservation) return 'checkin'

    // Check if date is within any reservation period
    const occupiedReservation = roomReservations.find(r => {
      const checkIn = r.check_in.split('T')[0]
      const checkOut = r.check_out.split('T')[0]
      return dateStr > checkIn && dateStr < checkOut
    })
    if (occupiedReservation) return 'occupied'

    return 'available'
  }

  function previousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth()

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-serif text-lavender-deep">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm md:text-base"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm md:text-base"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-gray-500 sticky left-0 bg-white z-10">Room</th>
              {dayNames.map(day => (
                <th key={day} className="p-1 md:p-2 text-center text-xs font-medium text-gray-500 w-8 md:w-12">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-t">
                <td className="p-2 text-xs md:text-sm font-medium sticky left-0 bg-white z-10">{room.room_number}</td>
                {days.map((date, idx) => {
                  if (!date) return <td key={idx} className="p-0.5 md:p-1"></td>
                  
                  const status = getRoomStatusForDate(room.id, date)
                  const today = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0]
                  
                  return (
                    <td
                      key={idx}
                      className={`p-0.5 md:p-1 text-center text-[10px] md:text-xs cursor-pointer ${
                        today ? 'ring-1 md:ring-2 ring-lavender-deep' : ''
                      }`}
                      onClick={() => onDateSelect && onDateSelect(date)}
                    >
                      <div className={`rounded ${
                        status === 'available' ? 'bg-green-100 text-green-700' :
                        status === 'occupied' ? 'bg-red-100 text-red-700' :
                        status === 'checkin' ? 'bg-blue-100 text-blue-700' :
                        status === 'checkout' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {date.getDate()}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 md:mt-6 flex flex-wrap gap-3 md:gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-100 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-red-100 rounded"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-100 rounded"></div>
          <span>Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-100 rounded"></div>
          <span>Check-out</span>
        </div>
      </div>
    </div>
  )
}

