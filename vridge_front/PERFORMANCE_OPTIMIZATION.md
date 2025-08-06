# VideoPlanet 프론트엔드 성능 최적화 가이드

## 📊 최적화 적용 내역

### 1. 번들 크기 최적화

#### Ant Design 트리 쉐이킹
- `babel-plugin-import` 설정으로 사용하지 않는 컴포넌트 제거
- 번들 크기 약 40% 감소 예상

#### Moment.js → Day.js 전환
- 번들 크기 92% 감소 (67kb → 2kb)
- API 호환성 유지

#### 동적 임포트 적용
```javascript
// Before
import Component from './Component'

// After
const Component = lazy(() => import('./Component'))
```

### 2. 코드 스플리팅

#### 페이지별 청크 분리
- 각 페이지는 독립적인 청크로 분리
- 초기 로딩 시간 50% 감소 예상

#### 라이브러리별 청크 분리
- `antd`: 별도 청크
- `vendors`: 기타 라이브러리
- `common`: 공통 코드

### 3. 이미지 최적화

#### Next.js Image 컴포넌트 활용
- WebP/AVIF 자동 변환
- Lazy loading 기본 적용
- 반응형 이미지 지원

#### 최적화된 이미지 설정
```javascript
// OptimizedImage 컴포넌트 사용
<OptimizedImage
  src="/image.jpg"
  alt="설명"
  width={800}
  height={600}
  quality={75}
  priority={false}
/>
```

### 4. CSS 최적화

#### PurgeCSS 설정
- 미사용 CSS 자동 제거
- CSS 크기 60% 감소 예상

#### Critical CSS 인라인
- 첫 화면 렌더링에 필요한 CSS만 인라인
- FCP (First Contentful Paint) 개선

### 5. PWA 및 캐싱

#### Service Worker 구현
- 정적 자산 캐시
- API 응답 캐시
- 오프라인 지원

#### 캐시 전략
- **Cache First**: 정적 자산 (이미지, 폰트 등)
- **Network First**: API 호출
- **Stale While Revalidate**: HTML, CSS, JS

### 6. 성능 모니터링

#### Core Web Vitals 측정
- LCP (Largest Contentful Paint) < 2.5초
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

#### 실시간 모니터링
- 메모리 사용량 추적
- 느린 리소스 식별
- 성능 저하 경고

## 🚀 성능 목표

### Before vs After 예상 성능 개선

| 메트릭 | Before | After | 개선율 |
|--------|--------|-------|--------|
| 초기 번들 크기 | ~2.5MB | ~1.2MB | 52% 감소 |
| LCP | ~4.2초 | ~2.1초 | 50% 개선 |
| FID | ~180ms | ~80ms | 56% 개선 |
| CLS | ~0.15 | ~0.05 | 67% 개선 |

### 네트워크별 성능 목표
- **3G**: 5초 이내 완전 로딩
- **4G**: 2초 이내 완전 로딩
- **WiFi**: 1초 이내 완전 로딩

## 📋 사용법

### 1. 패키지 설치
```bash
npm install
```

### 2. 번들 분석
```bash
npm run analyze
```

### 3. 개발 서버 시작
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 🔧 설정 파일

### Next.js 설정 (`next.config.js`)
- 번들 분석기 통합
- 이미지 최적화 설정
- Webpack 번들 최적화
- 실험적 기능 활성화

### Babel 설정 (`.babelrc`)
- Ant Design 트리 쉐이킹
- Styled Components SSR

### PostCSS 설정 (`postcss.config.js`)
- PurgeCSS 설정
- CSS 압축 최적화

## 📈 성능 측정

### 개발 중 모니터링
- 브라우저에서 F12 → Performance 탭
- `PerformanceMonitor` 컴포넌트 로그 확인

### 프로덕션 성능 측정
- Lighthouse 스코어 측정
- WebPageTest.org 성능 테스트
- Core Web Vitals 모니터링

## 🎯 추가 최적화 권장사항

### 1. 이미지 최적화
- 모든 이미지를 `OptimizedImage` 컴포넌트로 교체
- WebP 포맷 우선 사용
- 적절한 `priority` 속성 설정

### 2. 코드 최적화
- React.memo() 적절히 활용
- useMemo, useCallback 성능 병목 지점에 적용
- 무한 스크롤에는 가상화 적용

### 3. API 최적화
- SWR 또는 React Query 도입 검토
- API 응답 캐싱 전략 수립
- 데이터 prefetching 활용

### 4. 폰트 최적화
- 폰트 서브셋 사용
- font-display: swap 적용
- 시스템 폰트 fallback 설정

## 🐛 성능 이슈 디버깅

### 번들 크기 문제
1. `npm run analyze` 실행
2. 큰 청크 식별
3. 동적 임포트 적용 검토

### 로딩 속도 문제
1. Network 탭에서 느린 리소스 확인
2. 불필요한 요청 제거
3. 캐싱 전략 재검토

### 런타임 성능 문제
1. Performance 탭에서 프로파일링
2. 무거운 연산 식별
3. 최적화 또는 Web Worker 활용

## 📚 추가 자료

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)