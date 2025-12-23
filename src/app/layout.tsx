import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lavender Moon Villas | Tranquil Luxury Retreat',
  description: 'Experience tranquility at Lavender Moon Villas in Ocho Rios, Jamaica',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-moon-cream text-gray-800">
        {children}
      </body>
    </html>
  )
}



