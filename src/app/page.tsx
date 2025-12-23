import Link from 'next/link'
import Image from 'next/image'
import Stars from '@/components/Stars'

// Force dynamic rendering to ensure proper deployment on Vercel
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main>
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-night-dark/90 backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Image src="/Pictures/Logo.png" alt="Lavender Moon Villas" width={60} height={60} className="h-14 w-auto" style={{ width: 'auto', height: '3.5rem' }} />
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex gap-10 list-none">
            {['About', 'Amenities', 'Rooms', 'Contact'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="text-moon-cream text-sm font-normal tracking-widest uppercase hover:text-moon-gold transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contact" className="px-6 py-2 border border-moon-gold text-moon-gold text-sm tracking-widest uppercase hover:bg-moon-gold hover:text-night-dark transition-all">
            Book Now
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-night-dark via-lavender-deep to-[#3d2d5a]">
        {/* Stars */}
        <Stars />
        
        {/* Moon */}
        <div className="moon absolute top-[15%] right-[15%] w-28 h-28 md:w-32 md:h-32 rounded-full" />
        
        <div className="text-center z-10 px-4">
          <p className="text-sm tracking-[0.4em] uppercase text-moon-gold mb-6 animate-fade-in">Welcome to</p>
          <h1 className="text-5xl md:text-7xl font-serif text-moon-cream tracking-wider mb-2">Lavender Moon Villas</h1>
          <p className="text-xl md:text-2xl font-serif italic text-lavender-soft mb-12">Where tranquility meets luxury under the moonlit sky</p>
          <a href="#contact" className="inline-block px-12 py-4 border border-moon-gold text-moon-gold text-sm tracking-widest uppercase hover:bg-moon-gold hover:text-night-dark transition-all">
            Reserve Your Escape
          </a>
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

      {/* Amenities Section */}
      <section id="amenities" className="py-24 px-8 bg-gradient-to-b from-lavender-pale to-moon-cream">
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-lavender-medium mb-4">The Experience</p>
          <h2 className="text-4xl font-serif text-lavender-deep">Curated Comforts Await</h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { title: 'Mountain Views', desc: 'Wake up to stunning panoramic views of the Jamaican mountains' },
            { title: 'Private Terraces', desc: 'Each room features its own outdoor space to enjoy the tropical breeze' },
            { title: 'Local Cuisine', desc: 'Savor authentic Jamaican flavors prepared with love' },
            { title: 'WiFi & AC', desc: 'Stay connected and comfortable with modern amenities' },
            { title: 'Concierge Service', desc: 'Let us arrange tours, transportation, and local experiences' },
            { title: 'Peaceful Setting', desc: 'Escape the crowds in our tranquil hillside location' },
          ].map((amenity, i) => (
            <div key={i} className="bg-white p-8 rounded-lg text-center shadow-md hover:shadow-xl hover:-translate-y-2 transition-all">
              <h3 className="text-xl font-serif text-lavender-deep mb-3">{amenity.title}</h3>
              <p className="text-gray-600 text-sm font-light">{amenity.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-24 px-8 bg-night-dark text-moon-cream">
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-moon-gold mb-4">Accommodations</p>
          <h2 className="text-4xl font-serif">Rest in Refined Elegance</h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { name: 'Room 206-B', desc: 'Cozy • Lavender Walls', price: '$120/night', img: '/Pictures/Room%20206-B/Lavender%20Moon%20206B%20(1).JPG' },
            { name: 'Room 107-CF', desc: 'Private Patio • Garden View', price: '$150/night', img: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG' },
            { name: 'Room 106-JW', desc: 'Spacious • Modern', price: '$140/night', img: '/Pictures/Environment/Lavender%20Moon%20Environment%20(27).JPG' },
          ].map((room, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
              <Image src={room.img} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-night-dark/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-serif mb-2">{room.name}</h3>
                <div className="flex gap-6 text-sm text-lavender-soft">
                  <span>{room.desc}</span>
                  <span className="text-moon-gold font-medium">From {room.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-8 bg-moon-cream">
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-lavender-medium mb-1">Email</h4>
                  <p><a href="mailto:hello@lavendermoonvilla.com" className="hover:text-lavender-deep">hello@lavendermoonvilla.com</a></p>
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
      <footer className="py-12 px-8 bg-night-dark text-moon-cream text-center">
        <div className="mb-4">
          <Image src="/Pictures/Logo.png" alt="Lavender Moon Villas" width={100} height={100} className="mx-auto h-24 w-auto" style={{ width: 'auto', height: '6rem' }} />
        </div>
        <p className="font-serif italic text-lavender-soft mb-6">Where dreams rest beneath the lavender sky</p>
        <p className="text-sm text-gray-500">© 2025 Lavender Moon Villas. All rights reserved.</p>
      </footer>
    </main>
  )
}


