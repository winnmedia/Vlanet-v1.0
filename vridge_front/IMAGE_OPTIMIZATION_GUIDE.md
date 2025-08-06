# VideoPlanet 이미지 최적화 가이드

## 개요

이 문서는 VideoPlanet 프로젝트에 구현된 이미지 최적화 시스템의 사용 방법과 모범 사례를 설명합니다.

## 🚀 주요 기능

- **WebP/AVIF 자동 변환**: 최신 이미지 포맷으로 자동 변환
- **지연 로딩**: 뷰포트에 도달할 때만 이미지 로드
- **반응형 이미지**: 디바이스별 최적화된 크기 제공
- **블러 플레이스홀더**: 로딩 중 사용자 경험 개선
- **성능 모니터링**: 자동화된 성능 감사 및 최적화 권장사항

## 📦 설치된 컴포넌트

### OptimizedImage 컴포넌트

기존의 `<img>` 태그를 대체하는 고성능 이미지 컴포넌트입니다.

```jsx
import OptimizedImage from '@/components/OptimizedImage';

// 기본 사용법
<OptimizedImage 
  src="/images/example.jpg"
  alt="설명"
  width={400}
  height={300}
/>

// 프리셋 사용법 (권장)
<OptimizedImage.Hero 
  src="/images/hero-banner.jpg"
  alt="메인 배너"
  priority
/>

<OptimizedImage.Avatar 
  src="/images/profile.jpg"
  alt="프로필 사진"
/>

<OptimizedImage.Thumbnail 
  src="/images/thumbnail.jpg"
  alt="썸네일"
/>
```

## 🎯 프리셋별 최적화

### Hero 이미지
- 우선순위 로딩 (`priority`)
- 높은 품질 (85%)
- 전체 뷰포트 크기

### Avatar 이미지
- 1:1 비율 강제
- 중간 품질 (80%)
- 작은 크기 최적화

### Thumbnail 이미지
- 지연 로딩
- 낮은 품질 (70%)
- 3:2 비율

### Card 이미지
- 지연 로딩
- 호버 효과 포함
- 반응형 크기

### Gallery 이미지
- 지연 로딩
- 높은 품질 (80%)
- 다중 크기 생성

## 📊 성능 최적화 설정

### Next.js 이미지 최적화 설정

```javascript
// next.config.js
images: {
  domains: ['videoplanet.up.railway.app', 'vlanet.net', 'localhost'],
  formats: ['image/avif', 'image/webp'],
  quality: 75,
  minimumCacheTTL: 3600,
  deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### 성능 예산

- **개별 이미지**: 최대 500KB
- **전체 이미지**: 최대 5MB
- **중요 경로**: 최대 1MB

## 🛠️ 개발 도구

### 스크립트 명령어

```bash
# 이미지 최적화 (빌드 시 자동 실행)
npm run optimize:images

# 이미지 최적화 시뮬레이션
npm run optimize:images:dry

# 기존 코드 마이그레이션
npm run migrate:images

# 성능 감사
npm run perf:images
```

### 이미지 성능 감사

성능 감사 도구는 다음을 확인합니다:

- 파일 크기 검사
- 포맷 최적화 상태
- 종횡비 검증
- 파일명 최적화
- 중요 경로 이미지 식별

```bash
# 성능 감사 실행
npm run perf:images

# 커스텀 설정으로 감사
node scripts/image-performance-audit.js --threshold=300 --output=./reports
```

## 📝 사용 가이드

### 1. 새 이미지 추가 시

```jsx
// ❌ 기존 방식 (사용 금지)
<img src="/images/new-feature.jpg" alt="새 기능" />

// ✅ 권장 방식
<OptimizedImage 
  src="/images/new-feature.jpg"
  alt="새 기능 소개"
  width={600}
  height={400}
  lazy
/>
```

### 2. 배경 이미지 사용

```jsx
// 배경 이미지 + 콘텐츠 오버레이
<OptimizedImage.Background 
  src="/images/background.jpg"
  overlay={true}
  overlayOpacity={0.7}
>
  <div className="content">
    <h2>제목</h2>
    <p>내용</p>
  </div>
