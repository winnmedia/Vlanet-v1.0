import React from 'react';
import { UnifiedCard } from '../../components/unified/UnifiedCard';
import { UnifiedButton } from "../unified/Button";
export default {
  title: 'Minimal/Card',
  component: MinimalCard,
  parameters: {
    docs: {
      description: {
        component: 'Apple 스타일의 미니멀한 카드 컴포넌트입니다.'
      }
    }
  }
};

// 기본 카드
export const Default = () => <UnifiedCard>
    <CardContent>
      <p>기본 카드 컴포넌트입니다.</p>
    </CardContent>
  </UnifiedCard>;

// 헤더가 있는 카드
export const WithHeader = () => <UnifiedCard>
    <CardHeader title="카드 제목" subtitle="부제목이 여기에 표시됩니다" />
    <CardContent>
      <p>카드 내용이 여기에 표시됩니다. 깔끔하고 읽기 쉬운 레이아웃을 제공합니다.</p>
    </CardContent>
  </UnifiedCard>;

// 액션 버튼이 있는 카드
export const WithAction = () => <UnifiedCard>
    <CardHeader title="프로젝트 현황" subtitle="2025년 1월" action={<UnifiedButton style={{
    background: 'none',
    border: '1px solid #E5E5E7',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  }} aria-label="Click">편집</UnifiedButton>} />
    <CardContent>
      <p>진행 중인 프로젝트가 5개 있습니다.</p>
    </CardContent>
  </UnifiedCard>;

// 푸터가 있는 카드
export const WithFooter = () => <UnifiedCard>
    <CardHeader title="작업 확인" />
    <CardContent>
      <p>이 작업을 완료하시겠습니까?</p>
    </CardContent>
    <CardFooter align="right">
      <UnifiedButton style={{
      background: 'none',
      border: 'none',
      padding: '8px 16px',
      color: '#8B8B8D',
      cursor: 'pointer'
    }} aria-label="Click">취소</UnifiedButton>
      <UnifiedButton style={{
      background: '#0066FF',
      border: 'none',
      padding: '8px 16px',
      color: 'white',
      borderRadius: '6px',
      cursor: 'pointer'
    }} aria-label="Click">확인</UnifiedButton>
    </CardFooter>
  </UnifiedCard>;

// 호버 효과가 있는 카드
export const Hoverable = () => <UnifiedCard hover onClick={() => alert('카드를 클릭했습니다!')} onKeyDown={(e) => e.key === 'Enter' && () => alert('카드를 클릭했습니다!')}>
    <CardHeader title="클릭 가능한 카드" subtitle="클릭하거나 호버해보세요" />
    <CardContent>
      <p>이 카드는 호버 효과와 클릭 이벤트가 있습니다.</p>
    </CardContent>
  </UnifiedCard>;

// 다양한 패딩 옵션
export const PaddingVariants = () => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '400px'
}}>
    <UnifiedCard padding="none">
      <CardContent>패딩 없음</CardContent>
    </UnifiedCard>
    
    <UnifiedCard padding="small">
      <CardContent>작은 패딩</CardContent>
    </UnifiedCard>
    
    <UnifiedCard padding="normal">
      <CardContent>기본 패딩</CardContent>
    </UnifiedCard>
    
    <UnifiedCard padding="large">
      <CardContent>큰 패딩</CardContent>
    </UnifiedCard>
  </div>;

// 복잡한 레이아웃 예시
export const ComplexLayout = () => <UnifiedCard>
    <CardHeader title="영상 프로젝트" subtitle="신제품 런칭 캠페인" action={<div style={{
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#28a745'
  }} />} />
    <CardContent>
      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    }}>
        <div>
          <div style={{
          fontSize: '12px',
          color: '#8B8B8D',
          marginBottom: '4px'
        }}>진행률</div>
          <div style={{
          fontSize: '24px',
          fontWeight: '600'
        }}>75%</div>
        </div>
        <div>
          <div style={{
          fontSize: '12px',
          color: '#8B8B8D',
          marginBottom: '4px'
        }}>마감일</div>
          <div style={{
          fontSize: '24px',
          fontWeight: '600'
        }}>D-7</div>
        </div>
      </div>
      
      <div style={{
      marginTop: '16px'
    }}>
        <div style={{
        height: '4px',
        background: '#E5E5E7',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
          <div style={{
          width: '75%',
          height: '100%',
          background: '#0066FF',
          transition: 'width 0.3s ease'
        }} />
        </div>
      </div>
    </CardContent>
    <CardFooter align="between">
      <span style={{
      fontSize: '14px',
      color: '#8B8B8D'
    }}>
        팀원 5명
      </span>
      <UnifiedButton style={{
      background: '#0066FF',
      border: 'none',
      padding: '6px 16px',
      color: 'white',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer'
    }} aria-label="Click">
        상세보기 →
      </UnifiedButton>
    </CardFooter>
  </UnifiedCard>;