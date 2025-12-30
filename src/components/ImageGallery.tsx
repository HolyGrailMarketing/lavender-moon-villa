'use client'

import { useState } from 'react'
import Image from 'next/image'

const galleryImages = [
  // Property Photos
  { src: '/Pictures/Property/IMG_2951.JPG', alt: 'Lavender Moon Villas Property' },
  { src: '/Pictures/Property/IMG_5055.JPG', alt: 'Lavender Moon Villas View' },
  { src: '/Pictures/Property/IMG_9372.JPG', alt: 'Lavender Moon Villas Exterior' },
  { src: '/Pictures/Property/17431aa2-01eb-4157-9073-d4439b15b799.JPG', alt: 'Pool Area' },
  { src: '/Pictures/Property/3bca5c5a-f26d-405a-939d-f4e08aecc162.JPG', alt: 'Property View' },
  { src: '/Pictures/Property/4bf3e28b-e48b-49b9-b87f-9908eda2f1b6.JPG', alt: 'Villa Exterior' },
  { src: '/Pictures/Property/518fbfac-bec1-4089-8bff-4c9c16b005dd.JPG', alt: 'Gardens' },
  { src: '/Pictures/Property/750e4462-615a-40ce-bac3-3552874256d8.JPG', alt: 'Outdoor Space' },
  // Room Photos
  { src: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(1).JPG', alt: 'Room 106-JW Interior' },
  { src: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(5).JPG', alt: 'Room 106-JW Bedroom' },
  { src: '/Pictures/206-A/Lavender%20Moon%20206%20A%20(1).JPG', alt: 'Suite 206-A' },
  { src: '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG', alt: 'Room 207-A' },
  { src: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG', alt: 'Room 107-CF' },
  { src: '/Pictures/Room%20206-B/Lavender%20Moon%20206B%20(1).JPG', alt: 'Room 206-B' },
  { src: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(10).JPG', alt: 'Room Details' },
  { src: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(10).JPG', alt: 'Bathroom' },
]

export default function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedImage(index)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setSelectedImage(null)
    document.body.style.overflow = 'auto'
  }

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryImages.length)
    }
  }

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + galleryImages.length) % galleryImages.length)
    }
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              quality={70}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-50"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div 
            className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[selectedImage].src}
              alt={galleryImages[selectedImage].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              quality={80}
            />
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedImage + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </>
  )
}

