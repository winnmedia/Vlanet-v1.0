/**
 * 이미지 최적화 유틸리티 함수들
 * - 이미지 속성 최적화
 * - 블러 플레이스홀더 생성  
 * - 반응형 크기 계산
 * - 종횡비 계산
 * - 이미지 압축 및 형식 최적화
 */

// 지원되는 이미지 형식
export const SUPPORTED_FORMATS = {
  WEBP: 'image/webp',
  AVIF: 'image/avif',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
};

// 디바이스별 breakpoint
export const DEVICE_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1400,
  ultra: 1920
};

// 품질별 설정
export const QUALITY_PRESETS = {
  low: 50,
  medium: 65, 
  high: 75,
  premium: 85,
  lossless: 100
};

// 용도별 최적화 설정
export const OPTIMIZATION_PRESETS = {
  hero: {
    quality: QUALITY_PRESETS.premium,
    priority: true,
    sizes: '100vw',
    formats: [SUPPORTED_FORMATS.AVIF, SUPPORTED_FORMATS.WEBP]
  },
  avatar: {
    quality: QUALITY_PRESETS.high,
    priority: false,
    sizes: '64px',
    formats: [SUPPORTED_FORMATS.WEBP, SUPPORTED_FORMATS.JPEG]
  },
  thumbnail: {
    quality: QUALITY_PRESETS.medium,
    priority: false, 
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    formats: [SUPPORTED_FORMATS.WEBP, SUPPORTED_FORMATS.JPEG]
  },
  gallery: {
    quality: QUALITY_PRESETS.high,
    priority: false,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw',
    formats: [SUPPORTED_FORMATS.AVIF, SUPPORTED_FORMATS.WEBP]
  },
  background: {
    quality: QUALITY_PRESETS.medium,
    priority: false,
    sizes: '100vw',
    formats: [SUPPORTED_FORMATS.WEBP, SUPPORTED_FORMATS.JPEG]
  }
};

/**
 * 브라우저의 이미지 포맷 지원 여부 확인
 */
export const checkFormatSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('image/webp') === 5,
    avif: canvas.toDataURL('image/avif').indexOf('image/avif') === 5
  };
};

/**
 * 최적화된 이미지 속성 생성
 */
export const getOptimizedImageProps = ({
  src,
  width,
  height,
  quality = QUALITY_PRESETS.high,
  aspectRatio,
  responsive = true,
  preset
}) => {
  const props = {
    src,
    width,
    height,
    quality
  };

  // 프리셋 적용
  if (preset && OPTIMIZATION_PRESETS[preset]) {
    const presetConfig = OPTIMIZATION_PRESETS[preset];
    props.quality = presetConfig.quality;
    props.priority = presetConfig.priority;
    props.sizes = presetConfig.sizes;
  }

  // 종횡비 기반 크기 계산
  if (aspectRatio && width && !height) {
    props.height = Math.round(width / parseAspectRatio(aspectRatio));
  } else if (aspectRatio && height && !width) {
    props.width = Math.round(height * parseAspectRatio(aspectRatio));
  }

  // 반응형 sizes 계산
  if (responsive && !props.sizes) {
    props.sizes = generateResponsiveSizes(width, height);
  }

  return props;
};

/**
 * 종횡비 문자열을 숫자로 파싱
 */
export const parseAspectRatio = (aspectRatio) => {
  if (typeof aspectRatio === 'number') return aspectRatio;
  
  if (typeof aspectRatio === 'string') {
    if (aspectRatio.includes('/')) {
      const [w, h] = aspectRatio.split('/').map(Number);
      return w / h;
    }
    if (aspectRatio.includes(':')) {
      const [w, h] = aspectRatio.split(':').map(Number);
      return w / h;
    }
    return parseFloat(aspectRatio);
  }
  
  return 1;
};

/**
 * 종횡비를 고려한 이미지 크기 계산
 */
export const calculateAspectRatio = (naturalWidth, naturalHeight, targetRatio) => {
  if (!targetRatio) {
    return { width: naturalWidth, height: naturalHeight };
  }
  
  const ratio = parseAspectRatio(targetRatio);
  
  // 원본 종횡비와 타겟 종횡비 비교
  const originalRatio = naturalWidth / naturalHeight;
  
  if (originalRatio > ratio) {
    // 원본이 더 넓음 - 높이 기준으로 조정
    const height = naturalHeight;
    const width = Math.round(height * ratio);
    return { width, height };
  } else {
    // 원본이 더 높음 - 너비 기준으로 조정  
    const width = naturalWidth;
    const height = Math.round(width / ratio);
    return { width, height };
  }
};

/**
 * 반응형 sizes 속성 생성
 */
export const generateResponsiveSizes = (width, height) => {
  if (!width) {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }

  const breakpoints = [];
  
  // 모바일
  if (width <= DEVICE_BREAKPOINTS.mobile) {
    breakpoints.push('(max-width: 640px) 100vw');
  }
  
  // 태블릿
  if (width <= DEVICE_BREAKPOINTS.tablet) {
    breakpoints.push('(max-width: 1024px) 50vw');
  }
  
  // 데스크톱
  if (width <= DEVICE_BREAKPOINTS.desktop) {
    breakpoints.push('(max-width: 1400px) 33vw');
  }
  
  // 최종 폴백
  breakpoints.push('25vw');
  
  return breakpoints.join(', ');
};

/**
 * 블러 플레이스홀더 Data URL 생성
 */
