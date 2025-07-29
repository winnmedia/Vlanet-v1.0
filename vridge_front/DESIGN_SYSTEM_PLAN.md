# VideoPlanet 디자인 시스템 통합 계획

## 📋 현황 분석

### 문제점
1. **스타일 파일 과다**: 100개 이상의 SCSS 파일이 산재
2. **중복 정의**: 동일 컴포넌트에 대한 여러 버전 존재
3. **일관성 부재**: 페이지마다 다른 스타일 적용
4. **하드코딩**: 색상, 간격, 크기 등이 직접 입력됨
5. **유지보수 어려움**: 어떤 파일이 실제 사용되는지 불명확

### 기존 자산
- `design-tokens.scss`: 이미 정의된 CSS 변수들
- `theme.js`: JavaScript 테마 설정
- 브랜드 컬러: #1631F8 (Primary Blue)

## 🎯 목표

1. **단일 진실의 원천(Single Source of Truth)** 구축
2. **컴포넌트 기반 아키텍처** 확립
3. **일관된 사용자 경험** 제공
4. **개발 효율성** 향상
5. **유지보수성** 개선

## 📐 디자인 시스템 구조

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   └── breakpoints.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── patterns/
│   │   ├── forms/
│   │   ├── navigation/
│   │   └── layouts/
│   └── index.ts
```

## 🔄 단계별 실행 계획

### Phase 1: 정리 및 분석 (1주)

#### 1.1 스타일 파일 감사
```bash
# 사용되지 않는 SCSS 파일 찾기
npx sass-unused "src/**/*.scss"

# 중복 스타일 분석
npx css-analyzer --duplicates
```

#### 1.2 스타일 사용 매핑
- 각 컴포넌트가 사용하는 스타일 파일 목록화
- 중복 제거 대상 식별
- 우선순위 결정

#### 1.3 디자인 토큰 확장
```typescript
// design-system/tokens/colors.ts
export const colors = {
  primary: {
    50: '#e8ebff',
    100: '#d1d7ff',
    500: '#1631F8', // 기본
    600: '#0F23C9', // hover
    900: '#050a33',
  },
  danger: {
    500: '#dc3545',
    600: '#c82333',
  },
  // ...
} as const;
```

### Phase 2: 컴포넌트 라이브러리 구축 (2주)

#### 2.1 기본 컴포넌트
```typescript
// design-system/components/Button/Button.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### 2.2 컴포넌트 목록
- **Button**: Primary, Secondary, Danger 변형
- **Input**: Text, Email, Password, Textarea
- **Card**: 프로젝트 카드, 피드백 카드
- **Modal**: 기본 모달, 확인 다이얼로그
- **Navigation**: 헤더, 사이드바, 탭
- **Feedback**: 알림, 토스트, 에러 메시지

#### 2.3 스타일 모듈화
```scss
// Button.module.scss
@use '../../tokens' as *;

.button {
  // 기본 스타일
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  border: none;
  border-radius: $radius-md;
  font-weight: $font-weight-semibold;
  transition: $transition-button;
  cursor: pointer;
  
  // 크기 변형
  &.sm {
    height: 32px;
    padding: 0 $spacing-sm;
    font-size: $font-size-sm;
  }
  
  &.md {
    height: 40px;
    padding: 0 $spacing-md;
    font-size: $font-size-base;
  }
  
  &.lg {
    height: 48px;
    padding: 0 $spacing-lg;
    font-size: $font-size-lg;
  }
  
  // 색상 변형
  &.primary {
    background: linear-gradient(135deg, $color-primary-500 0%, $color-primary-600 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-button-hover;
    }
  }
}
```

### Phase 3: 점진적 마이그레이션 (3주)

#### 3.1 우선순위 페이지
1. **로그인/회원가입**: 첫인상이 중요한 페이지
2. **프로젝트 관리**: 가장 많이 사용되는 페이지
3. **영상 피드백**: 핵심 기능 페이지
4. **영상기획**: 복잡한 폼 페이지

#### 3.2 마이그레이션 전략
```typescript
// 기존 코드
<button className="btn btn-primary btn-gradient">
  저장
</button>

// 새 코드
import { Button } from '@/design-system';

<Button variant="primary">
  저장
</Button>
```

#### 3.3 레거시 스타일 제거
- 페이지별로 점진적 교체
- 사용하지 않는 SCSS 파일 삭제
- import 정리

### Phase 4: Storybook 도입 (1주)

#### 4.1 설치 및 설정
```bash
npx storybook@latest init
```

#### 4.2 스토리 작성
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: '버튼',
    variant: 'primary',
  },
};
```

#### 4.3 문서화
- 사용 가이드라인
- 접근성 체크리스트
- 코드 예제

### Phase 5: 품질 보증 (지속적)

#### 5.1 자동화 테스트
```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

test('Button이 접근성 기준을 충족한다', async () => {
  const { container } = render(<Button>테스트</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 5.2 시각적 회귀 테스트
- Storybook 스냅샷 테스트
- Chromatic 연동 고려

## 📊 성공 지표

1. **코드 중복 감소**: 50% 이상 감소
2. **빌드 시간 단축**: 30% 개선
3. **개발 속도 향상**: 컴포넌트 재사용으로 2배 향상
4. **일관성 점수**: 모든 페이지 90% 이상
5. **접근성 점수**: 100% WCAG 2.1 AA 준수

## 🚀 즉시 실행 가능한 액션

### 1. 디자인 토큰 활용 강제
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/#[0-9a-fA-F]{3,6}/]",
        "message": "하드코딩된 색상 대신 디자인 토큰을 사용하세요."
      }
    ]
  }
}
```

### 2. 컴포넌트 템플릿 생성
```bash
# 컴포넌트 생성 스크립트
npm run create-component Button
```

### 3. 스타일 가이드 문서
- Notion 또는 Wiki에 디자인 시스템 문서 생성
- 팀원 교육 자료 준비

## 📅 타임라인

- **Week 1-2**: Phase 1 (정리 및 분석)
- **Week 3-4**: Phase 2 (컴포넌트 라이브러리)
- **Week 5-7**: Phase 3 (점진적 마이그레이션)
- **Week 8**: Phase 4 (Storybook)
- **Week 9+**: Phase 5 (지속적 개선)

## 🤝 팀 협업

1. **주간 리뷰**: 진행 상황 공유
2. **페어 프로그래밍**: 복잡한 컴포넌트
3. **코드 리뷰**: 디자인 시스템 준수 확인
4. **피드백 수집**: 사용성 개선

## 📚 참고 자료

- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [Design Systems Handbook](https://www.designbetter.co/design-systems-handbook)
- [Material-UI](https://mui.com/) - 참고용
- [Ant Design](https://ant.design/) - 참고용