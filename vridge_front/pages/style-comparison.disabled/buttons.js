import React from 'react'
import { UnifiedButton } from '../../src/components/unified/UnifiedButton';
import dynamic from 'next/dynamic'
const oldStyles = dynamic(() => import('../../src/page/Cms/FeedbackButtonStyles.module.scss'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;



const FeedbackButton = dynamic(() => import('../../src/design-system/components/Button/FeedbackButton'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const Button = dynamic(() => import('../../src/design-system/components/Button'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default function ButtonComparison() {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f5' }}>
      <h1>버튼 스타일 비교</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>Primary 버튼</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p>기존 스타일:</p>
            <UnifiedButton className={oldStyles.feedbackButtonPrimary} aria-label="Click">
              기본 버튼
            </UnifiedButton>
          </div>
          <div>
            <p>새 컴포넌트:</p>
            <Button variant="primary" data-testid="new-button-primary" aria-label="Click">
              기본 버튼
            </Button>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Secondary 버튼</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p>기존 스타일:</p>
            <UnifiedButton className={oldStyles.feedbackButtonSecondary} aria-label="Click">
              보조 버튼
            </UnifiedButton>
          </div>
          <div>
            <p>새 컴포넌트:</p>
            <Button variant="secondary" data-testid="new-button-secondary" aria-label="Click">
              보조 버튼
            </Button>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Danger 버튼</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p>기존 스타일:</p>
            <UnifiedButton className={oldStyles.feedbackButtonDanger} aria-label="Click">
              삭제
            </UnifiedButton>
          </div>
          <div>
            <p>새 컴포넌트:</p>
            <Button variant="danger" data-testid="new-button-danger" aria-label="Click">
              삭제
            </Button>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Icon Only 버튼</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p>기존 스타일:</p>
            <UnifiedButton className={oldStyles.feedbackButtonIconOnly} aria-label="Click">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </UnifiedButton>
          </div>
          <div>
            <p>새 컴포넌트:</p>
            <Button variant="secondary" iconOnly data-testid="new-button-icon" aria-label="Click">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </Button>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>피드백 액션 버튼</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p>기존 스타일:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <UnifiedButton className={`${oldStyles.feedbackAction} ${oldStyles.like}`} aria-label="Click">
                좋아요
              </UnifiedButton>
              <UnifiedButton className={`${oldStyles.feedbackAction} ${oldStyles.needExplanation}`} aria-label="Click">
                추가 설명 필요
              </UnifiedButton>
            </div>
          </div>
          <div>
            <p>새 컴포넌트:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <FeedbackButton feedbackType="like">
                좋아요
              </FeedbackButton>
              <FeedbackButton feedbackType="needExplanation">
                추가 설명 필요
              </FeedbackButton>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>버튼 그룹</h2>
        <div className="button-group" style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" size="sm" aria-label="Click">취소</Button>
          <Button variant="primary" size="sm" aria-label="Click">확인</Button>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>인터랙션 테스트</h2>
        <Button variant="primary" data-testid="interactive-button" aria-label="Click">
          호버/클릭 테스트
        </Button>
      </section>

      <section className="action-buttons-container" style={{ marginBottom: '40px' }}>
        <h2>액션 버튼 컨테이너</h2>
        <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
          <Button variant="secondary" iconOnly aria-label="Click">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </Button>
          <Button variant="secondary" iconOnly aria-label="Click">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </Button>
          <Button variant="secondary" size="sm" aria-label="Click">
            전체보기
          </Button>
        </div>
      </section>
    </div>
  )
}