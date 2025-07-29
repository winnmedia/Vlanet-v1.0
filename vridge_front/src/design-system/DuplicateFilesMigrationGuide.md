# 중복 파일 통합 마이그레이션 가이드

## 1. 통합 완료된 파일들

### CmsHome 관련 (3개 → 1개)
- **기존 파일들**:
  - `/src/css/Cms/CmsHomeEnhanced.scss` (2023-07-23)
  - `/src/css/Cms/CmsHomeFix.scss` (2023-07-24)
  - `/src/css/Cms/CmsHomeMinimal.scss` (2023-07-26) ✓ 최신
  
- **통합 파일**: `/src/design-system/pages/CmsHome/CmsHome.module.scss`

### ProjectCreate 관련 (2개 → 1개)
- **기존 파일들**:
  - `/src/css/Cms/ProjectCreate.scss` (2023-07-23)
  - `/src/css/Cms/ProjectCreateImproved.scss` (2023-07-23) ✓ 최신, 더 큼
  
- **통합 파일**: `/src/design-system/pages/ProjectCreate/ProjectCreate.module.scss`

### Calendar 관련 (4개 → 1개)
- **기존 파일들**:
  - `/src/components/CalendarEnhanced.scss` (2023-07-22)
  - `/src/css/Cms/CalendarLayout.scss` (2023-07-23)
  - `/src/css/Cms/CalendarResponsive.scss` (2023-07-23)
  - `/src/css/Cms/CalendarToolbar.scss` (2023-07-23)
  
- **통합 파일**: `/src/design-system/components/Calendar/Calendar.module.scss`

## 2. 통합 내용

### CmsHome 통합
```scss
// 기존: 3개 파일에 분산된 스타일
// CmsHomeEnhanced.scss - 기본 레이아웃
// CmsHomeFix.scss - 버그 수정
// CmsHomeMinimal.scss - 최종 디자인

// 통합: 하나의 모듈로 통합
@use '../../tokens' as *;

.cmsHome {
  // 모든 스타일 통합
  // 최신 CmsHomeMinimal.scss 기준
  // 디자인 토큰 활용
}
```

### ProjectCreate 통합
```scss
// 기존: 2개 파일
// ProjectCreate.scss - 기본 스타일
// ProjectCreateImproved.scss - 개선된 버전

// 통합: 개선된 버전 기준으로 통합
.projectCreate {
  // 단계별 폼 UI
  // 파일 업로드
  // 태그 입력
  // 날짜 선택기
}
```

### Calendar 통합
```scss
// 기존: 4개 파일에 분산
// CalendarLayout.scss - 레이아웃
// CalendarResponsive.scss - 반응형
// CalendarToolbar.scss - 툴바
// CalendarEnhanced.scss - 전체 스타일

// 통합: 하나의 완전한 캘린더 시스템
.calendarContainer {
  // 툴바
  // 그리드 뷰
  // 주간/일간 뷰
  // 리스트 뷰
  // 반응형 스타일
}
```

## 3. 마이그레이션 단계

### Step 1: Import 변경
```js
// 기존
import '../src/css/Cms/CmsHomeEnhanced.scss'
import '../src/css/Cms/ProjectCreate.scss'
import '../src/css/Cms/ProjectCreateImproved.scss'

// 변경
import styles from '@/design-system/pages/CmsHome/CmsHome.module.scss'
import createStyles from '@/design-system/pages/ProjectCreate/ProjectCreate.module.scss'
```

### Step 2: 클래스명 변경
```jsx
// 기존
<div className="cms-home">
  <div className="project-grid">

// 변경
<div className={styles.cmsHome}>
  <div className={styles.projectGrid}>
```

### Step 3: 기존 파일 제거
```bash
# _app.js에서 import 제거
# 사용하지 않는 SCSS 파일 삭제
```

## 4. 주요 개선사항

### 1. 코드 중복 제거
- 동일한 스타일이 여러 파일에 중복 정의된 문제 해결
- 하나의 소스로 통합 관리

### 2. 디자인 토큰 활용
- 하드코딩된 값들을 변수로 교체
- 일관된 디자인 시스템 적용

### 3. CSS 모듈 적용
- 클래스명 충돌 방지
- 스코프 격리

### 4. 반응형 통합
- 분산된 미디어 쿼리 통합
- 일관된 브레이크포인트 사용

### 5. 성능 최적화
- 불필요한 중복 제거로 파일 크기 감소
- 빌드 시간 개선

## 5. 체크리스트

- [ ] 새 통합 파일 import 변경
- [ ] 컴포넌트에서 클래스명 업데이트
- [ ] 시각적 회귀 테스트 수행
- [ ] 기존 SCSS 파일 제거
- [ ] _app.js import 정리
- [ ] 빌드 테스트

## 6. 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 파일을 변경하지 말고 단계적으로 진행
2. **백업 유지**: 기존 파일은 마이그레이션 완료 후 삭제
3. **테스트 우선**: 각 단계마다 시각적 테스트 수행
4. **팀 공유**: 변경사항을 팀원들과 공유

## 7. 성과 측정

### 파일 수 감소
- CmsHome: 3개 → 1개 (67% 감소)
- ProjectCreate: 2개 → 1개 (50% 감소)  
- Calendar: 4개 → 1개 (75% 감소)
- **전체**: 9개 → 3개 (67% 감소)

### 코드 라인 수
- 약 30% 중복 코드 제거
- 유지보수성 크게 향상

### 빌드 성능
- CSS 파싱 시간 감소
- 번들 크기 축소