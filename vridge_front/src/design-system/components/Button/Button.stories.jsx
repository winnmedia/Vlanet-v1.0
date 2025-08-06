import React from 'react';
import Button from './Button';
import { Button } from 'antd'

export default {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'danger',
        'success',
        'warning',
        'info',
        'outline',
        'ghost',
        'link',
        'ai-generate',
        'ai-analyze',
        'phase-planning',
        'phase-production',
        'phase-review',
      ],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
};

// 기본 버튼
export const Default = {
  args: {
    children: '버튼',
    variant: 'primary',
  },
};

// 주요 액션 버튼들
export const Primary = {
  args: {
    children: '저장하기',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    children: '취소',
    variant: 'secondary',
  },
};

export const Danger = {
  args: {
    children: '삭제',
    variant: 'danger',
  },
};

// 상태 버튼들
export const Success = {
  args: {
    children: '완료',
    variant: 'success',
  },
};

export const Warning = {
  args: {
    children: '주의',
    variant: 'warning',
  },
};

export const Info = {
  args: {
    children: '정보',
    variant: 'info',
  },
};

// 스타일 변형
export const Outline = {
  args: {
    children: '아웃라인',
    variant: 'outline',
  },
};

export const Ghost = {
  args: {
    children: '고스트',
    variant: 'ghost',
  },
};

export const Link = {
  args: {
    children: '링크 스타일',
    variant: 'link',
  },
};

// AI 기능 버튼
export const AIGenerate = {
  args: {
    children: 'AI로 생성하기',
    variant: 'ai-generate',
  },
};

export const AIAnalyze = {
  args: {
    children: 'AI로 분석하기',
    variant: 'ai-analyze',
  },
};

// 프로젝트 단계 버튼
export const PhasePlanning = {
  args: {
    children: '기획 단계',
    variant: 'phase-planning',
    size: 'large',
  },
};

export const PhaseProduction = {
  args: {
    children: '제작 단계',
    variant: 'phase-production',
    size: 'large',
  },
};

export const PhaseReview = {
  args: {
    children: '검토 단계',
    variant: 'phase-review',
    size: 'large',
  },
};

// 크기 변형
export const Small = {
  args: {
    children: '작은 버튼',
    size: 'small',
    variant: 'primary',
  },
};

export const Medium = {
  args: {
    children: '중간 버튼',
    size: 'medium',
    variant: 'primary',
  },
};

export const Large = {
  args: {
    children: '큰 버튼',
    size: 'large',
    variant: 'primary',
  },
};

// 상태
export const Disabled = {
  args: {
    children: '비활성화',
    variant: 'primary',
    disabled: true,
  },
};

export const Loading = {
  args: {
    children: '저장중...',
    variant: 'primary',
    loading: true,
  },
};

export const LoadingWithCustomText = {
  args: {
    children: '업로드중...',
    variant: 'success',
    loading: '파일 업로드 중...',
  },
};

// 아이콘 포함
export const WithIconLeft = {
  args: {
    children: '다운로드',
    variant: 'primary',
    icon: '⬇️',
    iconPosition: 'left',
  },
};

export const WithIconRight = {
  args: {
    children: '다음',
    variant: 'primary',
    icon: '→',
    iconPosition: 'right',
  },
};

// 전체 너비
export const FullWidth = {
  args: {
    children: '전체 너비 버튼',
    variant: 'primary',
    fullWidth: true,
  },
};

// 버튼 그룹 예시
export const ButtonGroup = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <Button variant="secondary">취소</Button>
    <Button variant="primary">확인</Button>
  </div>
);

// 모든 변형 보기
export const AllVariants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="info">Info</Button>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="ai-generate">AI Generate</Button>
      <Button variant="ai-analyze">AI Analyze</Button>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="phase-planning">Planning</Button>
      <Button variant="phase-production">Production</Button>
      <Button variant="phase-review">Review</Button>
    </div>
  </div>
);

// 실제 사용 예시
export const RealWorldExample = () => (
  <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
    <h3 style={{ marginBottom: '16px' }}>프로젝트 생성</h3>
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
      <Button variant="ai-generate">AI로 기획안 생성</Button>
      <Button variant="outline">템플릿 사용</Button>
    </div>
    
    <h3 style={{ marginBottom: '16px' }}>작업 단계 선택</h3>
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
      <Button variant="phase-planning" size="large">기획</Button>
      <Button variant="phase-production" size="large">제작</Button>
      <Button variant="phase-review" size="large">검토</Button>
    </div>
    
    <h3 style={{ marginBottom: '16px' }}>액션</h3>
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
      <Button variant="ghost">임시 저장</Button>
      <Button variant="secondary">취소</Button>
      <Button variant="primary">프로젝트 생성</Button>
    </div>
  </div>
);