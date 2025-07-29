import React from 'react'
import dynamic from 'next/dynamic';;
import { useRouter } from '../util/nextNavigation';
import { Button, Result } from 'antd';

export default function NotFound() {
  const { navigate } = useRouter();

  return (
    <div className="not-found-container">
      <Result
        status="404"
        title="404"
        subTitle="죄송합니다. 요청하신 페이지를 찾을 수 없습니다."
        extra={[
        <UnifiedButton
          type="primary"
          key="home"
          onClick={() = aria-label="Click"> navigate('/')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
            border: 'none'
          }}>

            홈으로 돌아가기
          </UnifiedButton>,
        <UnifiedButton
          key="back"
          onClick={() = aria-label="Click"> navigate(-1)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate(-1)}>

            이전 페이지로
          </UnifiedButton>]
        } />

    </div>);

}