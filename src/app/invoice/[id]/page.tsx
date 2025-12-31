'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface InvoiceData {
  id: number
  reservation_id: string
  check_in: string
  check_out: string
  num_guests: number
  total_price: number
  amount_paid: number
  service_charge: number
  additional_items: Array<{ description: string; amount: number }>
  room_name: string
  room_number: string
  guest_name: string
  guest_email: string
  source: string
}

export default function InvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net'

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/reservations/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setInvoice(data)
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Invoice not found</p>
      </div>
    )
  }

  const checkInDate = new Date(invoice.check_in).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const checkOutDate = new Date(invoice.check_out).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const nights = Math.ceil(
    (new Date(invoice.check_out).getTime() - new Date(invoice.check_in).getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  const serviceCharge = invoice.service_charge || 0
  const additionalItems = invoice.additional_items || []
  const subtotal = invoice.total_price - serviceCharge - additionalItems.reduce((sum, item) => sum + item.amount, 0)
  const amountPaid = invoice.amount_paid || 0
  const outstandingBalance = invoice.total_price - amountPaid

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="text-center border-b-2 border-lavender-deep pb-6 mb-6">
          <div className="flex justify-center mb-4">
            <Image 
              src="/Pictures/Logo.png" 
              alt="Lavender Moon Villas" 
              width={150} 
              height={150}
              className="h-auto"
              style={{ width: 'auto', height: '150px' }}
              quality={90}
            />
          </div>
          <h1 className="text-3xl font-serif text-lavender-deep mb-2">Lavender Moon Villas</h1>
          <p className="text-gray-600 italic mb-4">Where tranquility meets luxury</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📧 <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a></p>
            <p>📱 WhatsApp: <a href="https://wa.me/18765068440" className="text-lavender-deep hover:underline">+1 (876) 506-8440</a></p>
            <p>🌐 <a href={baseUrl} className="text-lavender-deep hover:underline">{baseUrl}</a></p>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Invoice</h2>
          <p className="text-gray-600 mt-1">Reservation Confirmation</p>
        </div>

        {/* Reservation Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Reservation Information</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Reservation ID:</td>
                  <td className="py-2">
                    <a href={`${baseUrl}/reservations/${invoice.id}`} className="text-lavender-deep hover:underline font-semibold">
                      {invoice.reservation_id || `#${invoice.id}`}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Room:</td>
                  <td className="py-2">{invoice.room_name} ({invoice.room_number})</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Check-in:</td>
                  <td className="py-2">{checkInDate} at 3:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Check-out:</td>
                  <td className="py-2">{checkOutDate} by 11:00 AM</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Nights:</td>
                  <td className="py-2">{nights}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Guests:</td>
                  <td className="py-2">{invoice.num_guests}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Guest Information</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Guest Name:</td>
                  <td className="py-2">{invoice.guest_name}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Email:</td>
                  <td className="py-2">{invoice.guest_email}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-600">Source:</td>
                  <td className="py-2 capitalize">{invoice.source?.replace('_', ' ') || 'Direct'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 border-b-2 border-lavender-deep pb-2">Payment Summary</h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-2 text-right pr-4">Subtotal:</td>
                <td className="py-2 text-right font-semibold w-32">${subtotal.toFixed(2)}</td>
              </tr>
              {serviceCharge > 0 && (
                <tr>
                  <td className="py-2 text-right pr-4">Service Charge (15%):</td>
                  <td className="py-2 text-right w-32">${serviceCharge.toFixed(2)}</td>
                </tr>
              )}
              {additionalItems.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 text-right pr-4">{item.description}:</td>
                  <td className="py-2 text-right w-32">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-lavender-deep">
                <td className="py-3 text-right pr-4 font-bold text-lg">Total Amount:</td>
                <td className="py-3 text-right font-bold text-lg text-lavender-deep w-32">${invoice.total_price.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2 text-right pr-4 text-gray-600">Amount Paid:</td>
                <td className="py-2 text-right text-gray-600 w-32">${amountPaid.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="py-3 text-right pr-4 font-bold">Outstanding Balance:</td>
                <td className={`py-3 text-right font-bold w-32 ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${outstandingBalance.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disclaimers */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded text-sm">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Notice:</h4>
          <div className="text-yellow-700 space-y-2 text-xs">
            <p><strong>Payment Policy:</strong> Reservations require payment equal to 1 night stay for all room reservations to be considered confirmed. Payment is refundable, less any deposit or transfer fees, if reservation is cancelled 7 days before check-in. Cancellations less than 7 days are subject to cancellation fees equivalent to 1 night stay. NON-REFUNDABLE rate bookings require full payment for reservation to be completed.</p>
            <p><strong>Security:</strong> Lavender Moon utilizes video security as well as security personnel. We request all guests adhere to all security protocols as failure to do so may result in you being asked to leave Lavender Moon premises and you may be subject to a damage fee charge.</p>
            <p><strong>Photography:</strong> Photos and Videos may be taken on Lavender Moon premises and used for promotional or referral material. If you do not wish to be photographed, kindly opt out by emailing us at <a href="mailto:nophotos@lavendermoon.net" className="underline">nophotos@lavendermoon.net</a> with your room number and name.</p>
            <p><strong>Smoking Policy:</strong> Smoking or vaping is never permitted in the rooms or surrounding areas close to the residence. A designated smoking area is available, just ask reception for that information when you check in, if needed.</p>
            <p><strong>Illegal Substances:</strong> Lavender Moon permits absolutely no illegal drugs and request all guests adhere to this rule. Failure to which may result in local authorities' involvement.</p>
            <p><strong>Service Charge & GCT:</strong> All payments are subject to service charge and GCT (General Consumption Tax).</p>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-lavender-pale p-6 rounded-lg text-center mb-6 print:hidden">
          <h3 className="text-lavender-deep font-semibold mb-2">We Appreciate Your Feedback!</h3>
          <p className="text-gray-600 mb-4">If we have exceeded your expectations, kindly leave us a favorable review:</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-lavender-deep text-white px-6 py-2 rounded-lg hover:bg-lavender-medium transition-colors"
            >
              ⭐ Review on Google
            </a>
            <a 
              href={`${baseUrl}/review`}
              className="bg-lavender-medium text-white px-6 py-2 rounded-lg hover:bg-lavender-deep transition-colors"
            >
              💬 Review on Website
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-600">Follow us on social media @lavendermoonvillas</p>
        </div>

        {/* Print Button */}
        <div className="text-center print:hidden">
          <button
            onClick={handlePrint}
            className="bg-lavender-deep text-white px-8 py-3 rounded-lg hover:bg-lavender-medium transition-colors font-semibold"
          >
            Print Invoice
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
          <p><strong>Lavender Moon Villas</strong></p>
          <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          <p className="mt-2">
            📧 <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a> | 
            📱 WhatsApp: <a href="https://wa.me/18765068440" className="text-lavender-deep hover:underline">+1 (876) 506-8440</a>
          </p>
          <p>🌐 <a href={baseUrl} className="text-lavender-deep hover:underline">{baseUrl}</a></p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:rounded-none {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  )
}

