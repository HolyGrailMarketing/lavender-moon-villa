import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-serif text-lg mb-4">Lavender Moon Villas</h3>
            <p className="text-sm mb-1">
              Breadnut Hill, Ocho Rios
            </p>
            <p className="text-sm mb-4">
              St. Ann Parish, Jamaica
            </p>
            <p className="text-sm">
              <a href="mailto:reservations@lavendermoon.net" className="hover:text-moon-gold transition-colors">
                reservations@lavendermoon.net
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-serif text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-moon-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-moon-gold transition-colors">
                  Book Now
                </Link>
              </li>
              <li>
                <Link href="/my-reservation" className="hover:text-moon-gold transition-colors">
                  My Reservation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div>
            <h3 className="text-white font-serif text-lg mb-4">Legal & Privacy</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-moon-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/my-data/access" className="hover:text-moon-gold transition-colors">
                  Access My Data
                </Link>
              </li>
              <li>
                <Link href="/my-data/correction" className="hover:text-moon-gold transition-colors">
                  Update My Data
                </Link>
              </li>
              <li>
                <a href="mailto:privacy@lavendermoon.net" className="hover:text-moon-gold transition-colors">
                  Data Protection
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Lavender Moon Villas. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Powered by{' '}
            <a 
              href="https://holygrailmarketinggroup.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-moon-gold transition-colors"
            >
              Holy Grail Studios
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

