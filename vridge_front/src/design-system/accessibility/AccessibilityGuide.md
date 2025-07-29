# VideoPlanet 접근성 가이드

## 개요
이 가이드는 WCAG 2.1 AA 기준을 준수하는 접근성 높은 웹 애플리케이션을 만들기 위한 지침입니다.

## 1. 접근성 스타일 시스템 구조

```
accessibility/
├── _index.scss           # 모든 접근성 스타일 통합
├── _focus-indicators.scss # 포커스 표시 스타일
├── _screen-reader.scss    # 스크린 리더 지원
├── _keyboard-navigation.scss # 키보드 네비게이션
├── _color-contrast.scss   # 색상 대비
├── _touch-targets.scss    # 터치 타겟 크기
├── _aria-patterns.scss    # ARIA 패턴 스타일
└── _reduced-motion.scss   # 모션 감소 설정
```

## 2. 포커스 인디케이터

### 기본 사용법
```scss
// 자동으로 모든 포커스 가능한 요소에 적용됨
:focus-visible {
  outline: 2px solid $color-primary;
  outline-offset: 2px;
}

// 커스텀 포커스 스타일
.custom-element {
  @include focus-ring($color-primary, 2px, 2px);
}

// 그림자 스타일 포커스
.button {
  @include focus-shadow($color-primary, 3px);
}
```

### 컴포넌트별 포커스
- **버튼**: 그림자 스타일 (3px spread)
- **링크**: 아웃라인 + 밑줄
- **입력 필드**: 그림자 + 테두리 색상 변경
- **탭**: 하단 보더 + 배경색

## 3. 스크린 리더 지원

### 시각적으로 숨기기
```html
<!-- 스크린 리더만 읽는 텍스트 -->
<span class="sr-only">추가 정보</span>

<!-- 포커스 시 보이는 스킵 링크 -->
<a href="#main" class="sr-only-focusable">주 콘텐츠로 건너뛰기</a>
```

### ARIA 라벨링
```html
<!-- 필수 필드 -->
<input aria-required="true" aria-describedby="email-error">
<span id="email-error" class="error-message">올바른 이메일을 입력하세요</span>

<!-- 라이브 리전 -->
<div aria-live="polite" aria-atomic="true">
  <p>3개 항목이 추가되었습니다</p>
</div>
```

## 4. 키보드 네비게이션

### 탭 인덱스 관리
```html
<!-- 포커스 가능 -->
<div tabindex="0" role="button">클릭 가능</div>

<!-- 프로그래밍적으로만 포커스 -->
<div tabindex="-1" id="error-summary">오류 요약</div>

<!-- 스킵 네비게이션 -->
<nav class="skip-links">
  <a href="#main">주 콘텐츠로</a>
  <a href="#nav">네비게이션으로</a>
  <a href="#footer">푸터로</a>
</nav>
```

### 키보드 단축키
```html
<!-- 단축키 표시 -->
<button>
  저장
  <span class="keyboard-shortcut">
    <kbd>Ctrl</kbd>+<kbd>S</kbd>
  </span>
</button>

<!-- 접근 키 -->
<button accesskey="s">저장</button>
```

## 5. 색상 대비

### 최소 대비율
- **일반 텍스트**: 4.5:1 이상
- **큰 텍스트** (18pt/24px 또는 14pt/18.66px bold): 3:1 이상
- **UI 컴포넌트**: 3:1 이상

### 사용 예시
```scss
// 대비 보장 믹스인
.dynamic-bg {
  @include ensure-contrast($bg-color);
}

// 고대비 모드
@media (prefers-contrast: high) {
  // 자동으로 색상 강화
}
```

## 6. 터치 타겟

### 최소 크기
- **iOS**: 44x44px
- **Android**: 48x48dp
- **권장**: 48x48px

### 구현 방법
```scss
// 기본 터치 타겟
button {
  @include touch-target(44px);
}

// 작은 시각적 요소의 터치 영역 확장
.small-icon {
  @include touch-target-expand(20px, 44px);
}
```

## 7. ARIA 패턴

### 다이얼로그
```html
<div role="dialog" 
     aria-labelledby="dialog-title" 
     aria-describedby="dialog-desc"
     aria-modal="true">
  <h2 id="dialog-title">제목</h2>
  <p id="dialog-desc">설명</p>
</div>
```

