'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isBlobStorageUrl } from '@/lib/image-utils'

interface HomeRoomCardProps {
  slug: string
  name: string
  desc: string
  price: string
  features: string[]
  type?: 'suite' | 'room'
  aspect?: string
}

export default function HomeRoomCard({ slug, name, desc, price, features, type, aspect = 'aspect-[3/4]' }: HomeRoomCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFirstImage = async () => {
      try {
        const response = await fetch(`/api/rooms/${slug}/images`)
        if (response.ok) {
          const data = await response.json()
          // Use thumbnail if available, otherwise use first image
          const imageToUse = data.thumbnail || (data.images && data.images[0])
          if (imageToUse) {
            setImageUrl(imageToUse)
          }
        }
      } catch (error) {
        console.warn(`Error fetching image for ${slug}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchFirstImage()
  }, [slug])

  return (
    <Link href={`/rooms/${slug}`} className={`relative ${aspect} rounded-xl overflow-hidden group shadow-xl cursor-pointer block`}>
      {loading ? (
        <div className="absolute inset-0 bg-lavender-pale flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-deep"></div>
        </div>
      ) : imageUrl ? (
        <Image 
          src={imageUrl}
          alt={name} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-700" 
          sizes={type === 'suite' ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"}
          quality={70}
          loading="lazy"
          unoptimized={isBlobStorageUrl(imageUrl)}
        />
      ) : (
        <div className="absolute inset-0 bg-lavender-pale flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Images coming soon</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {type === 'suite' && (
        <div className="absolute top-4 right-4 bg-moon-gold text-white px-3 py-1 rounded-full text-xs font-medium">
          SUITE
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 ${type === 'suite' ? 'p-6' : 'p-3 md:p-4'} text-white`}>
        <h3 className={`${type === 'suite' ? 'text-2xl' : 'text-base md:text-lg'} font-serif ${type === 'suite' ? 'mb-2' : 'mb-1'}`}>{name}</h3>
        {type === 'suite' && (
          <>
            <p className="text-gray-300 text-sm mb-2">{desc}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {features.map((f, j) => (
                <span key={j} className="text-xs bg-white/20 px-2 py-1 rounded">{f}</span>
              ))}
            </div>
          </>
        )}
        <div className={`flex items-center ${type === 'suite' ? 'justify-between' : ''}`}>
          <span className={`text-moon-gold font-semibold ${type === 'suite' ? 'text-lg' : 'text-sm'}`}>{price}</span>
          {type === 'suite' && (
            <span className="text-xs bg-white/20 group-hover:bg-white/30 px-3 py-1 rounded transition-colors">
              View Details →
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
