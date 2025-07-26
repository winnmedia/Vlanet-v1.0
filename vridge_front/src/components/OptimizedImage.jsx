import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useIntersectionObserver } from '../utils/performance'
import styles from './OptimizedImage.module.scss'

const OptimizedImage = React.memo(({
  src,
  alt,
  width,
  height,
  placeholder = '/images/placeholder.jpg',
  className = '',
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
  sizes,
  quality = 75
}) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imageRef = useRef(null)
  
  // Intersection Observer를 사용한 레이지 로딩
  const loadImage = () => {
    if (src && !priority) {
      const img = new Image()
      img.src = src
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        if (onLoad) onLoad()
      }
      
      img.onerror = () => {
        setHasError(true)
        if (onError) onError()
      }
    }
  }
  
  useIntersectionObserver({
    target: imageRef,
    onIntersect: loadImage,
    threshold: 0.01,
    rootMargin: '50px',
    enabled: !priority && !isLoaded
  })
  
  // Priority 이미지는 즉시 로드
  useEffect(() => {
    if (priority && src) {
      setImageSrc(src)
      setIsLoaded(true)
    }
  }, [priority, src])
  
  // Next.js Image 컴포넌트와 호환되는 srcset 생성
  const generateSrcSet = () => {
    if (!src || hasError) return undefined
    
    const baseUrl = src.split('?')[0]
    const extension = baseUrl.split('.').pop()
    
    // 이미지 형식에 따른 최적화
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return `
        ${baseUrl}?w=640&q=${quality} 640w,
        ${baseUrl}?w=750&q=${quality} 750w,
        ${baseUrl}?w=828&q=${quality} 828w,
        ${baseUrl}?w=1080&q=${quality} 1080w,
        ${baseUrl}?w=1200&q=${quality} 1200w,
        ${baseUrl}?w=1920&q=${quality} 1920w,
        ${baseUrl}?w=2048&q=${quality} 2048w,
        ${baseUrl}?w=3840&q=${quality} 3840w
      `
    }
    
    return undefined
  }
  
  const containerClasses = [
    styles.imageContainer,
    isLoaded && styles.loaded,
    hasError && styles.error,
    className
  ].filter(Boolean).join(' ')
  
  const imageClasses = [
    styles.image,
    styles[`objectFit-${objectFit}`]
  ].filter(Boolean).join(' ')
  
  return (
    <div 
      ref={imageRef}
      className={containerClasses}
      style={{ width, height }}
    >
      {!hasError ? (
        <>
          {/* Blur placeholder */}
          {!isLoaded && placeholder && (
            <img
              src={placeholder}
              alt=""
              className={styles.placeholder}
              aria-hidden="true"
            />
          )}
          
          {/* Main image */}
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={imageClasses}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            srcSet={generateSrcSet()}
            sizes={sizes}
            onLoad={() => {
              setIsLoaded(true)
              if (onLoad) onLoad()
            }}
            onError={() => {
              setHasError(true)
              if (onError) onError()
            }}
          />
        </>
      ) : (
        <div className={styles.errorState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 16L24 28L40 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="16" cy="16" r="2" fill="currentColor"/>
          </svg>
          <p>이미지를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  priority: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  sizes: PropTypes.string,
  quality: PropTypes.number
}

export default OptimizedImage

// WebP 지원 체크 유틸리티
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 0
}

// 이미지 포맷 최적화 함수
export const getOptimizedImageUrl = (url, format = 'auto') => {
  if (!url) return ''
  
  const baseUrl = url.split('?')[0]
  const params = new URLSearchParams(url.split('?')[1])
  
  // 자동 포맷 선택
  if (format === 'auto') {
    format = supportsWebP() ? 'webp' : 'jpg'
  }
  
  params.set('fm', format)
  
  return `${baseUrl}?${params.toString()}`
}