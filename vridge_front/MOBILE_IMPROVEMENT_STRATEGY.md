# VideoPlanet 모바일 개선 전략 및 와이어프레임

**작성자**: Uxi (UX Researcher) & Fronty (Frontend Designer)
**작성일**: 2025-01-29
**목표**: 70% 모바일 이탈률을 20%로 감소

## Phase 1: 긴급 수정 (1주일)

### 1.1 Viewport 설정 및 기본 모바일 표준

```jsx
// pages/_document.js 수정
<Head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <meta name="theme-color" content="#1631F8" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="description" content="VideoPlanet - 영상 제작 프로젝트 관리 플랫폼" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/logo192.png" />
</Head>
```

### 1.2 모바일 브레이크포인트 통합

```scss
// src/styles/_mobile-mixins.scss
@mixin mobile {
  @media (max-width: 767px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 768px) and (max-width: 1023px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1024px) {
    @content;
  }
}

@mixin touch-device {
  @media (hover: none) and (pointer: coarse) {
    @content;
  }
}
```

## Phase 2: 핵심 페이지 모바일 최적화

### 2.1 로그인 페이지 와이어프레임

```
모바일 로그인 화면 (320px - 767px)
┌────────────────────────────────────────┐
│                                        │
│          [VideoPlanet Logo]            │ <- 120px height
│                                        │
├────────────────────────────────────────┤
│                                        │
│         회원가입하고 프로젝트를         │ <- 24px font
│           시작해보세요!              │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐  │
│  │ 이메일                           │  │ <- 48px height
│  └────────────────────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │ 비밀번호                  [표시] │  │ <- 48px height
│  └────────────────────────────────┘  │
│                                        │
│  [ ] 로그인 상태 유지                   │ <- 24px touch target
│                                        │
│  ┌────────────────────────────────┐  │
│  │         로그인하기               │  │ <- 48px height
│  └────────────────────────────────┘  │
│                                        │
│  ──────────── 또는 ─────────────  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │    [구글] 구글로 로그인        │  │ <- 48px height
│  └────────────────────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │   [카카오] 카카오로 로그인      │  │ <- 48px height
│  └────────────────────────────────┘  │
│                                        │
│         회원가입 | 비밀번호 찾기        │ <- 44px touch targets
│                                        │
└────────────────────────────────────────┘
```

### 2.2 피드백 페이지 모바일 와이어프레임

```
모바일 피드백 화면 (320px - 767px)
┌────────────────────────────────────────┐
│ ← 프로젝트명          [☰]          │ <- 56px fixed header
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐  │
│  │                                  │  │
│  │        Video Player              │  │ <- 16:9 ratio
│  │                                  │  │
│  │    [▶]  00:23 / 02:45          │  │
│  └────────────────────────────────┘  │
│                                        │
│  [📤] [🎥] [🔗] [📷]               │ <- 48px icon buttons
│                                        │
├────────────────────────────────────────┤
│                                        │
│  피드백 (3)                     [필터]│ <- Sticky section header
│                                        │
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 00:15 | 김민수                  │  │ <- Feedback card
│  │ 이 부분 효과음 추가 필요합니다    │  │
│  │ [👍] [👎] [💬]            [⋮]│  │
│  └────────────────────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │ 01:23 | 박지연 ⭐                │  │ <- Important feedback
│  │ 전체적인 톤 수정 부탁드려요     │  │
│  │ [👍] [👎] [💬]            [⋮]│  │
│  └────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘

[ + ] 피드백 추가                          <- Floating Action Button
```

### 2.3 홈 페이지 모바일 와이어프레임

