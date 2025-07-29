# 안전한 UX/UI 리팩토링 계획

## 🎯 목표
기존 디자인과 레이아웃을 100% 유지하면서 코드 품질 개선

## 📋 리팩토링 원칙

### 1. 변경하지 않는 것
- ✅ 실제 렌더링되는 픽셀값
- ✅ 색상값 (단, 변수로만 치환)
- ✅ 레이아웃 구조
- ✅ 애니메이션 타이밍
- ✅ 반응형 브레이크포인트

### 2. 변경하는 것
- ❌ !important 제거 (우선순위로 대체)
- ❌ 하드코딩된 값 → 토큰 변수
- ❌ 중복 코드 → 통합
- ❌ 인라인 스타일 → CSS Modules

## 🔄 단계별 실행 계획

### Phase 1: 기준점 설정 (1일차)
1. Visual Regression 테스트 구축
2. 주요 페이지 스크린샷 저장
3. 컴포넌트 동작 테스트

### Phase 2: !important 제거 (2-3일차)
```scss
// Before
.button {
  background: blue !important;
}

// After  
.page-specific .button {
  background: blue; // 더 구체적인 선택자 사용
}
```

### Phase 3: 토큰 변환 (4-5일차)
```scss
// Before
padding: 24px;
color: #1631F8;

// After
padding: $spacing-2xl; // 24px와 동일
color: $color-primary; // #1631F8와 동일
```

### Phase 4: 중복 제거 (6-7일차)
- 동일한 스타일 통합
- 공통 믹스인 생성
- 모듈 경계 명확화

## 🛡️ 안전장치

### 1. 변경 전 체크리스트
- [ ] 현재 스타일 스크린샷 촬영
- [ ] 개발자 도구로 Computed Style 확인
- [ ] 영향받는 컴포넌트 목록 작성

### 2. 변경 후 검증
- [ ] Visual Regression 테스트 통과
- [ ] 브라우저 간 동작 확인
- [ ] 반응형 디자인 체크

### 3. 롤백 계획
```bash
# 문제 발생 시 즉시 롤백
git checkout HEAD~1 src/styles/
npm run test:visual
```

## 📊 진행 상황 추적

### 현재 상태
- !important 사용: 404개
- 하드코딩된 색상: 4,050개
- 하드코딩된 픽셀: 9,311개
- 중복 클래스: 763개

### 목표 (2주 후)
- !important 사용: 0개
- 하드코딩된 색상: < 100개
- 하드코딩된 픽셀: < 500개
- 중복 클래스: < 100개

## 🚀 즉시 시작 가능한 작업

### 1. FeedbackButtonStyles.module.scss 개선
```scss
// 198개 !important 제거 가능
// 방법: CSS Module의 고유성 활용
```

### 2. 색상 토큰화
```scss
// 브랜드 색상 우선 변환
#1631F8 → $color-primary
#dc3545 → $color-danger
```

### 3. 간격 토큰화
```scss
// 자주 사용되는 값부터
24px → $spacing-2xl
16px → $spacing-lg
8px → $spacing-sm
```

## ⚠️ 주의사항

1. **절대 건드리지 말 것**
   - 써드파티 라이브러리 스타일 오버라이드
   - 벤더 프리픽스
   - calc() 계산식

2. **신중히 접근할 것**
   - 미디어 쿼리 통합
   - z-index 재정렬
   - 애니메이션 최적화

3. **테스트 필수**
   - 모든 변경 후 스크린샷 비교
   - 실제 디바이스 테스트
   - 크로스 브라우저 확인