</OptimizedImage.Background>
```

### 3. 동적 이미지 처리

```jsx
const ImageGallery = ({ images }) => {
  return (
    <div className="gallery">
      {images.map((image, index) => (
        <OptimizedImage.Gallery
          key={index}
          src={image.url}
          alt={image.description}
          priority={index < 3} // 첫 3개만 우선 로딩
        />
      ))}
    </div>
  );
};
```

## 🔧 고급 설정

### 커스텀 최적화 옵션

```jsx
<OptimizedImage 
  src="/images/custom.jpg"
  alt="커스텀 이미지"
  width={800}
  height={600}
  quality={90}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  sizes="(max-width: 768px) 100vw, 50vw"
  objectFit="cover"
  objectPosition="center top"
  enableHover={true}
  fallbackSrc="/images/placeholder.svg"
/>
```

### 이미지 유틸리티 함수

```javascript
import { 
  getOptimizedImageProps,
  generateBlurDataURL,
  measureImagePerformance 
} from '@/utils/imageOptimizer';

// 최적화된 props 생성
const props = getOptimizedImageProps({
  src: '/images/example.jpg',
  width: 400,
  height: 300,
  quality: 80,
  responsive: true
});

// 성능 측정
measureImagePerformance('/images/test.jpg', (result) => {
  console.log(`로딩 시간: ${result.loadTime}ms`);
  console.log(`이미지 크기: ${result.naturalWidth}x${result.naturalHeight}`);
});
```

## 📈 성능 모니터링

### Core Web Vitals 최적화

- **LCP (Largest Contentful Paint)**: 2.5초 이하
- **FID (First Input Delay)**: 100ms 이하  
- **CLS (Cumulative Layout Shift)**: 0.1 이하

### 성능 검증

```bash
# Lighthouse 성능 측정
npm run lighthouse

# 이미지별 성능 리포트 생성
npm run perf:images
```

## 🚨 주의사항

### 금지사항

1. **직접적인 img 태그 사용 금지**
   ```jsx
   // ❌ 금지
   <img src="/images/example.jpg" alt="예시" />
   ```

2. **최적화되지 않은 이미지 업로드 금지**
   - 2MB 이상의 이미지
   - BMP, TIFF 등 비효율적 포맷

3. **alt 속성 누락 금지**
   ```jsx
   // ❌ 접근성 위반
   <OptimizedImage src="/images/example.jpg" />
   
   // ✅ 올바른 사용
   <OptimizedImage src="/images/example.jpg" alt="의미있는 설명" />
   ```

### 모범 사례

1. **의미 있는 alt 텍스트 작성**
2. **적절한 이미지 크기 지정**
3. **중요도에 따른 priority 설정**
4. **반응형 이미지 활용**

## 🔄 마이그레이션 가이드

### 기존 코드 마이그레이션

```bash
# 1. 백업 생성 (자동)
npm run migrate:images --dry-run

# 2. 실제 마이그레이션 실행
npm run migrate:images

# 3. 롤백이 필요한 경우
npm run migrate:images --rollback
```

### 수동 마이그레이션

기본 변환 규칙:

```jsx
// Before
<img src="/images/hero.jpg" alt="메인 이미지" width="800" height="600" />

// After  
<OptimizedImage.Hero 
  src="/images/hero.jpg"
  alt="메인 이미지"
  width={800}
  height={600}
  priority
/>
```

## 📚 참고 자료

- [Next.js Image 최적화 가이드](https://nextjs.org/docs/api-reference/next/image)
- [Core Web Vitals](https://web.dev/vitals/)
- [WebP 이미지 포맷](https://developers.google.com/speed/webp)
- [AVIF 이미지 포맷](https://jakearchibald.com/2020/avif-has-landed/)

## 🤝 기여하기

이미지 최적화 시스템 개선에 기여하려면:

1. 성능 테스트 결과 공유
2. 새로운 최적화 기법 제안
3. 버그 리포트 및 개선사항 제안

---

**마지막 업데이트**: 2025-01-08  
**버전**: 1.0.0  
**담당자**: William (Interaction & Performance Engineer)