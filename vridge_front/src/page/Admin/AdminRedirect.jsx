import React, { useEffect , Suspense } from 'react'
import dynamic from 'next/dynamic';;
;

import { useRouter } from '../../util/nextNavigation';
import { useSelector } from 'react-redux';
import { Spin, Card, Button, Typography, Space } from 'antd';
import { LoadingOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons'
const UnifiedCard = dynamic(() => import('../../components/unified/UnifiedCard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

const { Title, Text, Paragraph } = Typography;

export default function AdminRedirect() {
  const { navigate } = useRouter();
  const { user } = useSelector((s) => s.ProjectStore);
  const backendAdminUrl = process.env.NEXT_PUBLIC_API_URL ?
  `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/admin/` :
  'https://videoplanet.up.railway.app/admin/';

  useEffect(() => {
    // 3초 후 자동 리다이렉트
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = backendAdminUrl;
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [backendAdminUrl]);

  const handleImmediateRedirect = () => {
    if (typeof window !== 'undefined') {
      window.location.href = backendAdminUrl;
    }
  };

  const handleGoToDashboard = () => {
    navigate('/admindashboard');
  };

  return (
    <div className="admin-redirect-container">
      <UnifiedCard className="admin-redirect-card">
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            spinning={true} />

          
          <Title level={2}>
            <SettingOutlined /> Django 관리자 페이지로 이동 중...
          </Title>
          
          <Paragraph type="secondary">
            3초 후 자동으로 백엔드 관리자 페이지로 이동합니다.
          </Paragraph>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <UnifiedButton
              type="primary"
              size="large"
              onClick={handleImmediateRedirect} onKeyDown={(e) => e.key === 'Enter' && handleImmediateRedirect}
              block
              style={{
                background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                border: 'none',
                height: 'auto',
                padding: '12px 24px'
              }} aria-label="Click">

              지금 바로 이동
            </UnifiedButton>
            
            <UnifiedButton
              size="large"
              onClick={handleGoToDashboard} 
              onKeyDown={(e) => e.key === 'Enter' && handleGoToDashboard}
              icon={<DashboardOutlined />}
              block>

              프론트엔드 대시보드로 이동
            </UnifiedButton>
          </Space>
          
          <div className="admin-info">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Django Admin URL: {backendAdminUrl}
            </Text>
          </div>
        </Space>
      </UnifiedCard>
    </div>);

}