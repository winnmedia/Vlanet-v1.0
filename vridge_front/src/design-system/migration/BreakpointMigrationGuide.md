# 반응형 브레이크포인트 마이그레이션 가이드

## 1. 현재 사용 중인 브레이크포인트 분석

### 비표준 브레이크포인트 발견
```scss
// 발견된 다양한 브레이크포인트들
480px   // Home.scss
640px   // minimal-design-system-v2.scss  
767px   // _layout.scss
768px   // 표준
1024px  // 표준
1220px  // Home.scss
1260px  // Home.scss
1400px  // Layout.module.scss
1401px  // Layout.module.scss
1500px  // Home.scss
```

### 표준 브레이크포인트 시스템
```scss
$breakpoint-xs: 0;
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;
```

## 2. 마이그레이션 매핑

### 비표준 → 표준 변환 규칙

| 현재 사용 중 | 권장 표준 | 이유 |
|-------------|----------|------|
| 480px | 576px (sm) | 모바일 L 기준 |
| 640px | 768px (md) | 태블릿 시작점 |
| 767px | 768px (md) | 1px 차이 통일 |
| 1220px | 1280px (xl) | 노트북 L 기준 |
| 1260px | 1280px (xl) | 20px 차이 통일 |
| 1400px | 1280px (xl) 또는 1536px (2xl) | 용도에 따라 선택 |
| 1500px | 1536px (2xl) | 데스크톱 L 기준 |

## 3. 마이그레이션 방법

### Step 1: 기존 미디어 쿼리 찾기
```bash
# 모든 미디어 쿼리 찾기
grep -r "@media" --include="*.scss" src/
```

### Step 2: 하드코딩된 값을 믹스인으로 변경

#### ❌ Before (하드코딩)
```scss
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    padding: 20px;
  }
}
```

#### ✅ After (믹스인 사용)
```scss
@use '@/design-system/tokens' as *;

.container {
  @include media-down('md') {
    padding: $spacing-md;
  }
  
  @include tablet {
    padding: $spacing-lg;
  }
}
```

### Step 3: 특수한 경우 처리

#### 1px 차이 문제
```scss
// ❌ Before
@media (max-width: 767px) { } // 모바일
@media (min-width: 768px) { } // 데스크톱

// ✅ After
@include mobile { }  // max-width: 767px
@include desktop { } // min-width: 768px
```

#### 커스텀 브레이크포인트가 꼭 필요한 경우
```scss
// 로컬 변수로 정의
$custom-breakpoint: 1400px;

@media (min-width: $custom-breakpoint) {
  // 특수한 레이아웃
}
```

## 4. 실제 파일별 마이그레이션

### Home.scss
```scss
// ❌ Before
@media screen and (max-width: 1260px) { }
@media screen and (max-width: 1500px) { }
@media screen and (max-width: 1220px) { }

// ✅ After
@include media-down('xl') { }     // 1279px 이하
@include media-down('2xl') { }    // 1535px 이하
@include media-down('xl') { }     // 1279px 이하
```

### HomeAlignment.scss
```scss
// ❌ Before
@media (max-width: 1024px) { }
@media (max-width: 768px) { }

// ✅ After
@include media-down('lg') { }  // 1023px 이하
@include media-down('md') { }  // 767px 이하
```

### Layout.module.scss
```scss
// ❌ Before
@media (max-width: 1400px) { }
@media (min-width: 1401px) { }

// ✅ After
@include media-down('xl') { }    // 1279px 이하
@include media-up('xl') { }      // 1280px 이상
// 또는 더 큰 화면이 필요한 경우
@include media-down('2xl') { }   // 1535px 이하
@include media-up('2xl') { }     // 1536px 이상
```

## 5. 모바일 우선 vs 데스크톱 우선

### 모바일 우선 (권장)
```scss
.component {
  // 기본: 모바일 스타일
  font-size: $font-size-sm;
  
  @include media-up('md') {
    // 태블릿 이상
    font-size: $font-size-base;
  }
  
  @include media-up('lg') {
    // 데스크톱 이상
    font-size: $font-size-lg;
  }
}
```

### 데스크톱 우선 (레거시 마이그레이션)
```scss
.component {
  // 기본: 데스크톱 스타일
  font-size: $font-size-lg;
  
  @include media-down('lg') {
    // 태블릿 이하
    font-size: $font-size-base;
  }
  
  @include media-down('md') {
    // 모바일
    font-size: $font-size-sm;
  }
}
```

## 6. 디바이스별 믹스인 활용

```scss
.navigation {
  // 모바일 전용
  @include mobile {
    position: fixed;
    bottom: 0;
  }
  
  // 태블릿 전용
  @include tablet {
    position: sticky;
    top: 0;
  }
  
  // 데스크톱 이상
  @include desktop {
    position: relative;
  }
}
```

## 7. 특수 케이스

### 터치 디바이스
```scss
.button {
  @include touch {
    min-height: $touch-target-min; // 44px
  }
}
```

### 화면 방향
```scss
.video-player {
  @include landscape {
    height: 100vh;
  }
  
  @include portrait {
    height: 50vh;
  }
}
```

### 고해상도 디스플레이
```scss
.logo {
  background-image: url('logo.png');
  
  @include retina {
    background-image: url('logo@2x.png');
  }
}
```

## 8. 테스트 체크리스트

- [ ] 320px (모바일 S)
- [ ] 375px (모바일 M)
- [ ] 425px (모바일 L)
- [ ] 576px (브레이크포인트 sm)
- [ ] 768px (브레이크포인트 md)
- [ ] 1024px (브레이크포인트 lg)
- [ ] 1280px (브레이크포인트 xl)
- [ ] 1536px (브레이크포인트 2xl)
- [ ] 1920px (Full HD)

## 9. 성능 최적화

### 불필요한 미디어 쿼리 통합
```scss
// ❌ Before
@media (max-width: 768px) {
  .header { padding: 10px; }
}
@media (max-width: 768px) {
  .footer { padding: 10px; }
}

// ✅ After
@include mobile {
  .header,
  .footer {
    padding: $spacing-sm;
  }
}
```

### 미디어 쿼리 그룹화
```scss
// 컴포넌트별로 미디어 쿼리 그룹화
.component {
  // 모든 기본 스타일
  
  // 모든 태블릿 스타일
  @include tablet {
    // ...
  }
  
  // 모든 데스크톱 스타일
  @include desktop {
    // ...
  }
}
```

## 10. 마이그레이션 우선순위

1. **높음**: 주요 레이아웃 컴포넌트
   - Header, Navigation, Footer
   - Grid 시스템
   - Container

2. **중간**: 페이지별 스타일
   - Home 페이지
   - 피드백 페이지
   - 프로젝트 관리 페이지

3. **낮음**: 유틸리티 및 헬퍼
   - 스페이싱 유틸리티
   - 텍스트 유틸리티
   - 숨김/표시 클래스