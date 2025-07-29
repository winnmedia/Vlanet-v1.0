import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './OptimizedImage.module.scss';

/**
 * 최적화된 이미지 컴포넌트
 * - WebP 자동 변환
 * - Lazy loading
 * - Blur placeholder
 * - Responsive sizing
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  className,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 기본 blur 데이터 URL (1x1 픽셀 투명 이미지)
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    onError?.();
  };

  // 에러 시 대체 이미지
  if (error) {
    return (
      <div 
        className={`${styles.errorContainer} ${className || ''}`}
        style={{ width, height }}
      >
        <div className={styles.errorIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16l-2 12H6L4 6zm0 0l-.5-2h17l-.5 2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 9v6m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className={styles.errorText}>이미지 로드 실패</span>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div 
          className={styles.skeleton}
          style={{ aspectRatio: `${width}/${height}` }}
        />
      )}
      
      {/* Next.js Image 컴포넌트 */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        sizes={sizes || `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
        className={styles.image}
        style={{
          objectFit,
          objectPosition,
          opacity: isLoading ? 0 : 1
        }}
        onLoadingComplete={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

// 썸네일용 프리셋
export const Thumbnail = ({ src, alt, size = 'medium', ...props }) => {
  const sizes = {
    small: { width: 120, height: 80 },
    medium: { width: 240, height: 160 },
    large: { width: 360, height: 240 }
  };

  const { width, height } = sizes[size] || sizes.medium;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={styles.thumbnail}
      {...props}
    />
  );
};

// 배너용 프리셋
export const Banner = ({ src, alt, aspectRatio = '16:9', ...props }) => {
  const ratios = {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1600, height: 1200 },
    '21:9': { width: 2560, height: 1080 },
    '1:1': { width: 1200, height: 1200 }
  };

  const { width, height } = ratios[aspectRatio] || ratios['16:9'];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={styles.banner}
      sizes="100vw"
      priority
      {...props}
    />
  );
};

// 프로필 이미지용 프리셋
export const Avatar = ({ src, alt, size = 'medium', ...props }) => {
  const sizes = {
    small: 32,
    medium: 64,
    large: 128
  };

  const dimension = sizes[size] || sizes.medium;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={`${styles.avatar} ${styles[`avatar-${size}`]}`}
      objectFit="cover"
      {...props}
    />
  );
};

export default OptimizedImage;