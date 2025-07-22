import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import './AdminDashboard.scss'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import { checkSession } from 'util/util'
import { Card, Row, Col, Statistic, Button, Table, Tag, Space, Alert, Spin } from 'antd'
import { 
  UserOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  FileTextOutlined,
  SettingOutlined,
  DatabaseOutlined,
  MailOutlined,
  LineChartOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { axiosCredentials } from 'util/util'
import moment from 'moment'
import 'moment/locale/ko'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, project_list } = useSelector((s) => s.ProjectStore)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
      return
    }
    
    // 관리자 권한 확인 및 데이터 로드
    loadDashboardData()
  }, [navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 관리자 권한 확인 (실제로는 백엔드에서 확인)
      // 여기서는 임시로 이메일로 체크
      const adminEmails = ['admin@vlanet.net', 'admin@example.com']
      const userIsAdmin = adminEmails.includes(user)
      setIsAdmin(userIsAdmin)
      
      if (!userIsAdmin) {
        setLoading(false)
        return
      }
      
      // 통계 데이터 계산 (프론트엔드에서 가능한 것들)
      const totalProjects = project_list.length
      const activeProjects = project_list.filter(p => {
        const hasRecentActivity = moment(p.updated).isAfter(moment().subtract(30, 'days'))
        return hasRecentActivity
      }).length
      
      const totalMembers = project_list.reduce((acc, project) => {
        return acc + (project.member_list?.length || 0) + 1 // +1 for owner
      }, 0)
      
      // 최근 프로젝트
      const recent = project_list
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5)
      
      setStats({
        totalProjects,
        activeProjects,
        totalMembers,
        totalFeedbacks: project_list.reduce((acc, p) => acc + (p.feedback?.length || 0), 0)
      })
      
      setRecentProjects(recent)
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToBackendAdmin = () => {
    navigate('/admin')
  }

  const handleGoToEmailMonitor = () => {
    navigate('/EmailMonitor')
  }

  const projectColumns = [
    {
      title: '프로젝트명',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/ProjectView/${record.id}`)}>
          <Tag color={record.color}>{text}</Tag>
        </a>
      )
    },
    {
      title: '담당자',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '소유자',
      dataIndex: 'owner_nickname',
      key: 'owner_nickname',
    },
    {
      title: '멤버 수',
      key: 'members',
      render: (_, record) => (
        <span>{(record.member_list?.length || 0) + 1}명</span>
      )
    },
    {
      title: '생성일',
      dataIndex: 'created',
      key: 'created',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: '액션',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            size="small" 
            type="link"
            onClick={() => navigate(`/ProjectView/${record.id}`)}
          >
            보기
          </Button>
        </Space>
      )
    }
  ]

  if (!isAdmin) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main className="admin-dashboard">
            <Alert
              message="권한 없음"
              description="관리자 권한이 필요한 페이지입니다."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => navigate('/CmsHome')}>
                  홈으로 이동
                </Button>
              }
            />
          </main>
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main className="admin-dashboard enhanced">
          <div className="dashboard-header">
            <h1 className="title">
              <SettingOutlined /> 관리자 대시보드
            </h1>
            <Space>
              <Button 
                icon={<DatabaseOutlined />}
                onClick={handleGoToBackendAdmin}
              >
                Django Admin
              </Button>
              <Button 
                icon={<MailOutlined />}
                onClick={handleGoToEmailMonitor}
              >
                이메일 모니터
              </Button>
            </Space>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="데이터를 불러오는 중..." />
            </div>
          ) : (
            <div className="dashboard-content">
              {/* 통계 카드 */}
              <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="전체 프로젝트"
                      value={stats?.totalProjects || 0}
                      prefix={<ProjectOutlined />}
                      valueStyle={{ color: '#1631F8' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="활성 프로젝트"
                      value={stats?.activeProjects || 0}
                      prefix={<LineChartOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="총 참여자"
                      value={stats?.totalMembers || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="총 피드백"
                      value={stats?.totalFeedbacks || 0}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#eb2f96' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 빠른 액션 */}
              <Card title="빠른 액션" className="quick-actions">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Button 
                      type="primary" 
                      block 
                      icon={<UserOutlined />}
                      onClick={() => navigate('/admin')}
                      style={{
                        background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                        border: 'none'
                      }}
                    >
                      사용자 관리
                    </Button>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Button 
                      block 
                      icon={<ProjectOutlined />}
                      onClick={() => navigate('/CmsHome')}
                    >
                      프로젝트 관리
                    </Button>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Button 
                      block 
                      icon={<MailOutlined />}
                      onClick={() => navigate('/EmailMonitor')}
                    >
                      이메일 큐 관리
                    </Button>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Button 
                      block 
                      icon={<ExportOutlined />}
                      disabled
                    >
                      데이터 내보내기
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* 최근 프로젝트 */}
              <Card title="최근 생성된 프로젝트" className="recent-projects">
                <Table 
                  columns={projectColumns} 
                  dataSource={recentProjects}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>

              {/* 시스템 정보 */}
              <Card title="시스템 정보" className="system-info">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <p><strong>프론트엔드 버전:</strong> {process.env.REACT_APP_VERSION || '0.2.4'}</p>
                    <p><strong>API 서버:</strong> {process.env.REACT_APP_API_URL || 'https://videoplanet.up.railway.app'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>현재 사용자:</strong> {user}</p>
                    <p><strong>접속 시간:</strong> {moment().format('YYYY-MM-DD HH:mm:ss')}</p>
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </main>
      </div>
    </PageTemplate>
  )
}