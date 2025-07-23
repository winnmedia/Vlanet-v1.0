import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Spin, Card, Button, Typography, Space } from 'antd'
import { LoadingOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons'
import 'css/Admin/AdminRedirect.scss'

const { Title, Text, Paragraph } = Typography

export default function AdminRedirect() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.ProjectStore)
  const backendAdminUrl = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL.replace('/api', '')}/admin/`
    : 'https://videoplanet.up.railway.app/admin/'

  useEffect(() => {
    // 3초 후 자동 리다이렉트
    const timer = setTimeout(() => {
      window.location.href = backendAdminUrl
    }, 3000)

    return () => clearTimeout(timer)
  }, [backendAdminUrl])

  const handleImmediateRedirect = () => {
    window.location.href = backendAdminUrl
  }

  const handleGoToDashboard = () => {
    navigate('/AdminDashboard')
  }

  return (
    <div className="admin-redirect-container">
      <Card className="admin-redirect-card">
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
            spinning={true}
          />
          
          <Title level={2}>
            <SettingOutlined /> Django 관리자 페이지로 이동 중...
          </Title>
          
          <Paragraph type="secondary">
            3초 후 자동으로 백엔드 관리자 페이지로 이동합니다.
          </Paragraph>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleImmediateRedirect}
              block
              style={{
                background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                border: 'none',
                height: 'auto',
                padding: '12px 24px'
              }}
            >
              지금 바로 이동
            </Button>
            
            <Button 
              size="large" 
              onClick={handleGoToDashboard}
              icon={<DashboardOutlined />}
              block
            >
              프론트엔드 대시보드로 이동
            </Button>
          </Space>
          
          <div className="admin-info">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Django Admin URL: {backendAdminUrl}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}