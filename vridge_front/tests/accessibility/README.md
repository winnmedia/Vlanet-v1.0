# VideoPlanet 접근성 테스트 가이드

## 개요
이 디렉토리에는 VideoPlanet의 웹 접근성을 검증하는 자동화된 테스트들이 포함되어 있습니다.
모든 테스트는 WCAG 2.1 Level AA 기준을 준수하도록 설계되었습니다.

## 테스트 구성

### 1. WCAG 준수 테스트 (`wcag-compliance.spec.ts`)
- **목적**: 전체 페이지의 WCAG 2.1 Level A 및 AA 준수 검증
- **검증 항목**:
  - 색상 대비 (4.5:1 이상)
  - 키보드 접근성
  - 이미지 대체 텍스트
  - 폼 레이블
  - 헤딩 구조
  - 랜드마크 영역
- **실행**: `npm run test:a11y -- wcag-compliance`

### 2. 모바일 접근성 (`mobile-accessibility.spec.ts`)
- **목적**: 모바일 환경에서의 접근성 검증
- **검증 항목**:
  - 터치 타겟 크기 (최소 44x44px)
  - 터치 타겟 간격 (최소 8px)
  - 가로 스크롤 방지
  - 모바일 키보드 최적화
  - 제스처 대체 수단
- **실행**: `npm run test:a11y -- mobile-accessibility`

### 3. 폼 접근성 (`form-accessibility.spec.ts`)
- **목적**: 입력 폼의 접근성 검증
- **검증 항목**:
  - 레이블과 입력 필드 연결
  - 필수 필드 표시
  - 에러 메시지 접근성
  - 키보드 네비게이션
  - 자동완성 속성
- **실행**: `npm run test:a11y -- form-accessibility`

### 4. ARIA 준수 (`aria-compliance.spec.ts`)
- **목적**: WAI-ARIA 1.1 명세 준수 검증
- **검증 항목**:
  - ARIA 역할 올바른 사용
  - 필수 ARIA 속성
  - 라이브 영역
  - 모달/다이얼로그 접근성
  - 확장/축소 컨트롤
- **실행**: `npm run test:a11y -- aria-compliance`

## 테스트 실행 방법

### 전체 접근성 테스트 실행
```bash
npm run test:a11y
```

### 특정 테스트만 실행
```bash
npm run test:a11y -- [테스트파일명]
```

### 테스트 리포트 보기
```bash
npm run test:report
```

## 주요 검증 기준

### WCAG 2.1 Level AA
1. **인식의 용이성 (Perceivable)**
   - 텍스트 대비 비율 4.5:1 이상
   - 큰 텍스트는 3:1 이상
   - 모든 이미지에 대체 텍스트 제공

2. **운용의 용이성 (Operable)**
   - 모든 기능 키보드로 접근 가능
   - 충분한 시간 제공
   - 발작 유발 콘텐츠 없음

3. **이해의 용이성 (Understandable)**
   - 읽기 쉬운 텍스트
   - 예측 가능한 기능
   - 입력 도움 제공

4. **견고성 (Robust)**
   - 유효한 HTML
   - ARIA 올바른 사용
   - 다양한 보조기술 지원

### 모바일 접근성
- 터치 타겟: 44x44px 이상
- 터치 타겟 간격: 8px 이상
- 핀치 줌 허용
- 가로 스크롤 방지

## 문제 해결

### 테스트 실패 시
1. 테스트 리포트에서 상세 정보 확인
2. 브라우저 개발자 도구의 접근성 검사 활용
3. 스크린리더로 실제 테스트

### 일반적인 수정 방법

#### 색상 대비 부족
```scss
// 변경 전
color: #666; // 대비 비율 3.2:1

// 변경 후  
color: #595959; // 대비 비율 4.5:1
```

#### 터치 타겟 크기
```scss
// 변경 전
.button {
  padding: 8px 12px; // 32x36px
}

// 변경 후
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px 16px;
}
```

#### 폼 레이블
```jsx
// 변경 전
<input type="email" placeholder="이메일" />

// 변경 후
<label htmlFor="email">이메일</label>
<input id="email" type="email" />
```

## 지속적인 개선

1. **정기 검사**: 매주 자동 테스트 실행
2. **수동 테스트**: 분기별 스크린리더 테스트
3. **사용자 피드백**: 접근성 이슈 즉시 대응
4. **교육**: 팀원 접근성 인식 제고

## 참고 자료
- [WCAG 2.1 한국어](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA 1.1](https://www.w3.org/TR/wai-aria-1.1/)
- [모바일 접근성 가이드](https://www.w3.org/WAI/standards-guidelines/mobile/)