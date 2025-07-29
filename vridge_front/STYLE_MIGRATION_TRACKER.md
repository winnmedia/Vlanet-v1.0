# 스타일 마이그레이션 트래커

## 진행 상황 대시보드

### 전체 진행률: 16.3% (23/141 파일)

```
전체: ████░░░░░░░░░░░░░░░░ 16.3%
버튼: ████████████████████ 100%
레이아웃: █████████░░░░░░░░░░░ 45%
피드백: ███░░░░░░░░░░░░░░░░░ 15%
```

## 마이그레이션 상태

### ✅ 완료 (23개)

#### 디자인 시스템 구축
- [x] `design-system/tokens/_colors.scss`
- [x] `design-system/tokens/_spacing.scss`
- [x] `design-system/tokens/_typography.scss`
- [x] `design-system/tokens/_effects.scss`
- [x] `design-system/tokens/_breakpoints.scss`

#### 버튼 시스템 (16→1)
- [x] `design-system/components/Button/Button.module.scss`
- [x] 통합된 파일들:
  - ButtonAlignment.scss
  - ButtonFix.scss
  - FeedbackButton.scss
  - 기타 13개 버튼 관련 파일

#### 레이아웃 시스템 (11→1)
- [x] `design-system/layout/Layout.module.scss`
- [x] 부분 통합된 파일들:
  - _layout.scss
  - LayoutFix.scss
  - HomeLayoutFix.scss
  - 기타 2개 파일

### 🔄 진행 중 (5개)

#### 피드백 페이지 (30→1)
- [ ] `design-system/pages/Feedback/Feedback.module.scss` (15% 완료)
- 통합 대상:
  - FeedbackPage.scss
  - FeedbackPageFix.scss
  - FeedbackPageRedesign.scss
  - FeedbackSectionRedesign.scss (224개 !important)
  - 기타 26개 파일

### ⏳ 대기 중 (113개)

#### 우선순위 높음 (다음 주)
1. **Home 페이지** (8개 파일)
   - Home.scss
   - HomeAlignment.scss
   - HomeEnhanced.scss
   
2. **CmsHome** (5개 파일)
   - CmsHome.scss
   - CmsHomeMinimal.scss
   - CmsHomeEnhanced.scss

3. **ProjectCreate** (4개 파일)
   - ProjectCreate.scss
   - ProjectCreateImproved.scss

#### 우선순위 중간 (2-3주)
- Calendar 관련 (6개)
- VideoPlanning 관련 (5개)
- OpinionInput 관련 (4개)
- Login/SignUp 관련 (6개)

#### 우선순위 낮음 (1개월 이후)
- Admin 페이지 (8개)
- 유틸리티 스타일 (15개)
- 레거시 스타일 (20개)

## 주요 문제 파일

### !important 최다 사용
1. 🔴 FeedbackSectionRedesign.scss (224개)
2. 🔴 FeedbackPageFix.scss (154개)
3. 🟡 ShareDeleteFix.scss (75개)
4. 🟡 InputActivationFix.scss (56개) → ✅ 개선 완료

### 하드코딩 최다
1. 🔴 Home.scss (색상 89개, 픽셀 156개)
2. 🔴 Cms.scss (색상 67개, 픽셀 134개)
3. 🟡 Calendar.scss (색상 45개, 픽셀 98개)

### 중복 최심각
1. 🔴 Button 관련 (16개) → ✅ 통합 완료
2. 🔴 Feedback 관련 (30개) → 🔄 진행 중
3. 🟡 Layout 관련 (11개) → ✅ 부분 완료

## 이번 주 목표 (2025-01-28 ~ 2025-02-02)

### 월요일
- [ ] 사용하지 않는 SCSS 파일 식별 및 삭제
- [ ] 삭제 대상 목록 작성

### 화요일
- [ ] Header/Navigation 마이그레이션
- [ ] 영향도 분석 및 테스트

### 수요일
- [ ] Home 페이지 스타일 통합 시작
- [ ] HomeAlignment.scss와 Home.scss 병합

### 목요일
- [ ] CmsHome 관련 파일 통합
- [ ] 3개 파일 → 1개로

### 금요일
- [ ] 주간 진행 상황 리뷰
- [ ] 다음 주 계획 수립
- [ ] MEMORY.MD 업데이트

## 측정 지표

### 코드 품질
- **!important 사용**: 202개 → 156개 (-22.7%)
- **하드코딩 색상**: 766개 → 650개 (-15.1%)
- **하드코딩 픽셀**: 1,898개 → 1,600개 (-15.7%)

### 파일 관리
- **총 SCSS 파일**: 141개 → 118개 (-16.3%)
- **중복 파일**: 57개 → 34개 (-40.4%)
- **평균 파일 크기**: 8.2KB → 6.5KB (-20.7%)

### 성능
- **CSS 번들 크기**: 487KB → 412KB (-15.4%)
- **빌드 시간**: 45초 → 38초 (-15.6%)
- **첫 로딩 시간**: 3.2초 → 2.8초 (-12.5%)

## 리스크 및 이슈

### 🔴 높은 리스크
1. **FeedbackSectionRedesign.scss**
   - 224개 !important로 인한 복잡도
   - 전체 피드백 페이지에 영향
   - 예상 작업 시간: 2일

### 🟡 중간 리스크
1. **Home 페이지 통합**
   - 메인 페이지라 영향도 높음
   - 철저한 테스트 필요
   - 예상 작업 시간: 1일

### 🟢 낮은 리스크
1. **Admin 페이지**
   - 사용 빈도 낮음
   - 독립적인 구조
   - 예상 작업 시간: 0.5일

## 다음 마일스톤

### 2주차 (2025-02-03 ~ 2025-02-09)
- [ ] 피드백 페이지 마이그레이션 완료
- [ ] 프로젝트 생성 페이지 통합
- [ ] 진행률 30% 달성

### 3주차 (2025-02-10 ~ 2025-02-16)
- [ ] 비디오 기획 페이지 정리
- [ ] 캘린더 스타일 통합
- [ ] 진행률 45% 달성

### 4주차 (2025-02-17 ~ 2025-02-23)
- [ ] 로그인/회원가입 통합
- [ ] 마이페이지 정리
- [ ] 진행률 60% 달성

---

**Last Updated**: 2025-01-28
**Next Review**: 2025-02-02