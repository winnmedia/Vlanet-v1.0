# VideoPlanet UI 개선 실행 계획
## "Every Pixel Must Be In Its Rightful Place"

### 현재 상태: 0점/100점 (F등급) 🚨

픽셀 퍼펙트 검증 결과, VideoPlanet의 UI는 **완전한 재구성**이 필요한 상태입니다.

## 🎯 목표: 7일 내 95점 달성

### 📅 Day 1-2: 긴급 수술 (0→30점)

#### 1. !important 대량 제거 작전
**가장 심각한 파일들:**
- `FeedbackButtonStyles.module.scss`: 92개 → 0개
- `ProjectPhaseBoard.module.scss`: 40개 → 0개
- `Cms.scss`: 30개 → 0개

**실행 스크립트:**
```bash
# !important 제거 도구 생성 및 실행
node scripts/remove-important-safely.js \
  --file src/page/Cms/FeedbackButtonStyles.module.scss \
  --strategy specificity \
  --execute

# CSS 모듈 특정성 활용
node scripts/migrate-to-css-modules-specificity.js \
  --execute
```

#### 2. 하드코딩 색상 일괄 토큰화
```bash
# 최악의 파일부터 처리
node scripts/aggressive-final-tokenizer.js \
  src/css/Home.scss \
  src/page/User/MyPage.scss \
  src/css/Cms/Cms.scss \
  --execute
```

### 📅 Day 3-4: 구조적 개선 (30→65점)

#### 1. 중복 스타일 파일 통합
**피드백 관련 22개 파일 → 3개로 통합:**
- `FeedbackStyles.module.scss` (메인 스타일)
- `FeedbackComponents.module.scss` (컴포넌트별)
- `FeedbackAnimations.module.scss` (애니메이션)

```bash
# 스타일 통합 도구
node scripts/consolidate-styles.js \
  --pattern "Feedback*.scss" \
  --output src/css/Cms/FeedbackUnified.module.scss \
  --execute
```

#### 2. 컴포넌트 완전 통합
```bash
# 남은 45개 커스텀 버튼 처리
node scripts/migrate-remaining-buttons.js --execute

# 25개 커스텀 Input 처리
node scripts/migrate-remaining-inputs.js --execute
```

### 📅 Day 5-6: 시스템 완성 (65→85점)

#### 1. 반응형 시스템 통일
```bash
# 모든 미디어 쿼리를 표준화
node scripts/standardize-media-queries.js \
  --breakpoints "$breakpoint-sm,$breakpoint-md,$breakpoint-lg" \
  --execute
```

#### 2. 8px 그리드 시스템 적용
```bash
# 비표준 픽셀 값 정리
node scripts/enforce-grid-system.js \
  --grid 8 \
  --execute
```

### 📅 Day 7: 최종 검증 (85→95점)

#### 1. Visual Regression Testing
```bash
# 주요 페이지 스냅샷
npm run test:visual -- \
  --pages login,cms-home,feedback,video-planning
```

#### 2. 성능 최적화
```bash
# 사용하지 않는 스타일 제거
npm run purge-css

# 번들 크기 분석
npm run analyze
```

## 🛠️ 즉시 생성할 도구들

### 1. remove-important-safely.js
```javascript
// CSS 특정성을 활용한 !important 제거
// 예: .feedback-button → .feedback-page .feedback-section .feedback-button
```

### 2. consolidate-styles.js
```javascript
// 중복 스타일 감지 및 통합
// AST 분석으로 동일한 스타일 규칙 병합
```

### 3. standardize-media-queries.js
```javascript
// 하드코딩된 미디어 쿼리를 토큰으로 변환
// @media (max-width: 767px) → @media (max-width: $breakpoint-md)
```

## 📊 예상 진행률

| 일차 | 점수 | 주요 작업 |
|------|------|-----------|
| Day 1 | 0→15 | !important 50% 제거 |
| Day 2 | 15→30 | 하드코딩 색상 제거 |
| Day 3 | 30→45 | 스타일 파일 통합 |
| Day 4 | 45→65 | 컴포넌트 통합 |
| Day 5 | 65→75 | 반응형 통일 |
| Day 6 | 75→85 | 그리드 시스템 |
| Day 7 | 85→95 | 최종 검증 |

## ⚡ 빠른 승리 (Quick Wins)

1. **FeedbackButtonStyles.module.scss의 92개 !important 제거**
   - 예상 점수 상승: +15점
   - 작업 시간: 2시간

2. **design-tokens.scss의 하드코딩 색상 제거**
   - 예상 점수 상승: +8점
   - 작업 시간: 1시간

3. **Cms.scss의 구조 개선**
   - 예상 점수 상승: +10점
   - 작업 시간: 3시간

## 🚦 성공 지표

- [ ] !important 사용: 267개 → 0개
- [ ] 하드코딩 색상: 57개 → 0개
- [ ] 비표준 픽셀: 110개 → 0개
- [ ] 중복 스타일 파일: 92개 → 30개
- [ ] 픽셀 퍼펙트 점수: 0점 → 95점

## 💎 최종 목표

**"VideoPlanet의 모든 픽셀이 정확한 위치에 있으며, 모든 컴포넌트가 디자인 시스템과 완벽하게 일치하는 상태"**

---
*이 계획은 즉시 실행 가능하며, 각 단계별 검증을 통해 품질을 보장합니다.*