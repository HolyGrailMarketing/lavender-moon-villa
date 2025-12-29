'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const slides = [
  {
    image: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(1).JPG',
    title: 'Luxurious Accommodations',
    subtitle: 'Experience refined comfort in every room'
  },
  {
    image: '/Pictures/206-A/Lavender%20Moon%20206%20A%20(1).JPG',
    title: 'Elegant Suites',
    subtitle: 'Spacious rooms with stunning views'
  },
  {
    image: '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG',
    title: 'Peaceful Retreat',
    subtitle: 'Your sanctuary in the Jamaican hills'
  },
  {
    image: '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG',
    title: 'Modern Comfort',
    subtitle: 'All the amenities you need for a perfect stay'
  },
  {
    image: '/Pictures/106-JW/Lavender%20Moon%20106JW%20(3).JPG',
    title: 'Warm Hospitality',
    subtitle: 'Where every guest feels at home'
  },
]

export default function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextSlide = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [isTransitioning])

  const prevSlide = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [isTransitioning])

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return
    setIsTransitioning(true)
    setCurrentSlide(index)
    setTimeout(() => setIsTransitioning(false), 700)
  }

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          
          {/* Slide content */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 transition-all duration-700 ${
            index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <p className="text-sm md:text-base tracking-[0.4em] uppercase text-white/90 mb-4 animate-fade-in">
              Welcome to
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif tracking-wider mb-4 drop-shadow-lg">
              Lavender Moon Villas
            </h1>
            <p className="text-lg md:text-2xl font-serif italic mb-2 drop-shadow-md">
              {slide.title}
            </p>
            <p className="text-sm md:text-lg text-gray-200 mb-8 drop-shadow-md">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all group"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all group"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

