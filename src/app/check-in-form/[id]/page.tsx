'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface ReservationData {
  id: number
  reservation_id: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  guest_address?: string
  room_name: string
  room_number: string
  check_in: string
  check_out: string
  num_guests: number
  total_price: number | string
  status: string
}

export default function CheckInFormPage() {
  const params = useParams()
  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${params.id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch reservation')
        }
        const data = await res.json()
        setReservation(data)
      } catch (err) {
        console.error('Error fetching reservation:', err)
        setError('Failed to load reservation details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReservation()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-deep"></div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Reservation not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="text-lavender-deep hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Form
        </button>
      </div>

      {/* Printable Form */}
      <div className="min-h-screen bg-white p-8 print:p-0">
        <div className="max-w-3xl mx-auto">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/Pictures/Logo.png"
                alt="Lavender Moon Villas"
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#7C6BA0] mb-1">Lavender Moon Villas</h1>
            <h2 className="text-xl font-semibold text-gray-700">Guest Check-In &amp; Acknowledgment Form</h2>
          </div>

          {/* Guest Information Table */}
          <table className="w-full border-collapse border border-gray-400 mb-6">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium w-1/4">Guest Full Name:</td>
                <td className="border border-gray-400 px-4 py-3" colSpan={3}>{reservation.guest_name}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Home Address:</td>
                <td className="border border-gray-400 px-4 py-3" colSpan={3}>{reservation.guest_address || ''}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Phone Number:</td>
                <td className="border border-gray-400 px-4 py-3">{reservation.guest_phone || ''}</td>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium w-1/6">Email:</td>
                <td className="border border-gray-400 px-4 py-3">{reservation.guest_email}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Check-In Date:</td>
                <td className="border border-gray-400 px-4 py-3">{formatDate(reservation.check_in)}</td>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Check-Out Date:</td>
                <td className="border border-gray-400 px-4 py-3">{formatDate(reservation.check_out)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Room:</td>
                <td className="border border-gray-400 px-4 py-3">{reservation.room_number} - {reservation.room_name}</td>
                <td className="border border-gray-400 px-4 py-3 bg-gray-50 font-medium">Reservation #:</td>
                <td className="border border-gray-400 px-4 py-3">{reservation.reservation_id || `#${reservation.id}`}</td>
              </tr>
            </tbody>
          </table>

          {/* Check-in/Check-out Times */}
          <div className="mb-6 text-sm">
            <p className="mb-1"><strong>Check-In Time:</strong> Between 3:00 PM and 9:00 PM</p>
            <p><strong>Check-Out Time:</strong> 11:00 AM</p>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4 text-sm text-gray-700 mb-8">
            <p>The guest acknowledges liability for all services rendered until full settlement of bills.</p>
            
            <p>Guests will be held responsible for any loss or damage to rooms or property caused by themselves, their guests, or any person for whom they are responsible.</p>
            
            <p>Hotel Management is not responsible for personal belongings or valuables left in guest rooms.</p>
            
            <p>Complimentary safe deposit boxes are available in rooms, subject to terms and conditions.</p>
            
            <p>Regardless of charge instructions, I acknowledge that I am personally liable for payment of all charges incurred during my stay.</p>
            
            <p>Lavender Moon Villas is a <strong>non-smoking</strong> property. No outside alcohol is permitted. Lavender Moon Villas is a <strong>family-oriented, kid-friendly</strong> property and guest behavior must reflect this standard.</p>
            
            <p>I acknowledge the use of video surveillance and security personnel on the property.</p>
          </div>

          {/* Signature Section */}
          <div className="mt-12 flex justify-between items-end">
            <div className="flex-1">
              <p className="mb-2 font-medium">Guest Signature:</p>
              <div className="border-b-2 border-gray-400 w-full max-w-xs"></div>
            </div>
            <div className="flex-1 text-right">
              <p className="mb-2 font-medium">Date:</p>
              <div className="border-b-2 border-gray-400 w-40 ml-auto"></div>
            </div>
          </div>

          {/* Footer - For internal use */}
          <div className="mt-16 pt-6 border-t border-gray-300 text-xs text-gray-500 print:mt-8">
            <p className="text-center">Lavender Moon Villas • Discovery Bay, Jamaica • reservations@lavendermoon.net</p>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          @page {
            size: letter;
            margin: 0.75in;
          }
        }
      `}</style>
    </>
  )
}

