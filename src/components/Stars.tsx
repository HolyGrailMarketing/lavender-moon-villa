'use client'

import { useEffect, useState } from 'react'

type Star = {
  id: number
  left: string
  top: string
  size: string
  delay: string
  duration: string
}

export default function Stars() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const generatedStars: Star[] = []
    for (let i = 0; i < 100; i++) {
      generatedStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        delay: `${Math.random() * 3}s`,
        duration: `${Math.random() * 2 + 2}s`,
      })
    }
    setStars(generatedStars)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  )
}





