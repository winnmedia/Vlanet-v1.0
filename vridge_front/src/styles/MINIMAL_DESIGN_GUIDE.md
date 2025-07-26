# VideoPlanet Minimal Design System v3.0

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."  
> — Antoine de Saint-Exupéry

## 🎯 Design Philosophy

### Core Principles

1. **Reduction to Essence**: 본질만 남기고 모든 장식적 요소 제거
2. **Purposeful Whitespace**: 여백은 디자인의 일부, 숨 쉴 공간 제공
3. **Typography First**: 타이포그래피가 주인공, 색상은 조연
4. **Invisible Interactions**: 느껴지지 않을 정도로 자연스러운 인터랙션
5. **Monochrome + Accent**: 흑백 기반에 단 하나의 액센트 컬러

## 🎨 Color Palette (5 Colors Only)

```scss
// Core Colors
$white: #FFFFFF;    // 배경
$black: #000000;    // 주요 텍스트
$gray: #8B8B8D;     // 보조 텍스트
$blue: #0066FF;     // 액센트 (Apple Blue)
$red: #FF3B30;      // 오류 상태 (iOS Red)
```

### Usage Guidelines

- **Primary Text**: Black (#000000)
- **Secondary Text**: Gray (#8B8B8D)
- **Interactive Elements**: Blue (#0066FF)
- **Error States**: Red (#FF3B30)
- **Backgrounds**: White (#FFFFFF)
- **Borders**: rgba(0, 0, 0, 0.08) - 8% 불투명도

## 📝 Typography

### Font Stack
```scss
font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, 'Inter', sans-serif;
```

### Type Scale (Golden Ratio: 1.618)
```scss
$scale: (
  xs: 0.694rem,    // 11px - 캡션
  sm: 0.833rem,    // 13px - 보조 텍스트
  base: 1rem,      // 16px - 본문
  md: 1.2rem,      // 19px - 강조 본문
  lg: 1.44rem,     // 23px - 소제목
  xl: 1.728rem,    // 28px - 제목
  2xl: 2.074rem,   // 33px - 큰 제목
  3xl: 2.488rem,   // 40px - 히어로 텍스트
);
```

### Font Weights (3 Only)
```scss
$weight: (
  regular: 400,    // 본문
  medium: 500,     // 강조
  semibold: 600,   // 제목
);
```

### Line Heights (2 Only)
```scss
$leading: (
  tight: 1.2,      // 제목
  normal: 1.6,     // 본문
);
```

## 📐 Spacing System (8pt Grid)

```scss
$spacing: (
  0: 0,
  1: 0.5rem,    // 8px   - 최소 간격
  2: 1rem,      // 16px  - 기본 간격
  3: 1.5rem,    // 24px  - 중간 간격
  4: 2rem,      // 32px  - 큰 간격
  5: 2.5rem,    // 40px  
  6: 3rem,      // 48px  - 섹션 간격
  8: 4rem,      // 64px  
  10: 5rem,     // 80px  - 페이지 여백
  12: 6rem,     // 96px  
  16: 8rem,     // 128px - 히어로 섹션
);
```

## 🎭 Visual Style

### Borders
```scss
// Width
border-width: 1px;

// Color
border-color: rgba(0, 0, 0, 0.08);  // 8% 불투명도

// Radius
$radius: (
  sm: 6px,      // 작은 요소
  base: 8px,    // 기본값
  lg: 12px,     // 카드
  full: 9999px, // 원형
);
```

### Shadows (Minimal or None)
```scss
// 대부분의 경우 그림자 대신 미세한 보더 사용
box-shadow: none;

// 꼭 필요한 경우만
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
```

## 🎬 Animation

### Durations
```scss
$duration: (
  instant: 100ms,  // 즉각 반응
  fast: 200ms,     // 빠른 전환
  normal: 300ms,   // 일반 전환
  slow: 500ms,     // 느린 전환
);
```

### Easing (Apple Style)
```scss
$easing: (
  default: cubic-bezier(0.25, 0.46, 0.45, 0.94),
  out: cubic-bezier(0.215, 0.61, 0.355, 1),
  in: cubic-bezier(0.55, 0.055, 0.675, 0.19),
  inOut: cubic-bezier(0.645, 0.045, 0.355, 1),
);
```

## 🧩 Component Patterns

### Button
```scss
// Primary
.btn-primary {
  background: #0066FF;
  color: white;
  padding: 0 24px;
  height: 44px;  // Apple 표준
  border-radius: 8px;
  font-weight: 500;
  transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    background: darken(#0066FF, 8%);
    transform: translateY(-1px);
  }
}

// Secondary
.btn-secondary {
  background: transparent;
  color: black;
  border: 1px solid rgba(0, 0, 0, 0.08);
  
  &:hover {
    border-color: rgba(0, 0, 0, 0.16);
    background: rgba(0, 0, 0, 0.02);
  }
}

// Ghost
.btn-ghost {
  background: transparent;
  color: black;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
```

### Input
```scss
.input {
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px 0;
  font-size: 16px;
  transition: border-color 200ms;
  
  &:hover {
    border-color: rgba(0, 0, 0, 0.16);
  }
  
  &:focus {
    outline: none;
    border-color: #0066FF;
  }
}
```

### Card
```scss
.card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 32px;
  transition: border-color 300ms;
  
  &:hover {
    border-color: rgba(0, 0, 0, 0.12);
  }
}
```

## 💫 Micro-interactions

### Hover Lift
```scss
&:hover {
  transform: translateY(-2px);
}
```

### Press Effect
```scss
&:active {
  transform: scale(0.98);
}
```

### Fade In
```scss
animation: fadeIn 300ms cubic-bezier(0.215, 0.61, 0.355, 1);

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 📱 Responsive Design

### Breakpoints
```scss
$breakpoints: (
  sm: 640px,   // Mobile landscape
  md: 768px,   // Tablet
  lg: 1024px,  // Desktop
  xl: 1280px,  // Large desktop
);
```

## ✅ Implementation Checklist

1. **Color Usage**
   - [ ] 5색 이하 사용
   - [ ] 흑백 기반 디자인
   - [ ] 단일 액센트 컬러

2. **Typography**
   - [ ] SF Pro 또는 시스템 폰트
   - [ ] 3가지 이하 font-weight
   - [ ] 일관된 type scale

3. **Spacing**
   - [ ] 8pt 그리드 준수
   - [ ] 충분한 여백 확보
   - [ ] 일관된 간격 사용

4. **Visual Style**
   - [ ] 그림자 최소화
   - [ ] 미세한 보더 사용
   - [ ] 장식적 요소 제거

5. **Animation**
   - [ ] 200-300ms 전환
   - [ ] 자연스러운 easing
   - [ ] 목적 있는 모션

## 🚀 Getting Started

```scss
// 1. Import the minimal design system
@import 'styles/minimal-design-system';

// 2. Use the mixins
.my-button {
  @include button-minimal('primary');
}

.my-card {
  @include card-minimal;
}

.my-heading {
  @include heading('xl');
}

// 3. Apply utility classes
<div class="p-4 mb-3">
  <h1 class="text-2xl font-semibold mb-2">Title</h1>
  <p class="text-gray">Description</p>
</div>
```

## 📖 References

- **Apple Human Interface Guidelines**: 미니멀리즘의 정수
- **Linear Design**: 생산성 도구의 미학
- **Notion**: 깨끗하고 기능적인 UI
- **Dieter Rams**: 좋은 디자인의 10가지 원칙

---

**Version**: 3.0  
**Last Updated**: 2025-01-26  
**Design Lead**: Visu (비주)