import { useEffect, useState } from 'react'

interface DestinationSlideshowProps {
  images: string[]
  alt: string
}

export function DestinationSlideshow({ images, alt }: DestinationSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <>
      {images.map((image, i) => (
        <img
          key={image}
          src={image}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-1000 group-hover:scale-110 ${
            i === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((image, i) => (
            <span
              key={image}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}
