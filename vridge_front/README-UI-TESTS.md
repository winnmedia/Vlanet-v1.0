# VideoPlanet UI 테스트 가이드

## 🎯 목표
실제 화면 기반 개발을 통해 코드와 UI의 일치를 보장하고, 모든 사용자가 접근 가능한 서비스를 만듭니다.

## 🛠 설치 및 설정

### 1. 의존성 설치
```bash
cd vridge_front
npm install
```

### 2. Playwright 브라우저 설치 (선택사항)
```bash
# 시스템 의존성 설치 (Linux/WSL)
sudo npx playwright install-deps

# 브라우저 설치
npx playwright install
```

## 🧪 테스트 실행

### 로컬 환경에서 실행

#### 모든 테스트 실행
```bash
npm run test:visual    # 시각적 회귀 테스트
npm run test:a11y      # 접근성 테스트
```

#### 스냅샷 업데이트
```bash
npm run test:update
```

#### UI 모드로 실행 (디버깅)
```bash
npm run test:ui
```

#### 간편 실행 스크립트
```bash
./run-visual-tests.sh
```

### CI/CD 환경

GitHub Actions를 통해 자동으로 실행됩니다:
- PR 생성 시: 변경된 UI 검증
- main 브랜치 머지 시: 전체 UI 검증

## 📋 테스트 구성

### 1. 시각적 회귀 테스트 (`tests/visual/`)
- **목적**: UI 변경사항 감지 및 디자인 일관성 유지
- **주요 테스트**:
  - `login.spec.ts`: 로그인 페이지
  - `cms-home.spec.ts`: 프로젝트 관리
  - `feedback.spec.ts`: 영상 피드백
  - `video-planning.spec.ts`: 영상기획

### 2. 접근성 테스트 (`tests/accessibility/`)
- **목적**: WCAG 2.1 AA 준수 검증
- **주요 테스트**:
  - `wcag-compliance.spec.ts`: WCAG 준수
  - `mobile-accessibility.spec.ts`: 모바일 접근성
  - `form-accessibility.spec.ts`: 폼 접근성
  - `aria-compliance.spec.ts`: ARIA 검증

## 🔍 테스트 결과 확인

### 리포트 보기
```bash
npm run test:report
```

### 실패한 스냅샷 확인
테스트 실패 시 생성되는 파일:
- `*-actual.png`: 실제 화면
- `*-expected.png`: 예상 화면
- `*-diff.png`: 차이점 표시

## 🚨 일반적인 문제 해결

### 1. 스타일 불일치
```scss
// ❌ 하드코딩된 값
.button {
  background: #1631F8;
  padding: 10px 16px;
}

// ✅ 디자인 토큰 사용
.button {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
}
```

### 2. 접근성 위반

#### 색상 대비 부족
```scss
// ❌ 대비 비율 3.2:1
color: #666;
background: #fff;

// ✅ 대비 비율 4.5:1
color: #595959;
background: #fff;
```

#### 터치 타겟 크기
```scss
// ❌ 너무 작은 버튼
.button {
  padding: 8px 12px; // 32x36px
}

// ✅ 최소 44x44px
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px 16px;
}
```

#### 폼 레이블
```jsx
// ❌ 레이블 없음
<input type="email" placeholder="이메일" />

// ✅ 명시적 레이블
<label htmlFor="email">이메일</label>
<input id="email" type="email" />
```

## 📈 지속적 개선

### 1. 테스트 추가
새로운 페이지나 컴포넌트 추가 시:
1. 시각적 테스트 작성
2. 접근성 테스트 추가
3. 스냅샷 생성

### 2. 정기 검사
- **주간**: 자동 테스트 실행
- **월간**: 수동 스크린리더 테스트
- **분기**: 사용자 피드백 반영

### 3. 팀 교육
- 접근성 가이드라인 공유
- 테스트 작성 방법 교육
- 베스트 프랙티스 문서화

## 🔗 참고 자료
- [Playwright 문서](https://playwright.dev)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [VideoPlanet 디자인 시스템](./styles/design-tokens.scss)

## 💡 팁
1. **개발 중 테스트**: 변경사항이 있을 때마다 테스트 실행
2. **PR 전 확인**: 모든 테스트 통과 확인
3. **스냅샷 업데이트**: 의도적인 UI 변경 시에만 업데이트
4. **접근성 우선**: 새 기능 추가 시 접근성 먼저 고려