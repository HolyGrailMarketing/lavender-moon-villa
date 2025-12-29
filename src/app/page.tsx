import Link from 'next/link'
import Image from 'next/image'
import HeroSlideshow from '@/components/HeroSlideshow'
import ImageGallery from '@/components/ImageGallery'

// Force dynamic rendering to ensure proper deployment on Vercel
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main>
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center bg-black/20 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Image 
            src="/Pictures/Logo.png" 
            alt="Lavender Moon Villas" 
            width={60} 
            height={60} 
            className="h-12 md:h-14 w-auto" 
            style={{ width: 'auto' }} 
            priority
            quality={80}
          />
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex gap-10 list-none">
            {['About', 'Gallery', 'Rooms', 'Contact'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="text-white text-sm font-normal tracking-widest uppercase hover:text-moon-gold transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/book" className="px-6 py-2 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-lavender-deep transition-all">
            Book Now
          </Link>
        </div>
        {/* Mobile Menu Button */}
        <Link href="/book" className="md:hidden px-4 py-2 bg-lavender-deep text-white text-xs tracking-widest uppercase rounded">
          Book Now
        </Link>
      </nav>

      {/* Hero Section with Slideshow */}
      <section className="h-screen relative">
        <HeroSlideshow />
        {/* Book Now CTA */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <Link href="/book" className="inline-block px-10 md:px-12 py-3 md:py-4 bg-lavender-deep text-white text-sm tracking-widest uppercase hover:bg-lavender-medium transition-all rounded shadow-lg hover:shadow-xl">
            Reserve Your Escape
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-8 bg-moon-cream">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded overflow-hidden">
              <Image 
                src="/Pictures/Environment/Lavender%20Moon%20Environment%20(27).JPG" 
                alt="Sunset view from Lavender Moon Villas" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-3/5 h-3/5 border border-moon-gold rounded -z-10" />
          </div>
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-lavender-medium mb-4">Our Story</p>
            <h2 className="text-4xl font-serif text-lavender-deep mb-8 leading-tight">A Sanctuary of Serenity Nestled in Nature&apos;s Embrace</h2>
            <p className="text-gray-600 mb-4 font-light">Lavender Moon Villas is more than just a destination—it&apos;s an experience crafted for those who seek respite from the ordinary. Located in the beautiful hills of Ocho Rios, Jamaica, our boutique retreat offers an intimate escape where every detail speaks to refined comfort.</p>
            <p className="text-gray-600 font-light">Whether you&apos;re celebrating a special occasion, seeking a romantic getaway, or simply need to reconnect with peace, our villa welcomes you with open arms and warm hospitality.</p>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section id="gallery" className="py-24 px-4 md:px-8 bg-gray-50">
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-lavender-medium mb-4">Explore Our Villa</p>
          <h2 className="text-4xl font-serif text-lavender-deep">Photo Gallery</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Take a visual journey through our beautiful rooms and spaces</p>
        </div>
        <div className="max-w-6xl mx-auto">
          <ImageGallery />
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-24 px-4 md:px-8 bg-gradient-to-b from-lavender-pale to-moon-cream">
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-lavender-medium mb-4">The Experience</p>
          <h2 className="text-4xl font-serif text-lavender-deep">Curated Comforts Await</h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Mountain Views', 
              desc: 'Wake up to stunning panoramic views of the Jamaican mountains',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94" />
                </svg>
              )
            },
            { 
              title: 'Private Terraces', 
              desc: 'Each room features its own outdoor space to enjoy the tropical breeze',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              )
            },
            { 
              title: 'Local Cuisine', 
              desc: 'Savor authentic Jamaican flavors prepared with love',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            { 
              title: 'WiFi & AC', 
              desc: 'Stay connected and comfortable with modern amenities',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
              )
            },
            { 
              title: 'Concierge Service', 
              desc: 'Let us arrange tours, transportation, and local experiences',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              )
            },
            { 
              title: 'Peaceful Setting', 
              desc: 'Escape the crowds in our tranquil hillside location',
              icon: (
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )
            },
          ].map((amenity, i) => (
            <div key={i} className="bg-white p-8 rounded-lg text-center shadow-md hover:shadow-xl hover:-translate-y-2 transition-all">
              <div className="text-lavender-medium mb-4 flex items-center justify-center">{amenity.icon}</div>
              <h3 className="text-xl font-serif text-lavender-deep mb-3">{amenity.title}</h3>
              <p className="text-gray-600 text-sm font-light">{amenity.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-24 px-4 md:px-8 bg-white">
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-lavender-medium mb-4">Accommodations</p>
          <h2 className="text-4xl font-serif text-gray-800">Rest in Refined Elegance</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Choose from our selection of beautifully appointed suites and rooms</p>
        </div>
        
        {/* Featured Suites */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-2xl font-serif text-lavender-deep mb-8 text-center">Premium Suites</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Victoria Suite', desc: 'Premium • Exceptional Luxury', price: '$480/night', img: '/Pictures/206-A/Lavender%20Moon%20206%20A%20(1).JPG', features: ['King Bed', 'Living Area', 'Mountain View'] },
              { name: 'Alexander Suite', desc: 'Luxurious • Stunning Views', price: '$280/night', img: '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG', features: ['Queen Bed', 'Balcony', 'AC'] },
              { name: 'Renee Suite', desc: 'Elegant • Comfort & Style', price: '$280/night', img: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG', features: ['Queen Bed', 'Private Bath', 'WiFi'] },
            ].map((room, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group shadow-xl">
                <Image 
                  src={room.img} 
                  alt={room.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={70}
                  loading={i === 0 ? "eager" : "lazy"}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 right-4 bg-moon-gold text-white px-3 py-1 rounded-full text-xs font-medium">
                  SUITE
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-serif mb-2">{room.name}</h3>
                  <p className="text-gray-300 text-sm mb-2">{room.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {room.features.map((f, j) => (
                      <span key={j} className="text-xs bg-white/20 px-2 py-1 rounded">{f}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moon-gold font-semibold text-lg">From {room.price}</span>
                    <Link href="/book" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">
                      Book Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standard Rooms */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-serif text-lavender-deep mb-8 text-center">Rooms</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'Room 108-JA', price: '$225/night', img: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(1).JPG' },
              { name: 'Room 109-LS', price: '$220/night', img: '/Pictures/Room%20206-B/Lavender%20Moon%20206B%20(1).JPG' },
              { name: 'Room 209-JF', price: '$220/night', img: '/Pictures/207-A/Lavender%20Moon%20207%20A%20(2).JPG' },
              { name: 'Room 208AB', price: '$280/night', img: '/Pictures/206-A/Lavender%20Moon%20206%20A%20(2).JPG' },
              { name: 'Room 208A', price: '$190/night', img: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(2).JPG' },
              { name: 'Room 106-JW', price: '$325/night', img: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(3).JPG' },
              { name: 'Room 107-CF', price: '$260/night', img: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG' },
              { name: 'Room 207-A', price: '$180/night', img: '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG' },
            ].map((room, i) => (
              <div key={i} className="relative aspect-[4/5] rounded-lg overflow-hidden group shadow-lg hover:shadow-xl transition-shadow">
                <Image 
                  src={room.img} 
                  alt={room.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  quality={70}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                  <h3 className="text-base md:text-lg font-serif mb-1">{room.name}</h3>
                  <span className="text-moon-gold font-medium text-sm">From {room.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Link href="/book" className="inline-block px-10 md:px-12 py-4 bg-lavender-deep text-white text-sm tracking-widest uppercase hover:bg-lavender-medium transition-all rounded-sm shadow-lg hover:shadow-xl">
            View All Rooms & Book
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 md:px-8 bg-moon-cream">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-serif text-lavender-deep mb-6">Begin Your Journey to Tranquility</h2>
            <p className="text-gray-600 font-light mb-8">We&apos;d love to hear from you. Whether you&apos;re ready to book your stay or simply have questions, our team is here to help craft your perfect escape.</p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-lavender-pale rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-lavender-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-lavender-medium mb-1">Location</h4>
                  <p>Breadnut Hill, Ocho Rios<br />St. Ann Parish, Jamaica</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-lavender-pale rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-lavender-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-lavender-medium mb-1">Phone</h4>
                  <p><a href="tel:+18765161421" className="hover:text-lavender-deep">+1 (876) 516-1421</a></p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-lavender-pale rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-lavender-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 01.253-2.96l1.753-4.398a4.25 4.25 0 00-.9-3.996 4.25 4.25 0 00-3.996-.9L2.348 8.91a4.48 4.48 0 01-.253-2.96 5.969 5.969 0 01.474-.065A5.972 5.972 0 015.41 3.03c1.281-.22 2.64-.28 4.09 0C13.97 3.75 18 7.444 18 12z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-lavender-medium mb-1">WhatsApp</h4>
                  <p><a href="https://wa.me/18765068440" target="_blank" rel="noopener noreferrer" className="hover:text-lavender-deep">+1 (876) 506-8440</a></p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-lavender-pale rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-lavender-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-lavender-medium mb-1">Email</h4>
                  <p><a href="mailto:reservations@lavendermoon.net" className="hover:text-lavender-deep">reservations@lavendermoon.net</a></p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-8 rounded-lg overflow-hidden shadow-lg">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3786.184824812292!2d-77.0878281!3d18.3844375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8edafd4e1f19952b%3A0x7ea4b381cebff127!2sLavender%20Moon%20Villas!5e0!3m2!1sen!2sjm!4v1766428924965!5m2!1sen!2sjm"
                className="w-full h-48"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-serif text-lavender-deep mb-6">Request Information</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">First Name</label>
                  <input type="text" className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Last Name</label>
                  <input type="text" className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Email</label>
                <input type="email" className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Check-in</label>
                  <input type="date" className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Check-out</label>
                  <input type="date" className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Message</label>
                <textarea rows={4} className="w-full p-3 border border-lavender-pale rounded focus:border-lavender-medium focus:outline-none resize-none" placeholder="Tell us about your ideal stay..." />
              </div>
              <button type="submit" className="w-full py-4 bg-lavender-deep text-white text-sm tracking-widest uppercase rounded hover:bg-lavender-medium transition-colors">
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-lavender-pale text-center">
        <div className="mb-4">
          <Image 
            src="/Pictures/Logo.png" 
            alt="Lavender Moon Villas" 
            width={100} 
            height={100} 
            className="mx-auto h-24 w-auto" 
            style={{ width: 'auto', height: '6rem' }} 
            quality={80}
          />
        </div>
        <p className="font-serif italic text-gray-600 mb-6">Where dreams rest beneath the lavender sky</p>
        <p className="text-sm text-gray-500">© 2025 Lavender Moon Villas. All rights reserved.</p>
      </footer>
    </main>
  )
}


