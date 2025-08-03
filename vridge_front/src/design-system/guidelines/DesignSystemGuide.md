# VideoPlanet 디자인 시스템 가이드라인

## 📋 목차
1. [디자인 철학](#디자인-철학)
2. [색상 시스템](#색상-시스템)
3. [타이포그래피](#타이포그래피)
4. [간격 시스템](#간격-시스템)
5. [컴포넌트 가이드](#컴포넌트-가이드)
6. [레이아웃 패턴](#레이아웃-패턴)
7. [모바일 최적화](#모바일-최적화)
8. [접근성 가이드](#접근성-가이드)

---

## 🎨 디자인 철학

### 핵심 원칙
1. **시각적 일관성**: 모든 터치포인트에서 일관된 브랜드 경험
2. **직관적 사용성**: 복잡한 기능도 간단하게 접근 가능
3. **효율성 중심**: 사용자의 작업 효율을 10배 향상시키는 디자인
4. **감정적 연결**: 사용자가 즐겁게 사용할 수 있는 인터페이스

### 브랜드 키워드
- **Professional** (전문적인)
- **Efficient** (효율적인)
- **Innovative** (혁신적인)
- **Accessible** (접근 가능한)

---

## 🎨 색상 시스템

### 브랜드 색상
```scss
// Primary Colors
$brand-primary: #1631F8;     // VideoPlanet 메인 블루
$brand-primary-dark: #0F23C9; // 다크 버전
$brand-secondary: #6C5CE7;    // 보조 색상
$brand-accent: #00D4FF;       // 액센트 (하이라이트)
```

### 의미론적 색상 (Semantic Colors)
```scss
// Status Colors
$success: #10B981;    // 성공, 완료
$warning: #F59E0B;    // 경고, 주의
$error: #EF4444;      // 오류, 위험
$info: #3B82F6;       // 정보, 알림
```

### 프로젝트 단계별 색상
```scss
// Project Phase Colors
$phase-planning: #3B82F6;      // 기획 단계
$phase-production: #F59E0B;    // 제작 단계
$phase-post: #8B5CF6;          // 후반작업
$phase-review: #06B6D4;        // 검토 단계
$phase-completed: #10B981;     // 완료
$phase-hold: #6B7280;          // 보류
```

### 색상 사용 가이드

#### 1. 주요 액션 버튼
- **사용**: 로그인, 프로젝트 생성, 저장, 제출 등 핵심 액션
- **색상**: `$brand-primary` → `$brand-primary-dark` 그라데이션
- **예시**: "프로젝트 생성", "AI 기획안 생성", "저장하기"

#### 2. 위험한 액션 버튼
- **사용**: 삭제, 취소, 거부 등 신중해야 할 액션
- **색상**: `$error` 단색 또는 그라데이션
- **예시**: "프로젝트 삭제", "초기화", "거부"

#### 3. 보조 액션 버튼
- **사용**: 뒤로가기, 취소, 건너뛰기 등
- **색상**: 회색 계열 (#F3F4F6, #E5E7EB)
- **예시**: "이전 단계", "나중에", "취소"

---

## ✍️ 타이포그래피

### 폰트 패밀리
```scss
// Primary Font Stack
$font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

// Korean Font Support
$font-korean: "SUIT Variable", $font-primary;

// Display Font (영문 제목용)
$font-display: "Poppins", $font-primary;

// Monospace (코드, 시간 등)
$font-mono: "SF Mono", Monaco, Consolas, monospace;
```

### 타이포그래피 스케일

#### 제목 계층 구조
```scss
// Headings
$h1: 40px / 700 / -0.025em    // 페이지 최상위 제목
$h2: 32px / 700 / -0.025em    // 메인 섹션 제목
$h3: 24px / 600 / -0.025em    // 서브 섹션 제목
$h4: 20px / 600 / normal      // 카드 제목
$h5: 18px / 600 / normal      // 작은 섹션 제목
$h6: 16px / 600 / normal      // 최소 제목
```

#### 본문 및 UI 텍스트
```scss
// Body Text
$body-large: 18px / 400 / 1.5     // 중요한 본문
$body: 16px / 400 / 1.5           // 기본 본문
$body-small: 14px / 400 / 1.5     // 작은 본문

// UI Elements
$button: 14px / 600 / 0.025em     // 버튼 텍스트
$button-large: 16px / 600 / 0.025em // 큰 버튼
$label: 14px / 500 / normal       // 폼 라벨
$caption: 12px / 400 / 1.375      // 캡션, 설명
$metadata: 12px / 500 / 0.05em    // 날짜, 상태 등
```

### 타이포그래피 사용 예시

#### 페이지 제목
```jsx
<h1 className={styles.pageTitle}>
  프로젝트 대시보드
</h1>
// CSS: font-size: 40px; font-weight: 700; letter-spacing: -0.025em;
```

#### 프로젝트 카드 제목
```jsx
<h4 className={styles.projectTitle}>
  브랜드 소개 영상 제작
</h4>
// CSS: font-size: 20px; font-weight: 600;
```

---

## 📏 간격 시스템 (Spacing)

### 기본 간격 단위
```scss
// Base spacing unit: 4px
$space-1: 4px;      // 0.25rem
$space-2: 8px;      // 0.5rem
$space-3: 12px;     // 0.75rem
$space-4: 16px;     // 1rem
$space-5: 20px;     // 1.25rem
$space-6: 24px;     // 1.5rem
$space-8: 32px;     // 2rem
$space-10: 40px;    // 2.5rem
$space-12: 48px;    // 3rem
$space-16: 64px;    // 4rem
$space-20: 80px;    // 5rem
```

### 간격 사용 가이드

#### 컴포넌트 내부 간격 (Padding)
- **버튼**: 12px 24px (작은 버튼), 16px 32px (큰 버튼)
- **카드**: 20px 24px (모바일), 24px 32px (데스크톱)
- **폼 필드**: 16px (모든 방향)
- **모달**: 24px (내부 패딩)

#### 컴포넌트 간 간격 (Margin)
- **섹션 간**: 48px (데스크톱), 32px (모바일)
- **카드 간**: 16px (기본), 24px (넓은 간격)
- **폼 필드 간**: 16px (기본), 24px (그룹 간)
- **버튼 간**: 12px (작은 간격), 16px (기본)

---

## 🧩 컴포넌트 가이드

### 1. 버튼 컴포넌트

#### 주요 액션 버튼
```jsx
<button className={styles.primaryButton}>
  프로젝트 생성하기
</button>
```
```scss
.primaryButton {
  background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 49, 248, 0.3);
  }
}
```

#### 위험 액션 버튼
```jsx
<button className={styles.dangerButton}>
  프로젝트 삭제
</button>
```
```scss
.dangerButton {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
}
```

### 2. 카드 컴포넌트

#### 프로젝트 카드
```jsx
<div className={styles.projectCard}>
  <div className={styles.cardHeader}>
    <h3 className={styles.cardTitle}>프로젝트 제목</h3>
    <span className={styles.statusBadge}>진행 중</span>
  </div>
  <div className={styles.cardBody}>
    <p className={styles.cardDescription}>프로젝트 설명...</p>
  </div>
  <div className={styles.cardFooter}>
    <div className={styles.cardMeta}>마감: 2024-02-15</div>
    <div className={styles.cardActions}>
      <button className={styles.cardButton}>열기</button>
    </div>
  </div>
</div>
```

```scss
.projectCard {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #E5E7EB;
  }
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #F3F4F6;
}

.cardTitle {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.statusBadge {
  background: #DBEAFE;
  color: #1E40AF;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
```

### 3. 폼 컴포넌트

#### 입력 필드
```jsx
<div className={styles.formField}>
  <label className={styles.fieldLabel}>프로젝트 이름</label>
  <input 
    type="text" 
    className={styles.textInput}
    placeholder="예: 브랜드 소개 영상"
  />
</div>
```

```scss
.formField {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.fieldLabel {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.textInput {
  padding: 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #1631F8;
    box-shadow: 0 0 0 3px rgba(22, 49, 248, 0.1);
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
}
```

---

## 📱 레이아웃 패턴

### 1. 대시보드 레이아웃
```scss
.dashboardLayout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "sidebar footer";
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    grid-template-areas: 
      "header"
      "main"
      "navigation";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
}
```

### 2. 프로젝트 상세 레이아웃
```scss
.projectDetailLayout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  padding: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}
```

### 3. 모달 레이아웃
```scss
.modalLayout {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modalContent {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
  }
}
```

---

## 📱 모바일 최적화

### Touch Target 크기
- **최소 크기**: 44px × 44px (Apple 가이드라인)
- **권장 크기**: 48px × 48px (Material Design)
- **버튼 간 간격**: 최소 8px

### 모바일 타이포그래피
```scss
// 모바일에서 폰트 크기 조정
@media (max-width: 768px) {
  .pageTitle { font-size: 28px; }      // 40px → 28px
  .sectionTitle { font-size: 20px; }   // 24px → 20px
  .cardTitle { font-size: 18px; }      // 20px → 18px
}
```

### 모바일 간격 조정
```scss
@media (max-width: 768px) {
  .section { padding: 16px; }          // 32px → 16px
  .card { padding: 16px 20px; }       // 24px 32px → 16px 20px
  .button { padding: 12px 20px; }     // 16px 24px → 12px 20px
}
```

---

## ♿ 접근성 가이드

### 색상 대비
- **AA 수준**: 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)
- **AAA 수준**: 7:1 (일반 텍스트), 4.5:1 (큰 텍스트)

### 키보드 접근성
```scss
// Focus 상태 스타일링
.focusable {
  &:focus {
    outline: 2px solid #1631F8;
    outline-offset: 2px;
  }
  
  &:focus:not(:focus-visible) {
    outline: none;
  }
}
```

### 스크린 리더 지원
```jsx
// ARIA 라벨 사용 예시
<button aria-label="프로젝트 삭제" className={styles.deleteButton}>
  🗑️
</button>

// Skip link 제공
<a href="#main-content" className={styles.skipLink}>
  메인 콘텐츠로 건너뛰기
</a>
```

---

## 🎯 성능 최적화

### CSS 최적화
- CSS-in-JS보다 CSS Modules 사용
- Critical CSS 인라인 로딩
- 불필요한 스타일 제거

### 이미지 최적화
- WebP 포맷 우선 사용
- 반응형 이미지 (srcset 활용)
- Lazy loading 적용

### 애니메이션 최적화
```scss
// GPU 가속 활용
.animated {
  transform: translateZ(0);
  will-change: transform;
}

// 60fps 애니메이션을 위한 속성만 사용
.smooth-animation {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
```

---

## 📝 컴포넌트 개발 체크리스트

### 개발 전 확인사항
- [ ] 디자인 시스템 색상 사용
- [ ] 타이포그래피 스케일 준수
- [ ] 간격 시스템 적용
- [ ] 모바일 반응형 고려

### 구현 중 확인사항
- [ ] 접근성 기준 충족
- [ ] 키보드 네비게이션 지원
- [ ] Touch 인터랙션 최적화
- [ ] 로딩 상태 처리

### 완료 후 확인사항
- [ ] 다양한 디바이스에서 테스트
- [ ] 스크린 리더 호환성 확인
- [ ] 성능 최적화 적용
- [ ] 문서화 완료

---

이 가이드라인을 통해 VideoPlanet의 모든 UI 컴포넌트가 일관되고 접근 가능하며 사용자 친화적인 경험을 제공할 수 있습니다.