# 디자인 시스템 구현 가이드

## 🚀 빠른 시작

### 1. 즉시 적용 가능한 개선사항

#### 1.1 CSS 변수 활용
```scss
// ❌ Before - 하드코딩
.button {
  background: #1631F8;
  padding: 10px 16px;
  border-radius: 8px;
}

// ✅ After - 디자인 토큰 사용
.button {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}
```

#### 1.2 중복 스타일 통합
```scss
// ❌ Before - 여러 파일에 분산
// FeedbackButtons.scss
.feedback-button { ... }

// FeedbackButtonLayoutFix.scss  
.feedback-button { ... }

// FeedbackButtonStyles.module.scss
.feedbackButton { ... }

// ✅ After - 단일 모듈
// Button.module.scss
.button {
  // 모든 버튼의 기본 스타일
}
```

### 2. 우선 정리 대상 파일들

#### 2.1 버튼 관련 (12개 파일 → 1개로 통합)
- `/css/Cms/ButtonFix.scss`
- `/css/Cms/ButtonAlignment.scss`
- `/css/Cms/FeedbackButtons.scss`
- `/css/Cms/FeedbackButtonLayoutFix.scss`
- `/css/Cms/VideoUploadButton.scss`
- `/css/Cms/VideoPlayerButtonFix.scss`
- `/css/Cms/AIAnalyzeButton.scss`
- `/css/Common/ToggleButton.scss`
- `/page/Cms/FeedbackButtonStyles.module.scss`
- `/page/Cms/VideoPlanningButtons.scss`
- `/styles/common-buttons.scss`
- `/css/_buttons.scss`

#### 2.2 레이아웃 관련 (15개 파일 → 3개로 통합)
- 페이지 레이아웃 (1개)
- 그리드 시스템 (1개)
- 반응형 유틸리티 (1개)

#### 2.3 피드백 페이지 (20개 파일 → 5개로 통합)
- 기본 레이아웃 (1개)
- 컴포넌트 스타일 (3개)
- 반응형 (1개)

## 📝 구현 체크리스트

### Week 1: 분석 및 정리
- [ ] 사용되지 않는 SCSS 파일 목록 작성
- [ ] 중복 스타일 정의 찾기
- [ ] 컴포넌트별 스타일 의존성 맵 작성
- [ ] 디자인 토큰 확장 계획 수립

### Week 2: 기본 컴포넌트
- [ ] Button 컴포넌트 구현
- [ ] Input 컴포넌트 구현
- [ ] Card 컴포넌트 구현
- [ ] 각 컴포넌트 테스트 작성

### Week 3: 첫 번째 페이지 마이그레이션
- [ ] 로그인 페이지 리팩토링
- [ ] 기존 스타일 제거
- [ ] 시각적 회귀 테스트 통과
- [ ] 접근성 테스트 통과

## 🛠 도구 및 스크립트

### 스타일 분석 도구
```bash
# 사용하지 않는 CSS 찾기
npx purgecss --css src/**/*.scss --content src/**/*.{js,jsx,ts,tsx}

# CSS 통계 분석
npx wallace src/**/*.scss

# 중복 찾기
npx csscomb src/**/*.scss --lint
```

### 컴포넌트 생성 스크립트
```bash
#!/bin/bash
# scripts/create-component.sh

COMPONENT_NAME=$1
COMPONENT_PATH="src/design-system/components/$COMPONENT_NAME"

mkdir -p $COMPONENT_PATH

# 컴포넌트 파일 생성
cat > "$COMPONENT_PATH/$COMPONENT_NAME.tsx" << EOF
import { forwardRef } from 'react';
import styles from './$COMPONENT_NAME.module.scss';

interface ${COMPONENT_NAME}Props {
  children?: React.ReactNode;
}

export const $COMPONENT_NAME = forwardRef<HTMLDivElement, ${COMPONENT_NAME}Props>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} className={styles.root} {...props}>
        {children}
      </div>
    );
  }
);

$COMPONENT_NAME.displayName = '$COMPONENT_NAME';
EOF

# 스타일 파일 생성
cat > "$COMPONENT_PATH/$COMPONENT_NAME.module.scss" << EOF
@use '../../tokens' as *;

.root {
  // 스타일 정의
}
EOF

# 인덱스 파일 생성
cat > "$COMPONENT_PATH/index.ts" << EOF
export { $COMPONENT_NAME } from './$COMPONENT_NAME';
export type { ${COMPONENT_NAME}Props } from './$COMPONENT_NAME';
EOF

# 테스트 파일 생성
cat > "$COMPONENT_PATH/$COMPONENT_NAME.test.tsx" << EOF
import { render, screen } from '@testing-library/react';
import { $COMPONENT_NAME } from './$COMPONENT_NAME';

describe('$COMPONENT_NAME', () => {
  it('renders without crashing', () => {
    render(<$COMPONENT_NAME>Test</$COMPONENT_NAME>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
EOF

echo "✅ Component $COMPONENT_NAME created at $COMPONENT_PATH"
```

## 📋 마이그레이션 예시

### Before: 분산된 버튼 스타일
```jsx
// 여러 클래스명과 인라인 스타일 혼재
<button 
  className="btn btn-primary feedback-button custom-button"
  style={{ padding: '10px 20px' }}
>
  저장
</button>
```

### After: 통합된 컴포넌트
```jsx
import { Button } from '@/design-system';

<Button variant="primary" size="md">
  저장
</Button>
```

## 🎯 성능 목표

### 번들 크기 감소
- 현재: ~500KB (추정)
- 목표: ~200KB
- 방법: 중복 제거, Tree shaking

### 빌드 시간 단축
- 현재: ~60초
- 목표: ~40초
- 방법: SCSS 파일 수 감소

### 런타임 성능
- CSS 특이성 감소
- 리플로우/리페인트 최소화
- CSS-in-JS 대신 CSS Modules 사용

## 💡 팁과 트릭

### 1. 점진적 마이그레이션
```scss
// 임시 호환성 레이어
@use 'design-system/tokens' as *;

// 기존 클래스명 유지하면서 새 시스템 사용
.btn {
  @extend .button;
  
  &.btn-primary {
    @extend .button--primary;
  }
}
```

### 2. 타입 안전성
```typescript
// design-system/types.ts
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;

// 사용 예
function getColor(token: ColorToken) {
  return `var(--color-${token})`;
}
```

### 3. 자동 완성 지원
```typescript
// VS Code 설정
{
  "cssVariables.lookupFiles": [
    "src/styles/design-tokens.scss",
    "src/design-system/tokens/**/*.scss"
  ]
}
```

## 🚨 주의사항

1. **기존 기능 보장**: 마이그레이션 중 기능이 깨지지 않도록 주의
2. **시각적 회귀**: 모든 변경사항은 스냅샷 테스트로 검증
3. **접근성 유지**: WCAG 2.1 AA 기준 지속적 충족
4. **팀 소통**: 주요 변경사항은 사전 공유

## 📅 주간 체크인

매주 금요일:
1. 진행 상황 리뷰
2. 다음 주 계획 수립
3. 블로커 해결
4. 팀 피드백 수집