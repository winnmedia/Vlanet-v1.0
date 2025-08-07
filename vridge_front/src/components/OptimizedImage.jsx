import { useState, useEffect, useMemo, forwardRef, useCallback } from 'react'
import Image from 'next/image';
import { getOptimizedImageProps, generateBlurDataURL, calculateAspectRatio } from '../utils/imageOptimizer';

/**
 * 고성능 최적화 이미지 컴포넌트
 * - WebP/AVIF 자동 변환 지원 
 * - 지연 로딩 기본 적용
 * - 반응형 크기 자동 계산
 * - 블러 플레이스홀더 생성
 * - 이미지 압축 품질 최적화
 * - 에러 핸들링 및 폴백
 */
const OptimizedImage = forwardRef(({
  src,
  alt = '',
  width,
  height,
  quality = 75,
  priority = false,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  aspectRatio,
  responsive = true,
  className = '',
  style = {},
  onLoad,
  onError,
  onLoadingComplete,
  fallbackSrc = '/images/Common/logo.svg',
  showLoadingSpinner = true,
  lazy = true,
  enableHover = false,
  ...props
}, ref) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width, height });
  const [isIntersecting, setIsIntersecting] = useState(!lazy);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    const element = ref?.current;
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [lazy, priority, ref]);

  // 이미지 최적화 속성 계산
  const optimizedProps = useMemo(() => {
    return getOptimizedImageProps({
      src,
      width: imageDimensions.width,
      height: imageDimensions.height,
      quality,
      aspectRatio,
      responsive
    });
  }, [src, imageDimensions.width, imageDimensions.height, quality, aspectRatio, responsive]);

  // 블러 데이터 URL 생성
  const computedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'blur' && !imageError) {
      return generateBlurDataURL(imageDimensions.width || 10, imageDimensions.height || 10);
    }
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
  }, [blurDataURL, placeholder, imageError, imageDimensions]);

  // 반응형 sizes 자동 계산
  const computedSizes = useMemo(() => {
    if (sizes) return sizes;
    if (responsive && !fill) {
      return '(max-width: 320px) 280px, (max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
    return undefined;
  }, [sizes, responsive, fill]);

  // 이미지 차원 자동 감지
  useEffect(() => {
    if (!width || !height || aspectRatio) {
      const img = new window.Image();
      img.onload = () => {
        const calculatedDimensions = calculateAspectRatio(
          img.naturalWidth,
          img.naturalHeight,
          aspectRatio
        );
        setImageDimensions(calculatedDimensions);
      };
      img.onerror = () => {
        setImageDimensions({ width: width || 300, height: height || 200 });
      };
      img.src = src;
    }
  }, [src, width, height, aspectRatio]);

  // 이미지 로드 핸들러
  const handleLoad = useCallback((event) => {
    setIsLoading(false);
    onLoad?.(event);
  }, [onLoad]);

  // 이미지 에러 핸들러
  const handleError = useCallback((event) => {
    setImageError(true);
    setIsLoading(false);
    console.warn(`이미지 로드 실패: ${src}`);
    onError?.(event);
  }, [src, onError]);

  // 로딩 완료 핸들러
  const handleLoadingComplete = useCallback((result) => {
    setIsLoading(false);
    onLoadingComplete?.(result);
  }, [onLoadingComplete]);

  // 로딩 스피너 컴포넌트
  const LoadingSpinner = ({ dimensions }) => (
    <div 
      className="image-loading-spinner"
      style={{
        position: fill ? 'absolute' : 'static',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        width: fill ? '100%' : dimensions.width,
        height: fill ? '100%' : dimensions.height,
        minHeight: fill ? 'auto' : `${dimensions.height || 200}px`,
        zIndex: 1
      }}
    >
      <div className="spinner" />
      <style jsx>{`
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e9ecef;
          border-top: 2px solid #1631F8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // 에러 상태 렌더링
  if (imageError && fallbackSrc && src !== fallbackSrc) {
    return (
      <OptimizedImage
        ref={ref}
        src={fallbackSrc}
        alt={alt || '이미지를 불러올 수 없습니다'}
        width={imageDimensions.width}
        height={imageDimensions.height}
        fill={fill}
        quality={quality}
        className={`optimized-image error ${className}`}
        style={{
          objectFit,
          objectPosition,
          opacity: 0.6,
          filter: 'grayscale(100%)',
          ...style
        }}
        fallbackSrc={null} // 무한 재귀 방지
        {...props}
      />
    );
  }

  // 에러이고 폴백도 없는 경우
  if (imageError) {
    return (
      <div 
        className={`image-error ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d',
          fontSize: '14px',
          fontWeight: '500',
          width: fill ? '100%' : imageDimensions.width || 300,
          height: fill ? '100%' : imageDimensions.height || 200,
          border: '1px dashed #dee2e6',
          borderRadius: '4px',
          ...style
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>📷</div>
          <div>이미지를 불러올 수 없습니다</div>
        </div>
      </div>
    );
  }

  // 메인 이미지 렌더링
  const containerStyle = {
    position: fill ? 'relative' : 'static',
    display: 'inline-block',
    overflow: 'hidden',
    ...(aspectRatio && !fill && {
      aspectRatio: aspectRatio,
      width: '100%'
    }),
    ...(!fill && imageDimensions.width && imageDimensions.height && {
      width: imageDimensions.width,
      height: imageDimensions.height
    })
  };

  const imageStyle = {
    objectFit,
    objectPosition,
    transition: isLoading ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isLoading ? 0 : 1,
    ...(enableHover && {
      cursor: 'pointer'
    }),
    ...style
  };

  return (
    <div 
      ref={fill ? undefined : ref}
      className={`optimized-image-wrapper ${className}`}
      style={containerStyle}
    >
      {isLoading && showLoadingSpinner && (
        <LoadingSpinner dimensions={imageDimensions} />
      )}
      
      {isIntersecting && (
        <Image
          ref={fill ? ref : undefined}
          src={optimizedProps.src}
          alt={alt}
          {...(fill ? {} : {
            width: imageDimensions.width || optimizedProps.width || 300,
            height: imageDimensions.height || optimizedProps.height || 200
          })}
          fill={fill}
          quality={optimizedProps.quality}
          priority={priority}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          placeholder={placeholder}
          blurDataURL={computedBlurDataURL}
          sizes={computedSizes}
          className={`optimized-image ${isLoading ? 'loading' : 'loaded'}`}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          onLoadingComplete={handleLoadingComplete}
          {...props}
        />
      )}

      <style jsx global>{`
        .optimized-image-wrapper {
          position: relative;
        }
        
        .optimized-image {
          max-width: 100%;
          height: auto;
        }
        
        .optimized-image.loading {
          opacity: 0;
        }
        
        .optimized-image.loaded {
          opacity: 1;
        }
        
        .optimized-image.error {
          filter: grayscale(100%);
          opacity: 0.6;
        }
        
        .optimized-image-wrapper:hover .optimized-image:not(.error) {
          ${enableHover ? 'transform: scale(1.02);' : ''}
        }
        
        @media (prefers-reduced-motion: reduce) {
          .optimized-image,
          .optimized-image-wrapper:hover .optimized-image {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// 편의 메서드들 - 특정 용도에 최적화된 프리셋
OptimizedImage.Hero = forwardRef((props, ref) => (
  <OptimizedImage
    ref={ref}
    priority
    quality={85}
    sizes="100vw"
    placeholder="blur"
    enableHover
    {...props}
  />
));
OptimizedImage.Hero.displayName = 'OptimizedImage.Hero';

OptimizedImage.Avatar = forwardRef((props, ref) => (
  <OptimizedImage
    ref={ref}
    width={64}
    height={64}
    quality={80}
    objectFit="cover"
    aspectRatio="1/1"
    placeholder="blur"
    {...props}
  />
));
OptimizedImage.Avatar.displayName = 'OptimizedImage.Avatar';

OptimizedImage.Thumbnail = forwardRef((props, ref) => (
  <OptimizedImage
    ref={ref}
    width={300}
    height={200}
    quality={70}
    aspectRatio="3/2"
    placeholder="blur"
    lazy
    {...props}
  />
));
OptimizedImage.Thumbnail.displayName = 'OptimizedImage.Thumbnail';

OptimizedImage.Card = forwardRef((props, ref) => (
  <OptimizedImage
    ref={ref}
    quality={75}
    placeholder="blur"
    responsive
    lazy
    enableHover
    {...props}
  />
));
OptimizedImage.Card.displayName = 'OptimizedImage.Card';

// 배경 이미지 컴포넌트
OptimizedImage.Background = ({ children, src, overlay = false, overlayOpacity = 0.5, ...props }) => (
  <div style={{ position: 'relative', overflow: 'hidden' }}>
    <OptimizedImage
      src={src}
      fill
      objectFit="cover"
      quality={60}
      priority={false}
      placeholder="blur"
      lazy
      {...props}
    />
    {overlay && (
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          zIndex: 1 
        }} 
      />
    )}
    <div style={{ position: 'relative', zIndex: 2 }}>
      {children}
    </div>
  </div>
);
OptimizedImage.Background.displayName = 'OptimizedImage.Background';

// 갤러리용 이미지 컴포넌트
OptimizedImage.Gallery = forwardRef((props, ref) => (
  <OptimizedImage
    ref={ref}
    quality={80}
    placeholder="blur"
    lazy
    enableHover
    responsive
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw"
    {...props}
  />
));
OptimizedImage.Gallery.displayName = 'OptimizedImage.Gallery';

export default OptimizedImage;