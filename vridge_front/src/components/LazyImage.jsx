import React, { useState, useEffect, useRef } from 'react'

const LazyImage = ({ 
  src, 
  alt, 
  placeholder = '/images/placeholder.png',
  className = '',
  style = {},
  onLoad = () => {},
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [imageRef, setImageRef] = useState()
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef()

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageRef(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(imgRef.current)

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (imageRef) {
      const img = new Image()
      img.src = src
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        onLoad()
      }
    }
  }, [imageRef, src, onLoad])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out'
      }}
      {...props}
    />
  )
}

export default LazyImage