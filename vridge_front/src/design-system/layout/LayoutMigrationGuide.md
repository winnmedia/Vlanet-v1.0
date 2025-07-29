# 레이아웃 스타일 마이그레이션 가이드

## 1. 기존 스타일 → 새 디자인 시스템 매핑

### 레이아웃 파일 통합

| 기존 파일 | 새 파일 | 용도 |
|---------|--------|-----|
| HomeActivityLayout.scss | Layout.module.scss | 홈 액티비티 그리드 |
| HomeLayoutFix.scss | Layout.module.scss | 홈 페이지 레이아웃 |
| LayoutFix.scss | Layout.module.scss | 피드백 페이지 레이아웃 |
| CalendarLayout.scss | Layout.module.scss | 캘린더 레이아웃 |
| + 7개 추가 파일 | Layout.module.scss | 통합 레이아웃 시스템 |

### 컴포넌트 매핑

```jsx
// 기존 코드
<div className="CmsHome">
  <div className="home-content">
    <div className="home-header">...</div>
  </div>
</div>

// 새 코드
import { PageLayout, ContentArea } from '@/design-system/layout'

<PageLayout>
  <ContentArea>
    <div className={styles.homeHeader}>...</div>
  </ContentArea>
</PageLayout>
```

### 카드 컴포넌트

```jsx
// 기존 코드
<div className="activity-card">...</div>

// 새 코드
import { Card } from '@/design-system/layout'

<Card hoverable>
  ...
</Card>
```

### 그리드 시스템

```jsx
// 기존 코드
<div className="home-activity-grid">...</div>
<div className="projects-grid">...</div>

// 새 코드
import { Grid } from '@/design-system/layout'

<Grid variant="activity">...</Grid>
<Grid variant="projects">...</Grid>
```

### 피드백 레이아웃

```jsx
// 기존 코드
<div className="content feedback feedback_page">
  <div className="videobox">...</div>
  <div className="sidebox">...</div>
</div>

// 새 코드
import { FeedbackLayout, FeedbackSide } from '@/design-system/layout'

<FeedbackLayout
  videoSection={<VideoPlayer />}
  sideSection={
    <FeedbackSide
      title="피드백"
      tabs={<TabMenu />}
      content={<TabContent />}
    />
  }
/>
```

## 2. 주요 개선사항

### 통합된 변수 사용
- 모든 색상, 간격, 그림자 등이 design-tokens.scss에서 관리됨
- 하드코딩된 값 제거
- 일관된 디자인 시스템

### 반응형 개선
- 통일된 브레이크포인트
- 모바일 퍼스트 접근
- 터치 타겟 44px 보장

### 접근성 향상
- 시맨틱 HTML 구조
- ARIA 속성 지원
- 키보드 네비게이션

### 성능 최적화
- CSS 모듈로 스코프 격리
- 불필요한 !important 제거
- 중복 스타일 제거

## 3. 마이그레이션 단계

1. **Phase 1**: 새 레이아웃 컴포넌트 적용
   - PageLayout, Card, Grid 등 기본 컴포넌트 교체
   - 시각적 회귀 테스트

2. **Phase 2**: 특수 레이아웃 마이그레이션
   - FeedbackLayout 적용
   - StepIndicator, EmptyState 등 유틸리티 컴포넌트 사용

3. **Phase 3**: 기존 SCSS 파일 제거
   - 사용하지 않는 레이아웃 SCSS 파일 삭제
   - _app.js import 정리

## 4. 체크리스트

- [ ] 모든 페이지에서 새 레이아웃 컴포넌트 사용
- [ ] 반응형 동작 확인 (데스크톱, 태블릿, 모바일)
- [ ] 접근성 테스트 통과
- [ ] 시각적 회귀 테스트 통과
- [ ] 성능 지표 확인
- [ ] 기존 SCSS 파일 제거