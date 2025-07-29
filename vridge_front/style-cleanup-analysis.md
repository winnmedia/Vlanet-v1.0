# VideoPlanet 스타일 파일 정리 분석

## 📊 현황 요약
- **총 SCSS 파일**: 141개 (CSS Modules: 21개, 전역: 120개)
- **하드코딩된 색상**: 766개
- **하드코딩된 픽셀**: 1,898개
- **!important 사용**: 130개

## 🔴 버튼 관련 스타일 (16개 → 1개로 통합)

### 실제 사용 중인 파일
```bash
# 검증 필요 파일들
src/page/Cms/FeedbackButtonStyles.module.scss  # Feedback.jsx에서 사용
src/css/Cms/FeedbackButtons.scss              # 전역 import 여부 확인
src/css/_buttons.scss                          # 기본 버튼 스타일
src/styles/common-buttons.scss                 # 공통 버튼 스타일
```

### 중복/미사용 의심 파일
```bash
src/css/Cms/ButtonFix.scss                    # Fix 파일은 임시 수정
src/css/Cms/ButtonAlignment.scss              # 정렬만 담당
src/css/Cms/FeedbackButtonLayoutFix.scss      # 레이아웃 수정
src/css/Cms/AIAnalyzeButton.scss              # 특정 기능 버튼
src/css/Cms/VideoUploadButton.scss            # 특정 기능 버튼
src/css/Cms/VideoPlayerButtonFix.scss         # 플레이어 버튼 수정
src/css/Cms/ShareButtonFix.scss               # 공유 버튼 수정
src/css/Cms/FeedbackFloatingButtons.scss      # 플로팅 버튼
src/css/Common/ToggleButton.scss              # 토글 버튼
src/page/Cms/VideoPlanningButtons.scss        # 특정 페이지 버튼
src/components/ToggleButton.module.scss       # 컴포넌트 모듈
src/components/minimal/MinimalButton.module.scss # 미니멀 버튼
```

## 🟡 레이아웃 관련 스타일 (11개 → 3개로 통합)

### 통합 대상
```bash
# 페이지 레이아웃 (1개로 통합)
src/css/_layout.scss                          # 기본 레이아웃
src/css/Cms/LayoutFix.scss                   # 레이아웃 수정
src/css/Common/LayoutFix.scss                 # 공통 레이아웃 수정
src/css/Cms/HomeLayoutFix.scss               # 홈 레이아웃 수정
src/css/Cms/HomeActivityLayout.scss          # 홈 활동 레이아웃

# 그리드 시스템 (1개로 통합)
src/css/Cms/FeedbackGridLayout.module.scss   # 그리드 레이아웃
src/css/Cms/FeedbackLayoutFix.scss           # 피드백 레이아웃
src/css/Cms/FeedbackNewLayout.scss           # 새 피드백 레이아웃

# 반응형 유틸리티 (1개로 통합)
src/css/Cms/FeedbackResponsiveLayout.scss    # 반응형 레이아웃
src/css/Cms/CalendarLayout.scss              # 캘린더 레이아웃
src/css/Cms/FeedbackButtonLayoutFix.scss     # 버튼 레이아웃
```

## 🟢 피드백 페이지 스타일 (35개 → 5개로 통합)

### 통합 계획
1. **기본 스타일** (FeedbackBase.scss)
   - FeedbackPage.scss
   - FeedbackOriginal.scss
   - FeedbackInitial.scss

2. **컴포넌트 스타일** (3개 모듈)
   - FeedbackPlayer.module.scss
   - FeedbackInput.module.scss
   - FeedbackManage.module.scss

3. **반응형 스타일** (FeedbackResponsive.scss)
   - FeedbackMobile.scss
   - FeedbackResponsive.scss
   - FeedbackVideoResponsive.scss

4. **테마/변형** (미사용 시 삭제)
   - FeedbackModern.scss
   - FeedbackModernUI.scss
   - FeedbackClean.scss
   - FeedbackHarmonyUI.scss

5. **수정/패치 파일** (모두 통합 후 삭제)
   - *Fix.scss 파일들
   - *Redesign.scss 파일들

## 🔧 즉시 실행 가능한 작업

### 1단계: 사용 여부 확인
```bash
# 버튼 스타일 사용 확인
grep -r "ButtonFix\|ButtonAlignment\|FeedbackButtons" src --include="*.jsx" --include="*.tsx"

# 레이아웃 스타일 사용 확인
grep -r "LayoutFix\|HomeLayout\|FeedbackLayout" src --include="*.jsx" --include="*.tsx"

# 피드백 스타일 사용 확인
grep -r "FeedbackModern\|FeedbackClean\|FeedbackOriginal" src --include="*.jsx" --include="*.tsx"
```

### 2단계: 백업 생성
```bash
# 통합 전 백업
tar -czf style-backup-$(date +%Y%m%d).tar.gz src/**/*.scss
```

### 3단계: 단계별 통합
1. 새로운 통합 파일 생성
2. 기존 스타일 복사 및 정리
3. import 경로 변경
4. 시각적 회귀 테스트
5. 미사용 파일 삭제

## ⚠️ 주의사항
- 각 통합 단계마다 시각적 회귀 테스트 실행
- !important 제거 시 스타일 우선순위 확인
- 하드코딩된 값은 design-tokens.scss 변수로 교체