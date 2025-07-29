# 디자인 토큰 마이그레이션 가이드

## 1. 디자인 토큰 시스템 구조

```
src/design-system/tokens/
├── _index.scss          # 모든 토큰 통합
├── _colors.scss         # 색상 시스템
├── _spacing.scss        # 간격 시스템
├── _typography.scss     # 타이포그래피
├── _effects.scss        # 그림자, 애니메이션 등
└── _breakpoints.scss    # 반응형 브레이크포인트
```

## 2. 하드코딩된 값 → 토큰 변환 예시

### 색상 변환

```scss
// ❌ 기존 (하드코딩)
.button {
  background: #1631F8;
  color: #ffffff;
  border: 1px solid #e9ecef;
}

// ✅ 개선 (토큰 사용)
@use '@/design-system/tokens' as *;

.button {
  background: $color-primary;
  color: $color-white;
  border: 1px solid $color-border-light;
}
```

### 간격 변환

```scss
// ❌ 기존 (하드코딩)
.card {
  padding: 20px;
  margin-bottom: 24px;
  gap: 16px;
}

// ✅ 개선 (토큰 사용)
.card {
  padding: $spacing-xl;        // 20px
  margin-bottom: $spacing-2xl;  // 24px
  gap: $spacing-lg;            // 16px
}
```

### 타이포그래피 변환

```scss
// ❌ 기존 (하드코딩)
.title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

// ✅ 개선 (토큰/믹스인 사용)
.title {
  @include heading-2;
}
```

### 그림자 변환

```scss
// ❌ 기존 (하드코딩)
.card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

// ✅ 개선 (토큰 사용)
.card {
  box-shadow: $shadow-default;
  
  &:hover {
    box-shadow: $shadow-hover;
  }
}
```

### 반응형 변환

```scss
// ❌ 기존 (하드코딩)
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

// ✅ 개선 (믹스인 사용)
.container {
  @include media-down('md') {
    padding: $spacing-md;
  }
}

.grid {
  @include media-down('lg') {
    grid-template-columns: 1fr;
  }
}
```

## 3. 주요 토큰 매핑 테이블

### 색상 매핑

| 하드코딩된 값 | 토큰 변수 | 용도 |
|-------------|----------|-----|
| #1631F8 | $color-primary | 주요 액션, 링크 |
| #0F23C9 | $color-primary-hover | 호버 상태 |
| #dc3545 | $color-danger | 삭제, 에러 |
| #28a745 | $color-success | 성공, 완료 |
| #ffc107 | $color-warning | 경고, 주의 |
| #f8f9fa | $color-gray-50 | 배경색 |
| #6c757d | $color-text-muted | 보조 텍스트 |

### 간격 매핑

| 픽셀 값 | 토큰 변수 | 배수 |
|--------|----------|-----|
| 4px | $spacing-xs | 1x |
| 8px | $spacing-sm | 2x |
| 12px | $spacing-md | 3x |
| 16px | $spacing-lg | 4x |
| 20px | $spacing-xl | 5x |
| 24px | $spacing-2xl | 6x |
| 32px | $spacing-3xl | 8x |

### 폰트 크기 매핑

| 픽셀 값 | 토큰 변수 | 용도 |
|--------|----------|-----|
| 12px | $font-size-xs | 캡션, 라벨 |
| 13px | $font-size-sm | 보조 텍스트 |
| 14px | $font-size-base | 본문 |
| 16px | $font-size-lg | 소제목 |
| 18px | $font-size-xl | 제목 |
| 20px | $font-size-2xl | 큰 제목 |
| 24px | $font-size-3xl | 주요 제목 |

### 테두리 반경 매핑

| 픽셀 값 | 토큰 변수 | 용도 |
|--------|----------|-----|
| 4px | $radius-sm | 작은 요소 |
| 8px | $radius-md | 버튼, 입력 |
| 12px | $radius-lg | 카드, 모달 |
| 50% | $radius-full | 원형 |

## 4. 마이그레이션 단계

### Step 1: 토큰 import
```scss
// 파일 상단에 추가
@use '@/design-system/tokens' as *;
```

### Step 2: 색상 치환
```bash
# 찾기 및 바꾸기 예시
#1631F8 → $color-primary
#dc3545 → $color-danger
#28a745 → $color-success
rgba(0, 0, 0, 0.08) → $shadow-default
```

### Step 3: 간격 치환
```bash
# 패딩/마진 치환
padding: 20px → padding: $spacing-xl
margin: 16px → margin: $spacing-lg
gap: 12px → gap: $spacing-md
```

### Step 4: 미디어 쿼리 치환
```bash
# 반응형 브레이크포인트
@media (max-width: 768px) → @include media-down('md')
@media (min-width: 1024px) → @include media-up('lg')
```

## 5. 자동화 스크립트

```js
// 하드코딩된 값 찾기
const findHardcodedValues = {
  colors: /#[0-9a-fA-F]{3,6}/g,
  pixels: /\d+px/g,
  rgba: /rgba?\([^)]+\)/g
};

// 치환 맵
const replacementMap = {
  '#1631F8': '$color-primary',
  '#0F23C9': '$color-primary-hover',
  '20px': '$spacing-xl',
  '16px': '$spacing-lg',
  '12px': '$spacing-md',
  '8px': '$spacing-sm',
  '4px': '$spacing-xs'
};
```

## 6. 체크리스트

- [ ] 모든 색상 값을 토큰으로 변환
- [ ] 모든 간격 값을 토큰으로 변환
- [ ] 모든 폰트 크기를 토큰으로 변환
- [ ] 모든 그림자를 토큰으로 변환
- [ ] 모든 미디어 쿼리를 믹스인으로 변환
- [ ] !important 제거 및 우선순위 정리
- [ ] 시각적 회귀 테스트 수행

## 7. 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 파일을 변경하지 말고 컴포넌트 단위로 진행
2. **시각적 테스트**: 각 변경 후 UI가 동일하게 보이는지 확인
3. **커스텀 값**: 표준 토큰에 없는 값은 로컬 변수로 정의
4. **성능**: CSS 변수 사용 시 브라우저 호환성 확인

## 8. 효과 측정

### Before
- 하드코딩된 색상: 766개
- 하드코딩된 픽셀: 1,898개
- !important 사용: 130개
- 중복된 값: 약 60%

### After (예상)
- 토큰 사용률: 95%+
- 코드 일관성: 크게 향상
- 유지보수성: 중앙 집중식 관리
- 다크모드 지원: 쉽게 추가 가능