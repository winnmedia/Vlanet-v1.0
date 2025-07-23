import React from 'react'
import { useRouter } from '../util/nextNavigation'
import { Button, Result } from 'antd'

export default function NotFound() {
  const { navigate } = useRouter()

  return (
    <div className="not-found-container">
      <Result
        status="404"
        title="404"
        subTitle="죄송합니다. 요청하신 페이지를 찾을 수 없습니다."
        extra={[
          <Button 
            type="primary" 
            key="home"
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
              border: 'none'
            }}
          >
            홈으로 돌아가기
          </Button>,
          <Button 
            key="back"
            onClick={() => navigate(-1)}
          >
            이전 페이지로
          </Button>
        ]}
      />
    </div>
  )
}