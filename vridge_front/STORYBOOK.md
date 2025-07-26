# VideoPlanet Storybook 가이드

## 개요
VideoPlanet의 미니멀 디자인 시스템 컴포넌트를 문서화하고 테스트하기 위한 Storybook 설정입니다.

## 설치 방법

```bash
# Storybook 및 관련 패키지 설치
npm install --save-dev @storybook/react @storybook/react-webpack5 @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-links

# SCSS 지원을 위한 패키지
npm install --save-dev sass sass-loader
```

## 실행 방법

```bash
# Storybook 개발 서버 시작
npm run storybook

# Storybook 정적 빌드
npm run build-storybook
```

## 스크립트 추가 (package.json)

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 컴포넌트 구조

### 현재 구현된 컴포넌트

1. **MinimalCard**
   - 기본 카드 레이아웃
   - 헤더, 콘텐츠, 푸터 섹션
   - 호버 효과 및 패딩 옵션

2. **StepWizard**
   - 다단계 프로세스 관리
   - 진행률 표시
   - 유효성 검사 지원

## 스토리 작성 가이드

### 기본 구조

```jsx
import React from 'react'
import { ComponentName } from './ComponentName'

export default {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    docs: {
      description: {
        component: '컴포넌트 설명'
      }
    }
  }
}

export const Default = () => <ComponentName />
```

### 베스트 프랙티스

1. **명확한 네이밍**: 스토리 이름은 사용 사례를 명확히 표현
2. **다양한 상태**: 모든 가능한 상태와 변형을 문서화
3. **인터랙션**: 사용자 상호작용이 있는 경우 액션 추가
4. **접근성**: ARIA 레이블과 키보드 네비게이션 테스트

## 디자인 토큰

Storybook에서 사용되는 주요 디자인 토큰:

- **Colors**: 
  - Primary: #0066FF
  - Black: #000000
  - Gray: #8B8B8D
  - White: #FFFFFF
  - Red: #FF3B30

- **Typography**: SF Pro Display/Text
- **Spacing**: 8pt 그리드 시스템
- **Border Radius**: 4px, 8px, 12px

## 확장 계획

- [ ] 폼 컴포넌트 (Input, Select, Checkbox)
- [ ] 네비게이션 컴포넌트
- [ ] 모달 및 팝오버
- [ ] 데이터 시각화 컴포넌트
- [ ] 애니메이션 컴포넌트