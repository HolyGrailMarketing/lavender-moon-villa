'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getRoomBySlug, roomsData } from '@/lib/rooms-data'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const room = getRoomBySlug(slug)
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-lavender-deep mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
          <Link href="/#rooms" className="px-6 py-3 bg-lavender-deep text-white rounded-lg hover:bg-lavender-medium transition-colors">
            View All Rooms
          </Link>
        </div>
      </div>
    )
  }

  // Use first available image or a placeholder
  const displayImages = room.images.filter(img => !img.includes('placeholder'))
  const hasImages = displayImages.length > 0

  const handleBookNow = () => {
    // Navigate to booking page with room pre-selected
    const params = new URLSearchParams()
    params.set('room', room.slug)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests.toString())
    router.push(`/book?${params.toString()}`)
  }

  // Calculate nights if dates are selected
  let nights = 0
  let totalPrice = 0
  if (checkIn && checkOut) {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (nights > 0) {
      totalPrice = nights * room.price
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-moon-cream via-lavender-pale to-moon-cream">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-lavender-pale sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/Pictures/Logo.png" 
              alt="Lavender Moon Villas" 
              width={50} 
              height={50} 
              className="h-12 w-auto" 
              style={{ width: 'auto', height: '3rem' }} 
              priority
              quality={80}
            />
            <span className="text-xl font-serif text-lavender-deep hidden sm:block">Lavender Moon Villas</span>
          </Link>
          <Link 
            href="/#rooms" 
            className="text-lavender-deep hover:text-lavender-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>All Rooms</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><Link href="/" className="hover:text-lavender-deep">Home</Link></li>
            <li>/</li>
            <li><Link href="/#rooms" className="hover:text-lavender-deep">Rooms</Link></li>
            <li>/</li>
            <li className="text-lavender-deep">{room.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl bg-gray-200">
              {hasImages ? (
                <Image
                  src={displayImages[selectedImage]}
                  alt={room.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                  quality={85}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-lavender-pale">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Images coming soon</p>
                  </div>
                </div>
              )}
              {room.type === 'suite' && (
                <div className="absolute top-4 left-4 bg-moon-gold text-white px-4 py-1 rounded-full text-sm font-medium">
                  SUITE
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {hasImages && displayImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 ${
                      selectedImage === i ? 'ring-3 ring-lavender-deep' : 'opacity-70 hover:opacity-100'
                    } transition-all`}
                  >
                    <Image
                      src={img}
                      alt={`${room.name} - Image ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      quality={70}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Room Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-lavender-medium text-sm uppercase tracking-wider mb-1">{room.tagline}</p>
                  <h1 className="text-3xl md:text-4xl font-serif text-gray-800">{room.name}</h1>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-lavender-deep">${room.price}</p>
                  <p className="text-gray-500 text-sm">per night</p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">{room.description}</p>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-lavender-pale/50 rounded-lg p-4 text-center">
                  <svg className="w-6 h-6 mx-auto text-lavender-deep mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">Up to {room.maxGuests} guests</p>
                </div>
                <div className="bg-lavender-pale/50 rounded-lg p-4 text-center">
                  <svg className="w-6 h-6 mx-auto text-lavender-deep mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-sm text-gray-600">{room.size}</p>
                </div>
                <div className="bg-lavender-pale/50 rounded-lg p-4 text-center">
                  <svg className="w-6 h-6 mx-auto text-lavender-deep mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <p className="text-sm text-gray-600">{room.beds}</p>
                </div>
                <div className="bg-lavender-pale/50 rounded-lg p-4 text-center">
                  <svg className="w-6 h-6 mx-auto text-lavender-deep mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">Free WiFi</p>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-8">
                <h2 className="text-xl font-serif text-gray-800 mb-4">Highlights</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {room.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-serif text-gray-800 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, i) => (
                    <span key={i} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-serif text-gray-800 mb-6">Book This Room</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-medium"
                  >
                    {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Summary */}
              {nights > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>${room.price} × {nights} nights</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-lavender-deep">${totalPrice.toLocaleString()} JMD</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookNow}
                className="w-full py-4 bg-lavender-deep text-white rounded-lg font-semibold hover:bg-lavender-medium transition-colors"
              >
                Book Now
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Free cancellation up to 48 hours before check-in
              </p>

              {/* Contact */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Have questions?</p>
                <a 
                  href="https://wa.me/18765068440" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-lavender-deep hover:text-lavender-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Other Rooms Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">You May Also Like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {roomsData
              .filter(r => r.slug !== room.slug)
              .slice(0, 3)
              .map((otherRoom) => {
                const otherImages = otherRoom.images.filter(img => !img.includes('placeholder'))
                return (
                  <Link 
                    key={otherRoom.slug}
                    href={`/rooms/${otherRoom.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                  >
                    <div className="relative aspect-[4/3] bg-gray-200">
                      {otherImages.length > 0 ? (
                        <Image
                          src={otherImages[0]}
                          alt={otherRoom.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          quality={75}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-lavender-pale">
                          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {otherRoom.type === 'suite' && (
                        <div className="absolute top-3 left-3 bg-moon-gold text-white px-3 py-1 rounded-full text-xs">
                          SUITE
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-gray-800 mb-1">{otherRoom.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{otherRoom.tagline}</p>
                      <p className="text-lavender-deep font-semibold">From ${otherRoom.price}/night</p>
                    </div>
                  </Link>
                )
              })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 px-8 bg-lavender-pale text-center">
        <p className="text-sm text-gray-500">© 2025 Lavender Moon Villas. All rights reserved.</p>
      </footer>
    </div>
  )
}