export const generateBlurDataURL = (width = 10, height = 10, color = '#f0f0f0') => {
  // SVG 기반 블러 플레이스홀더
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:${lightenColor(color, 0.1)};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

/**
 * 색상 밝기 조절
 */
export const lightenColor = (color, amount) => {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  
  let r = (num >> 16) + Math.round(255 * amount);
  let g = (num >> 8 & 0x00FF) + Math.round(255 * amount);
  let b = (num & 0x0000FF) + Math.round(255 * amount);
  
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

/**
 * 이미지 로드 성능 측정
 */
export const measureImagePerformance = (imageSrc, callback) => {
  const startTime = performance.now();
  const img = new Image();
  
  img.onload = () => {
    const loadTime = performance.now() - startTime;
    callback({
      src: imageSrc,
      loadTime: loadTime,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      success: true
    });
  };
  
  img.onerror = () => {
    const loadTime = performance.now() - startTime;
    callback({
      src: imageSrc,
      loadTime: loadTime,
      naturalWidth: 0,
      naturalHeight: 0,
      success: false
    });
  };
  
  img.src = imageSrc;
};

/**
 * 이미지 사이즈 최적화 권장사항
 */
export const getOptimizationRecommendations = (width, height, usage = 'general') => {
  const recommendations = {
    currentSize: `${width}x${height}`,
    fileSize: estimateFileSize(width, height),
    suggestions: []
  };

  // 크기 체크
  if (width > 2048 || height > 2048) {
    recommendations.suggestions.push({
      type: 'size',
      message: '이미지 크기가 너무 큽니다. 2048px 이하로 줄이는 것을 권장합니다.',
      priority: 'high'
    });
  }

  // 종횡비 체크 
  const aspectRatio = width / height;
  if (usage === 'avatar' && Math.abs(aspectRatio - 1) > 0.1) {
    recommendations.suggestions.push({
      type: 'aspect-ratio',
      message: '아바타 이미지는 1:1 비율을 권장합니다.',
      priority: 'medium'
    });
  }

  // 품질 권장사항
  if (usage === 'hero') {
    recommendations.suggestions.push({
      type: 'quality',
      message: '히어로 이미지는 85% 품질을 권장합니다.',
      priority: 'low'
    });
  }

  return recommendations;
};

/**
 * 이미지 파일 크기 추정
 */
export const estimateFileSize = (width, height, quality = 75) => {
  const pixels = width * height;
  const qualityFactor = quality / 100;
  
  // 대략적인 JPEG 압축률 계산 (bytes per pixel)
  const baseSize = pixels * 0.5 * qualityFactor;
  
  return {
    bytes: Math.round(baseSize),
    kb: Math.round(baseSize / 1024),
    mb: Math.round(baseSize / (1024 * 1024) * 100) / 100
  };
};

/**
 * 이미지 캐싱 전략
 */
export const getCacheStrategy = (imageType, size) => {
  const sizeCategory = size < 50000 ? 'small' : size < 500000 ? 'medium' : 'large';
  
  const strategies = {
    avatar: { maxAge: 86400 * 7, staleWhileRevalidate: 86400 }, // 7일
    thumbnail: { maxAge: 86400 * 3, staleWhileRevalidate: 86400 }, // 3일
    hero: { maxAge: 86400, staleWhileRevalidate: 3600 }, // 1일
    gallery: { maxAge: 86400 * 7, staleWhileRevalidate: 86400 * 2 } // 7일
  };
  
  return strategies[imageType] || strategies.thumbnail;
};

/**
 * 이미지 지연 로딩 임계값 계산
 */
export const getLazyLoadingThreshold = (viewport) => {
  // 뷰포트 크기에 따른 지연 로딩 임계값
  const thresholds = {
    mobile: '100px',
    tablet: '200px', 
    desktop: '300px'
  };
  
  if (viewport.width <= DEVICE_BREAKPOINTS.mobile) return thresholds.mobile;
  if (viewport.width <= DEVICE_BREAKPOINTS.tablet) return thresholds.tablet;
  return thresholds.desktop;
};

/**
 * 성능 예산 체크
 */
export const checkPerformanceBudget = (images) => {
  const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
  const budget = {
    mobile: 1024 * 1024, // 1MB
    desktop: 3 * 1024 * 1024 // 3MB
  };
  
  return {
    totalSize,
    budget,
    isUnderBudget: totalSize <= budget.desktop,
    recommendations: totalSize > budget.mobile ? [
      '이미지 총 용량이 모바일 예산을 초과합니다.',
      'WebP/AVIF 형식 사용을 권장합니다.',
      '중요하지 않은 이미지는 지연 로딩을 적용하세요.'
    ] : []
  };
};

// 브라우저별 최적 포맷 감지
export const getOptimalFormat = () => {
  if (typeof window === 'undefined') return 'webp';
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // AVIF 지원 확인
  if (canvas.toDataURL('image/avif').indexOf('image/avif') === 5) {
    return 'avif';
  }
  
  // WebP 지원 확인
  if (canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
    return 'webp';
  }
  
  return 'jpeg';
};

export default {
  getOptimizedImageProps,
  generateBlurDataURL,
  calculateAspectRatio,
  generateResponsiveSizes,
  measureImagePerformance,
  getOptimizationRecommendations,
  checkPerformanceBudget,
  getOptimalFormat,
  OPTIMIZATION_PRESETS,
  QUALITY_PRESETS,
  DEVICE_BREAKPOINTS
};