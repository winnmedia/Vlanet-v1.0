#!/bin/bash

# 컴포넌트 생성 스크립트
# 사용법: ./scripts/create-component.sh ComponentName

if [ -z "$1" ]; then
  echo "❌ 사용법: ./scripts/create-component.sh ComponentName"
  exit 1
fi

COMPONENT_NAME=$1
COMPONENT_PATH="src/design-system/components/$COMPONENT_NAME"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔨 Creating component: $COMPONENT_NAME${NC}"

# 디렉토리 생성
mkdir -p $COMPONENT_PATH

# TypeScript 컴포넌트 파일
cat > "$COMPONENT_PATH/$COMPONENT_NAME.tsx" << EOF
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './$COMPONENT_NAME.module.scss';

export interface ${COMPONENT_NAME}Props extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 컴포넌트의 시각적 변형
   */
  variant?: 'default' | 'primary' | 'secondary';
  /**
   * 컴포넌트 크기
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 자식 요소
   */
  children?: React.ReactNode;
}

/**
 * $COMPONENT_NAME 컴포넌트
 * 
 * @example
 * <$COMPONENT_NAME variant="primary" size="md">
 *   Content
 * </$COMPONENT_NAME>
 */
export const $COMPONENT_NAME = forwardRef<HTMLDivElement, ${COMPONENT_NAME}Props>(
  ({ 
    variant = 'default', 
    size = 'md', 
    className,
    children, 
    ...props 
  }, ref) => {
    return (
      <div 
        ref={ref} 
        className={clsx(
          styles.root,
          styles[variant],
          styles[size],
          className
        )} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

$COMPONENT_NAME.displayName = '$COMPONENT_NAME';
EOF

# SCSS 모듈 파일
cat > "$COMPONENT_PATH/$COMPONENT_NAME.module.scss" << EOF
@use '../../tokens' as *;

.root {
  // 기본 스타일
  position: relative;
  display: flex;
  align-items: center;
  transition: all \$transition-default;
  
  // 크기 변형
  &.sm {
    padding: \$spacing-xs \$spacing-sm;
    font-size: \$font-size-sm;
  }
  
  &.md {
    padding: \$spacing-sm \$spacing-md;
    font-size: \$font-size-base;
  }
  
  &.lg {
    padding: \$spacing-md \$spacing-lg;
    font-size: \$font-size-lg;
  }
  
  // 스타일 변형
  &.default {
    background-color: \$color-gray-100;
    color: \$color-text-primary;
    
    &:hover {
      background-color: \$color-gray-200;
    }
  }
  
  &.primary {
    background: linear-gradient(135deg, \$color-primary 0%, \$color-primary-hover 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: \$shadow-button-hover;
    }
  }
  
  &.secondary {
    background-color: white;
    color: \$color-primary;
    border: 1px solid \$color-border-light;
    
    &:hover {
      background-color: \$color-gray-50;
      border-color: \$color-primary;
    }
  }
  
  // 반응형
  @media (max-width: \$breakpoint-mobile) {
    &.sm, &.md, &.lg {
      padding: \$spacing-sm;
      font-size: \$font-size-sm;
    }
  }
}
EOF

# 인덱스 파일
cat > "$COMPONENT_PATH/index.ts" << EOF
export { $COMPONENT_NAME } from './$COMPONENT_NAME';
export type { ${COMPONENT_NAME}Props } from './$COMPONENT_NAME';
EOF

# 테스트 파일
cat > "$COMPONENT_PATH/$COMPONENT_NAME.test.tsx" << EOF
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { $COMPONENT_NAME } from './$COMPONENT_NAME';

expect.extend(toHaveNoViolations);

describe('$COMPONENT_NAME', () => {
  it('렌더링이 정상적으로 된다', () => {
    render(<$COMPONENT_NAME>Test Content</$COMPONENT_NAME>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('variant prop이 올바르게 적용된다', () => {
    const { container } = render(
      <$COMPONENT_NAME variant="primary">Primary</$COMPONENT_NAME>
    );
    expect(container.firstChild).toHaveClass('primary');
  });

  it('size prop이 올바르게 적용된다', () => {
    const { container } = render(
      <$COMPONENT_NAME size="lg">Large</$COMPONENT_NAME>
    );
    expect(container.firstChild).toHaveClass('lg');
  });

  it('추가 className이 적용된다', () => {
    const { container } = render(
      <$COMPONENT_NAME className="custom-class">Custom</$COMPONENT_NAME>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('접근성 기준을 충족한다', async () => {
    const { container } = render(
      <$COMPONENT_NAME>Accessible</$COMPONENT_NAME>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ref가 올바르게 전달된다', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<$COMPONENT_NAME ref={ref}>Ref Test</$COMPONENT_NAME>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
EOF

# Storybook 스토리 파일
cat > "$COMPONENT_PATH/$COMPONENT_NAME.stories.tsx" << EOF
import type { Meta, StoryObj } from '@storybook/react';
import { $COMPONENT_NAME } from './$COMPONENT_NAME';

const meta: Meta<typeof $COMPONENT_NAME> = {
  title: 'Components/$COMPONENT_NAME',
  component: $COMPONENT_NAME,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '$COMPONENT_NAME 컴포넌트는 ...'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary'],
      description: '컴포넌트의 시각적 스타일',
      table: {
        defaultValue: { summary: 'default' }
      }
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '컴포넌트 크기',
      table: {
        defaultValue: { summary: 'md' }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    children: 'Default $COMPONENT_NAME',
    variant: 'default',
    size: 'md'
  }
};

// Primary 변형
export const Primary: Story = {
  args: {
    children: 'Primary $COMPONENT_NAME',
    variant: 'primary',
    size: 'md'
  }
};

// Secondary 변형
export const Secondary: Story = {
  args: {
    children: 'Secondary $COMPONENT_NAME',
    variant: 'secondary',
    size: 'md'
  }
};

// 크기 변형
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <$COMPONENT_NAME size="sm">Small</$COMPONENT_NAME>
      <$COMPONENT_NAME size="md">Medium</$COMPONENT_NAME>
      <$COMPONENT_NAME size="lg">Large</$COMPONENT_NAME>
    </div>
  )
};

// 모든 변형
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <$COMPONENT_NAME variant="default">Default</$COMPONENT_NAME>
      <$COMPONENT_NAME variant="primary">Primary</$COMPONENT_NAME>
      <$COMPONENT_NAME variant="secondary">Secondary</$COMPONENT_NAME>
    </div>
  )
};
EOF

# README 파일
cat > "$COMPONENT_PATH/README.md" << EOF
# $COMPONENT_NAME

## 개요
$COMPONENT_NAME 컴포넌트는 ...

## 사용법
\`\`\`tsx
import { $COMPONENT_NAME } from '@/design-system/components/$COMPONENT_NAME';

<$COMPONENT_NAME variant="primary" size="md">
  Content
</$COMPONENT_NAME>
\`\`\`

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'primary' \| 'secondary' | 'default' | 컴포넌트의 시각적 스타일 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 컴포넌트 크기 |
| children | ReactNode | - | 자식 요소 |
| className | string | - | 추가 CSS 클래스 |

## 접근성
- 적절한 ARIA 속성 사용
- 키보드 네비게이션 지원
- 스크린 리더 호환

## 디자인 가이드
- 색상: VideoPlanet 브랜드 컬러 사용
- 여백: 8px 기반 시스템
- 애니메이션: 300ms ease
EOF

# 디자인 시스템 인덱스 파일에 export 추가
DESIGN_SYSTEM_INDEX="src/design-system/components/index.ts"
if [ ! -f "$DESIGN_SYSTEM_INDEX" ]; then
  echo "// 디자인 시스템 컴포넌트 exports" > "$DESIGN_SYSTEM_INDEX"
fi

echo "export * from './$COMPONENT_NAME';" >> "$DESIGN_SYSTEM_INDEX"

echo -e "${GREEN}✅ Component $COMPONENT_NAME created successfully!${NC}"
echo -e "${BLUE}📁 Location: $COMPONENT_PATH${NC}"
echo ""
echo "다음 단계:"
echo "1. 컴포넌트 구현 완성하기"
echo "2. 테스트 실행: npm test $COMPONENT_NAME"
echo "3. Storybook 확인: npm run storybook"