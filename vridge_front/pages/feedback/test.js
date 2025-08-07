import React from 'react'
import { useRouter } from 'next/router';
import { Button, Result } from 'antd';

/**
 * 피드백 테스트 페이지
 * 개발 환경에서 피드백 시스템 테스트용
 */
const FeedbackTestPage = () => {
  const router = useRouter();

  return (
    <div style={{ padding: '50px' }}>
      <Result
        status="info"
        title="피드백 테스트 페이지"
        subTitle="이 페이지는 개발 환경에서 피드백 시스템을 테스트하기 위한 페이지입니다."
        extra={[
          <Button 
            type="primary" 
            key="feedback"
            onClick={() => router.push('/cms/feedback')}
          >
            피드백 페이지로 이동
          </Button>,
          <Button 
            key="home"
            onClick={() => router.push('/')}
          >
            홈으로
          </Button>,
        ]}
      />
    </div>
  );
};

export default FeedbackTestPage;