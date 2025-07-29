# !important 제거 및 스타일 우선순위 가이드

## 1. !important 사용 현황

### 통계
- 총 !important 사용: 202개
- 가장 많이 사용된 파일:
  - FeedbackSectionRedesign.scss: 224개
  - FeedbackPageFix.scss: 154개
  - ButtonAlignment.scss: 92개

### 주요 사용 패턴
1. **레이아웃 강제**: display, position, width/height
2. **스타일 덮어쓰기**: 서드파티 라이브러리 스타일 오버라이드
3. **긴급 수정**: 빠른 버그 수정을 위한 임시 사용
4. **전역 리셋**: pointer-events, user-select 등

## 2. !important를 제거하는 방법

### 방법 1: CSS 특정성(Specificity) 활용

```scss
// ❌ Bad: !important 사용
.button {
  background: #1631F8 !important;
}

// ✅ Good: 더 구체적인 선택자 사용
.page-wrapper .content-area .button {
  background: $color-primary;
}

// ✅ Better: CSS Modules 사용
.button {
  background: $color-primary;
  
  :global(.third-party-class) & {
    background: $color-primary;
  }
}
```

### 방법 2: 캐스케이드 순서 활용

```scss
// ❌ Bad: !important로 덮어쓰기
.modal {
  z-index: 9999 !important;
}

// ✅ Good: 나중에 선언하여 우선순위 확보
.base-modal {
  z-index: 1000;
}

// 이 스타일이 나중에 로드되도록 보장
.custom-modal {
  z-index: 1050;
}
```

### 방법 3: CSS 변수로 동적 제어

```scss
// ❌ Bad: 여러 !important 사용
.theme-dark .button {
  background: #000 !important;
  color: #fff !important;
}

// ✅ Good: CSS 변수 사용
.button {
  background: var(--button-bg, $color-primary);
  color: var(--button-color, white);
}

.theme-dark {
  --button-bg: #000;
  --button-color: #fff;
}
```

### 방법 4: 스타일 격리

```scss
// ❌ Bad: 전역 선택자 + !important
* {
  box-sizing: border-box !important;
}

// ✅ Good: 스코프 제한
.app-container {
  *, *::before, *::after {
    box-sizing: border-box;
  }
}
```

## 3. 일반적인 패턴별 해결책

### 패턴 1: 입력 요소 스타일링

```scss
// ❌ 기존 코드
input {
  pointer-events: auto !important;
  user-select: auto !important;
  cursor: auto !important;
}

// ✅ 개선된 코드
// 1. 더 구체적인 선택자 사용
.form-container input:not([disabled]) {
  pointer-events: auto;
  user-select: auto;
  cursor: text;
}

// 2. 속성 선택자 활용
input[type="text"],
input[type="email"] {
  @include form-input-reset;
}

// 3. 믹스인으로 일관성 확보
@mixin form-input-reset {
  pointer-events: auto;
  user-select: auto;
  cursor: text;
  
  &:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: $opacity-disabled;
  }
}
```

### 패턴 2: 레이아웃 수정

```scss
// ❌ 기존 코드
.modal {
  position: fixed !important;
  z-index: 9999 !important;
  top: 0 !important;
  left: 0 !important;
}

// ✅ 개선된 코드
// 1. 격리된 컨텍스트 생성
.modal-root {
  position: fixed;
  z-index: $z-modal;
  inset: 0;
  
  .modal {
    position: absolute;
    // 자연스럽게 부모의 z-index 상속
  }
}

// 2. CSS 격리 속성 사용
.modal {
  isolation: isolate;
  position: fixed;
  z-index: $z-modal;
}
```

### 패턴 3: 서드파티 라이브러리 오버라이드

```scss
// ❌ 기존 코드
.video-js .vjs-control-bar {
  height: 48px !important;
  background: rgba(0,0,0,0.8) !important;
}

// ✅ 개선된 코드
// 1. 더 구체적인 선택자
.app-video-player {
  .video-js {
    .vjs-control-bar {
      height: 48px;
      background: rgba(0,0,0,0.8);
    }
  }
}

// 2. :where() 사용으로 특정성 제어
:where(.video-js) .vjs-control-bar {
  height: 48px;
  background: rgba(0,0,0,0.8);
}

// 3. 커스텀 속성 추가
.video-player[data-custom-controls] {
  .vjs-control-bar {
    height: 48px;
    background: rgba(0,0,0,0.8);
  }
}
```

## 4. 실제 마이그레이션 예시

### ButtonAlignment.scss 개선

```scss
// ❌ 기존 코드 (92개 !important)
button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

// ✅ 개선된 코드
// 1. 기본 스타일 정의
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

// 2. 컴포넌트별 적용
.app-button {
  @include button-base;
}

// 3. 전역 버튼 스타일 (필요한 경우)
.app-container {
  button:not([class*="third-party"]) {
    @include button-base;
  }
}
```

## 5. 우선순위 계산

### CSS 특정성 점수
- 인라인 스타일: 1000점
- ID 선택자: 100점
- 클래스/속성/가상클래스: 10점
- 요소 선택자: 1점

### 예시
```scss
// 특정성: 1점
button { }

// 특정성: 10점
.button { }

// 특정성: 11점
button.primary { }

// 특정성: 21점
.container .button.primary { }

// 특정성: 111점
#app button.primary { }
```

## 6. 마이그레이션 체크리스트

### 단계별 진행
1. [ ] !important 사용 파일 목록 작성
2. [ ] 사용 패턴별 분류
3. [ ] 대체 방법 결정
4. [ ] 테스트 환경에서 제거
5. [ ] 시각적 회귀 테스트
6. [ ] 프로덕션 배포

### 파일별 진행상황
- [ ] FeedbackSectionRedesign.scss (224개)
- [ ] FeedbackPageFix.scss (154개)
- [ ] ButtonAlignment.scss (92개)
- [ ] ShareDeleteFix.scss (75개)
- [ ] InputActivationFix.scss (56개)

## 7. 예외 상황

### !important 사용이 허용되는 경우
1. **유틸리티 클래스**: `.hidden { display: none !important; }`
2. **접근성**: 스크린 리더 전용 스타일
3. **임시 핫픽스**: 긴급 버그 수정 (추후 제거 필수)
4. **서드파티 강제 오버라이드**: 다른 방법이 없는 경우

### 유틸리티 클래스 예시
```scss
// 허용되는 유틸리티 클래스
.u-hidden {
  display: none !important;
}

.u-sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
```

## 8. 도구 및 자동화

### ESLint/Stylelint 규칙
```json
{
  "rules": {
    "declaration-no-important": [true, {
      "severity": "warning"
    }]
  }
}
```

### 검색 및 치환 정규식
```bash
# !important 찾기
grep -r "!important" src/**/*.scss

# 개수 세기
grep -c "!important" src/**/*.scss | sort -t: -k2 -rn

# 특정 속성의 !important 찾기
grep -E "(display|position|width|height).*!important" src/**/*.scss
```

## 9. 성과 측정

### Before
- !important 사용: 202개
- 스타일 충돌: 빈번
- 유지보수성: 낮음

### After (목표)
- !important 사용: 20개 이하 (유틸리티만)
- 스타일 충돌: 최소화
- 유지보수성: 크게 향상
- 코드 가독성: 개선