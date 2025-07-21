import { useState, useEffect, useRef } from 'react'

export default function LazyImage({ src, alt, className, style, placeholder }) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [imageRef, setImageRef] = useState()
  const [isLoaded, setIsLoaded] = useState(false)

  const onIntersection = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setImageSrc(src)
        observer.unobserve(entry.target)
      }
    })
  }

  useEffect(() => {
    let observer
    if (imageRef && !isLoaded) {
      observer = new IntersectionObserver(onIntersection, {
        threshold: 0.01,
        rootMargin: '50px'
      })
      observer.observe(imageRef)
    }
    return () => {
      if (observer && observer.unobserve) {
        observer.disconnect()
      }
    }
  }, [imageRef, isLoaded, src])

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onLoad={() => setIsLoaded(true)}
    />
  )
}