### 탭 패널
```html
<div role="tablist" aria-label="설정">
  <button role="tab" aria-selected="true" aria-controls="panel1">일반</button>
  <button role="tab" aria-selected="false" aria-controls="panel2">고급</button>
</div>
<div role="tabpanel" id="panel1" aria-labelledby="tab1">...</div>
```

### 메뉴
```html
<ul role="menu" aria-label="파일 메뉴">
  <li role="menuitem">새 파일</li>
  <li role="menuitem" aria-disabled="true">저장</li>
  <li role="separator"></li>
  <li role="menuitem">종료</li>
</ul>
```

## 8. 모션 감소

### 자동 적용
```scss
// 사용자가 모션 감소를 선호하면 자동으로 적용
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 선택적 모션
```scss
// 모션이 안전한 경우에만 적용
.button {
  @include motion-safe(transform, 0.2s);
  
  &:hover {
    @media (prefers-reduced-motion: no-preference) {
      transform: translateY(-2px);
    }
  }
}
```

## 9. 체크리스트

### 개발 시 확인사항
- [ ] 모든 인터랙티브 요소가 키보드로 접근 가능한가?
- [ ] 포커스 순서가 논리적인가?
- [ ] 포커스 인디케이터가 명확하게 보이는가?
- [ ] 색상만으로 정보를 전달하지 않는가?
- [ ] 텍스트와 배경의 대비가 충분한가?
- [ ] 터치 타겟이 44px 이상인가?
- [ ] 스크린 리더가 모든 콘텐츠를 읽을 수 있는가?
- [ ] 적절한 ARIA 속성을 사용했는가?
- [ ] 모션을 비활성화해도 사용 가능한가?

### 테스트 도구
1. **스크린 리더**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
   - TalkBack (Android)

2. **브라우저 확장**
   - axe DevTools
   - WAVE
   - Lighthouse

3. **색상 대비**
   - WebAIM Contrast Checker
   - Stark (Figma 플러그인)

## 10. 코드 예시

### 접근성 높은 버튼
```html
<button 
  class="button button-primary"
  aria-label="프로젝트 저장"
  aria-describedby="save-help">
  <span class="icon" aria-hidden="true">💾</span>
  저장
</button>
<span id="save-help" class="sr-only">
  Ctrl+S를 눌러 저장할 수도 있습니다
</span>
```

### 접근성 높은 폼
```html
<form>
  <div class="form-group">
    <label for="email">
      이메일
      <span class="required-indicator">
        <span aria-label="필수">*</span>
      </span>
    </label>
    <input 
      type="email" 
      id="email"
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-help email-error">
    <span id="email-help" class="help-text">
      회사 이메일을 입력하세요
    </span>
    <span id="email-error" class="error-message" role="alert">
      <!-- 에러 발생 시 표시 -->
    </span>
  </div>
</form>
```

### 접근성 높은 모달
```html
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  class="modal">
  <div class="modal-content">
    <h2 id="modal-title">확인</h2>
    <button 
      class="modal-close"
      aria-label="닫기">
      ✕
    </button>
    <div class="modal-body">
      <p>정말 삭제하시겠습니까?</p>
    </div>
    <div class="modal-footer">
      <button class="button button-danger">삭제</button>
      <button class="button button-secondary">취소</button>
    </div>
  </div>
</div>
```

## 11. 일반적인 실수와 해결책

### 실수 1: 색상만으로 상태 표시
```scss
// ❌ 나쁜 예
.status-error { color: red; }

// ✅ 좋은 예
.status-error {
  color: $color-danger;
  &::before { content: '❌ '; }
}
```

### 실수 2: 작은 클릭 영역
```scss
// ❌ 나쁜 예
.icon-button {
  width: 20px;
  height: 20px;
}

// ✅ 좋은 예
.icon-button {
  @include touch-target-expand(20px, 44px);
}
```

### 실수 3: 포커스 제거
```scss
// ❌ 나쁜 예
:focus { outline: none; }

// ✅ 좋은 예
:focus:not(:focus-visible) { outline: none; }
:focus-visible { @include focus-ring; }
```

## 12. 추가 리소스

- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA 작성 실습](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM 리소스](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)