```
모바일 홈 화면 (320px - 767px)
┌────────────────────────────────────────┐
│ [Logo]              [로그인] [☰]    │ <- 56px header
├────────────────────────────────────────┤
│                                        │
│       영상 프로젝트를                  │ <- Hero section
│       쉽고 빠르게 관리하세요           │     28px font
│                                        │
│       AI 기반 영상 기획부터            │
│       피드백 관리까지 한 번에         │
│                                        │
│       ┌──────────────────────┐      │
│       │  무료로 시작하기     │      │ <- 56px CTA
│       └──────────────────────┘      │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐  │
│  │          [📹]                   │  │ <- Feature card
│  │        AI 영상 기획               │  │
│  │   자동으로 스토리보드 생성      │  │
│  └────────────────────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │          [💬]                   │  │
│  │       실시간 피드백               │  │
│  │   팀원과 함께 소통하세요         │  │
│  └────────────────────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐  │
│  │          [📅]                   │  │
│  │      프로젝트 일정 관리           │  │
│  │   체계적인 일정 관리 도구       │  │
│  └────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

## Phase 3: 모바일 전용 컴포넌트

### 3.1 모바일 네비게이션 (Bottom Navigation)

```jsx
// src/components/mobile/BottomNav.jsx
const BottomNav = () => {
  return (
    <nav className={styles.bottomNav}>
      <NavItem icon="home" label="홈" to="/" />
      <NavItem icon="folder" label="프로젝트" to="/projects" />
      <NavItem icon="add" label="새 프로젝트" to="/create" primary />
      <NavItem icon="calendar" label="일정" to="/calendar" />
      <NavItem icon="user" label="내 정보" to="/mypage" />
    </nav>
  )
}
```

### 3.2 터치 최적화 버튼

```scss
// 모바일 터치 버튼 스타일
.touchButton {
  min-height: 44px;
  min-width: 44px;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-base;
  border-radius: $border-radius-md;
  transition: $transition-all;
  
  // 터치 기기에서 호버 효과 제거
  @include touch-device {
    &:hover {
      background-color: inherit;
    }
    
    &:active {
      transform: scale(0.98);
      background-color: rgba($color-primary, 0.1);
    }
  }
}
```

## Phase 4: 성능 최적화

### 4.1 이미지 최적화

```jsx
// src/components/OptimizedImage.jsx
const OptimizedImage = ({ src, alt, width, height }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(null)
  
  useEffect(() => {
    // WebP 지원 확인
    const webpSupport = checkWebPSupport()
    
    // 적절한 크기의 이미지 로드
    const devicePixelRatio = window.devicePixelRatio || 1
    const actualWidth = width * devicePixelRatio
    
    const optimizedSrc = getOptimizedImageUrl(src, {
      width: actualWidth,
      format: webpSupport ? 'webp' : 'auto',
      quality: 85
    })
    
    setCurrentSrc(optimizedSrc)
  }, [src, width])
  
  return (
    <div className={styles.imageWrapper}>
      {isLoading && <div className={styles.skeleton} />}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
```

### 4.2 코드 스플리팅

```javascript
// next.config.js 수정
module.exports = {
  // ... 기존 설정
  
  // 동적 import를 사용한 코드 스플리팅
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 공통 모듈
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          // 라이브러리
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([[\\/]|$)/
              )[1]
              return `lib.${packageName.replace('@', '')}`
            },
            priority: 10,
            minChunks: 1,
          },
        },
      }
    }
    return config
  },
}
```

## Phase 5: 테스트 시나리오

### 5.1 모바일 사용성 테스트 체크리스트

```
☐ Viewport 메타 태그 확인
☐ 모든 터치 타겟 44px 이상
☐ 텍스트 가독성 (14px 이상)
☐ 가로 스크롤 없음
☐ 폼 입력 시 화면 이동 없음
☐ 비디오 플레이어 반응형
☐ 이미지 로딩 성능
☐ 3G 네트워크에서 테스트
```

### 5.2 주요 사용자 시나리오

1. **로그인 시나리오**
   - 이메일/비밀번호 입력
   - 소셜 로그인
   - 자동 로그인

2. **비디오 피드백 시나리오**
   - 비디오 재생
   - 특정 시간 탭
   - 피드백 입력
   - 피드백 저장

3. **프로젝트 관리 시나리오**
   - 프로젝트 목록 보기
   - 프로젝트 상세 정보
   - 팀원 초대

## 결론

이 전략을 단계적으로 실행하면:
- **1개월 내**: 50% 이탈률 달성 가능
- **3개월 내**: 30% 이탈률 달성 가능
- **6개월 내**: 20% 이탈률 달성 가능

핵심은 **기본부터 충실히**하는 것입니다. Viewport 설정과 같은 기본적인 부분부터 시작하여 점진적으로 개선해 나가야 합니다.