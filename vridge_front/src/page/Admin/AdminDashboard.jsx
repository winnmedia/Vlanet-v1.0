import React, { useEffect, useState, lazy, Suspense } from 'react'
import { UnifiedButton } from '../../components/unified/UnifiedButton';

import { Input } from '../../components/unified/Input'
import { useRouter } from '../../util/nextNavigation'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'

import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'
import { checkSession } from '../../util/util'
import { Card, Row, Col, Statistic, Button, Table, Tag, Space, Alert, Spin, Tabs, Input, Select, Badge, Progress, Empty, Divider } from 'antd'
import { 
  UserOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  FileTextOutlined,
  SettingOutlined,
  DatabaseOutlined,
  MailOutlined,
  LineChartOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  FolderOpenOutlined,
  CommentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons'
import { axiosCredentials } from '../../util/util'
import moment from 'moment'
import 'moment/locale/ko'
// Dynamic import for chart components to avoid SSR issues
const Line = dynamic(
  () => import('@ant-design/plots').then(mod => mod.Line),
  { 
    ssr: false,
    loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin tip="차트 로딩 중..." /></div>
  }
)

const Column = dynamic(
  () => import('@ant-design/plots').then(mod => mod.Column),
  { 
    ssr: false,
    loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin tip="차트 로딩 중..." /></div>
  }
)
import { message } from 'antd'

export default function AdminDashboard() {
  const { navigate } = useRouter()
  const { user, project_list } = useSelector((s) => s.ProjectStore)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [feedbackStats, setFeedbackStats] = useState(null)
  const [systemInfo, setSystemInfo] = useState(null)
  const [userPage, setUserPage] = useState(1)
  const [projectPage, setProjectPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [userFilter, setUserFilter] = useState({})
  const [projectFilter, setProjectFilter] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    
    // 관리자 권한 확인 및 데이터 로드
    loadDashboardData()
  }, [navigate])

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUserList()
    } else if (isAdmin && activeTab === 'projects') {
      loadProjectList()
    } else if (isAdmin && activeTab === 'feedbacks') {
      loadFeedbackStats()
    } else if (isAdmin && activeTab === 'system') {
      loadSystemInfo()
    }
  }, [activeTab, isAdmin])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 관리자 권한 확인 (실제로는 백엔드에서 확인)
      // 여기서는 임시로 이메일로 체크
      const adminEmails = ['admin@vlanet.net', 'admin@example.com', 'test@example.com']
      const userIsAdmin = adminEmails.includes(user)
      setIsAdmin(userIsAdmin)
      
      if (!userIsAdmin) {
        setLoading(false)
        return
      }
      
      // 타임아웃 없이 즉시 프론트엔드 데이터 사용
      const totalProjects = project_list?.length || 0
      const activeProjects = project_list?.filter(p => {
        const hasRecentActivity = moment(p.updated).isAfter(moment().subtract(30, 'days'))
        return hasRecentActivity
      }).length || 0
      
      const totalMembers = project_list?.reduce((acc, project) => {
        return acc + (project.member_list?.length || 0) + 1
      }, 0) || 0
      
      setStats({
        users: { total: totalMembers, active: Math.floor(totalMembers * 0.7), recent: Math.floor(totalMembers * 0.3) },
        projects: { total: totalProjects, active: activeProjects },
        feedbacks: { total: 0, pending: 0 },
        planning: { total: 0, completed: 0 }
      })
      
      // 최근 프로젝트 설정
      if (project_list && Array.isArray(project_list)) {
        const sortedProjects = [...project_list].sort((a, b) => 
          moment(b.updated || b.created).valueOf() - moment(a.updated || a.created).valueOf()
        )
        setRecentProjects(sortedProjects.slice(0, 5))
      }
      
    } catch (error) {} finally {
      setLoading(false)
    }
  }

  const loadUserList = async (page = 1, search = '', filters = {}) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃
      
      const params = {
        page,
        per_page: 20,
        search,
        ...filters
      }
      
      const response = await axiosCredentials.get('/admin-dashboard/users/', { 
        params,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.data.status === 'success') {
        setUsers(response.data.data.users)
        setUserPage(response.data.data.pagination.page)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.error('데이터 로드 시간이 초과되었습니다.')
      } else {}
      setUsers([])
    }
  }

  const loadProjectList = async (page = 1, search = '', filters = {}) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃
      
      const params = {
        page,
        per_page: 20,
        search,
        ...filters
      }
      
      const response = await axiosCredentials.get('/admin-dashboard/projects/', { 
        params,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.data.status === 'success') {
        setProjects(response.data.data.projects)
        setProjectPage(response.data.data.pagination.page)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.error('데이터 로드 시간이 초과되었습니다.')
      } else {}
      setProjects([])
    }
  }

  const loadFeedbackStats = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃
      
      const response = await axiosCredentials.get('/admin-dashboard/feedbacks/', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.data.status === 'success') {
        setFeedbackStats(response.data.data)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.error('데이터 로드 시간이 초과되었습니다.')
      } else {}
      setFeedbackStats(null)
    }
  }

  const loadSystemInfo = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃
      
      const response = await axiosCredentials.get('/admin-dashboard/system/', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.data.status === 'success') {
        setSystemInfo(response.data.data)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.error('데이터 로드 시간이 초과되었습니다.')
      } else {}
      setSystemInfo(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    if (activeTab === 'users') {
      await loadUserList(userPage, userSearch, userFilter)
    } else if (activeTab === 'projects') {
      await loadProjectList(projectPage, projectSearch, projectFilter)
    } else if (activeTab === 'feedbacks') {
      await loadFeedbackStats()
    } else if (activeTab === 'system') {
      await loadSystemInfo()
    }
    setRefreshing(false)
  }

  const handleGoToBackendAdmin = () => {
    navigate('/admin')
  }

  const handleGoToEmailMonitor = () => {
    navigate('/emailmonitor')
  }

  const handleUserAction = async (userId, action) => {
    try {
      const response = await axiosCredentials.patch('/admin-dashboard/users/', {
        user_id: userId,
        action: action
      })
      
      if (response.data.status === 'success') {
        message.success(response.data.message)
        loadUserList(userPage, userSearch, userFilter)
      }
    } catch (error) {
      message.error('사용자 상태 변경 실패')
    }
  }

  const handleProjectDelete = async (projectId) => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const response = await axiosCredentials.delete('/admin-dashboard/projects/', {
          data: { project_id: projectId }
        })
        
        if (response.data.status === 'success') {
          message.success(response.data.message)
          loadProjectList(projectPage, projectSearch, projectFilter)
          loadDashboardData()
        }
      } catch (error) {
        message.error('프로젝트 삭제 실패')
      }
    }
  }

  const projectColumns = [
    {
      title: '프로젝트명',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a 
          onClick={() => navigate(`/ProjectView/${record.id}`)} 
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/ProjectView/${record.id}`)}
          role="link"
          tabIndex={0}>
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
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/ProjectView/${record.id}`)}
            aria-label="프로젝트 보기"
          >
            보기
          </Button>
        </Space>
      )
    }
  ]

  const userColumns = [
    {
      title: '사용자명',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '닉네임',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '가입 방법',
      dataIndex: 'login_method',
      key: 'login_method',
      render: (method) => {
        const colorMap = {
          email: 'blue',
          google: 'red',
          kakao: 'gold',
          naver: 'green'
        }
        return <Tag color={colorMap[method] || 'default'}>{method}</Tag>
      }
    },
    {
      title: '상태',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      )
    },
    {
      title: '프로젝트',
      dataIndex: 'projects_count',
      key: 'projects_count',
      render: (count) => `${count}개`
    },
    {
      title: '가입일',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: '액션',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            onClick={() => handleUserAction(record.id, 'toggle_active')}
            onKeyDown={(e) => e.key === 'Enter' && handleUserAction(record.id, 'toggle_active')}
            aria-label={record.is_active ? '사용자 비활성화' : '사용자 활성화'}
          >
            {record.is_active ? '비활성화' : '활성화'}
          </Button>
        </Space>
      )
    }
  ]

  const adminProjectColumns = [
    {
      title: '프로젝트명',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <div style={{ width: 12, height: 12, backgroundColor: record.color, borderRadius: '50%' }} />
          <a onClick={() => navigate(`/ProjectView/${record.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/ProjectView/${record.id}`)}>{text}</a>
        </Space>
      )
    },
    {
      title: '담당자',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '제작 단계',
      dataIndex: 'production_phase',
      key: 'production_phase',
      render: (phase) => {
        const phaseMap = {
          'planning': '기획',
          'production': '제작',
          'post': '후반작업',
          'completed': '완료'
        }
        return phaseMap[phase] || phase
      }
    },
    {
      title: '멤버/피드백',
      key: 'stats',
      render: (_, record) => (
        <Space>
          <span><TeamOutlined /> {record.member_count}</span>
          <span><CommentOutlined /> {record.feedback_count}</span>
        </Space>
      )
    },
    {
      title: '상태',
      key: 'status',
      render: (_, record) => (
        <Badge 
          status={record.is_active ? 'success' : 'default'} 
          text={record.is_active ? '활성' : '비활성'} 
        />
      )
    },
    {
      title: '업데이트',
      dataIndex: 'updated',
      key: 'updated',
      render: (date) => moment(date).fromNow()
    },
    {
      title: '액션',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            aria-label="View project"
            onClick={() => navigate(`/ProjectView/${record.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/ProjectView/${record.id}`)}
          />
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleProjectDelete(record.id)} onKeyDown={(e) => e.key === 'Enter' && handleProjectDelete(record.id)}
          />
        </Space>
      )
    }
  ]

  if (!isAdmin) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main className="admin-dashboard" role="main">
            <Alert
              message="권한 없음"
              description="관리자 권한이 필요한 페이지입니다."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => navigate('/cmshome')} onKeyDown={(e) => e.key === 'Enter' && navigate('/cmshome')}>
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
        <main className="admin-dashboard enhanced" role="main">
          <div className="dashboard-header">
            <h1 className="title">
              <SettingOutlined /> 관리자 대시보드
            </h1>
            <Space>
              <Button 
                icon={<DatabaseOutlined />}
                onClick={handleGoToBackendAdmin} onKeyDown={(e) => e.key === 'Enter' && handleGoToBackendAdmin}
              >
                Django Admin
              </Button>
              <Button 
                icon={<MailOutlined />}
                onClick={handleGoToEmailMonitor} onKeyDown={(e) => e.key === 'Enter' && handleGoToEmailMonitor}
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
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                  {
                    key: 'dashboard',
                    label: (
                      <span>
                        <DashboardOutlined />
                        대시보드
                      </span>
                    ),
                    children: (
                      <>
                        {/* 통계 카드 */}
                        <Row gutter={[16, 16]} className="stats-row">
                          <Col xs={24} sm={12} lg={6}>
                            <Card>
                              <Statistic
                                title="전체 사용자"
                                value={stats?.users?.total || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1631F8' }}
                                suffix={
                                  <span style={{ fontSize: 14, color: '#52c41a' }}>
                                    +{stats?.users?.recent || 0}
                                  </span>
                                }
                              />
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} lg={6}>
                            <Card>
                              <Statistic
                                title="전체 프로젝트"
                                value={stats?.projects?.total || 0}
                                prefix={<ProjectOutlined />}
                                valueStyle={{ color: '#1631F8' }}
                                suffix={
                                  <span style={{ fontSize: 14, color: '#666' }}>
                                    활성 {stats?.projects?.active || 0}
                                  </span>
                                }
                              />
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} lg={6}>
                            <UnifiedCard>
                              <Statistic
                                title="총 피드백"
                                value={stats?.feedbacks?.total || 0}
                                prefix={<FileTextOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                                suffix={
                                  <Badge count={stats?.feedbacks?.pending || 0} />
                                }
                              />
                            </UnifiedCard>
                          </Col>
                          <Col xs={24} sm={12} lg={6}>
                            <UnifiedCard>
                              <Statistic
                                title="영상 기획"
                                value={stats?.planning?.total || 0}
                                prefix={<LineChartOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                                suffix={
                                  <Progress 
                                    percent={stats?.planning?.total ? Math.round((stats?.planning?.completed / stats?.planning?.total) * 100) : 0} 
                                    size="small" 
                                    showInfo={false}
                                  />
                                }
                              />
                            </UnifiedCard>
                          </Col>
                        </Row>

                        {/* 차트 섹션 */}
                        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                          <Col xs={24} lg={12}>
                            <UnifiedCard title="가입자 추이 (최근 30일)">
                              {stats?.trends?.daily_signups && (
                                <Line
                                  data={stats.trends.daily_signups.reverse()}
                                  xField="date"
                                  yField="count"
                                  point={{ size: 5, shape: 'diamond' }}
                                  height={200}
                                  color="#1631F8"
                                  xAxis={{
                                    tickCount: 5,
                                  }}
                                />
                              )}
                            </UnifiedCard>
                          </Col>
                          <Col xs={24} lg={12}>
                            <UnifiedCard title="로그인 방법별 사용자">
                              {stats?.users?.by_login_method && (
                                <Column
                                  data={stats.users.by_login_method}
                                  xField="login_method"
                                  yField="count"
                                  height={200}
                                  color={(datum) => {
                                    const colors = {
                                      email: '#1631F8',
                                      google: '#EA4335',
                                      kakao: '#FEE500',
                                      naver: '#03C75A'
                                    }
                                    return colors[datum.login_method] || '#666'
                                  }}
                                  label={{
                                    position: 'top',
                                  }}
                                />
                              )}
                            </UnifiedCard>
                          </Col>
                        </Row>

                        {/* 빠른 액션 */}
                        <UnifiedCard title="빠른 액션" className="quick-actions" style={{ marginTop: 24 }}>
                          <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8} lg={6}>
                              <Button 
                                type="primary" 
                                block 
                                icon={<UserOutlined />}
                                onClick={() => setActiveTab('users')} 
                                onKeyDown={(e) => e.key === 'Enter' && setActiveTab('users')}
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
                                onClick={() => setActiveTab('projects')} 
                                onKeyDown={(e) => e.key === 'Enter' && setActiveTab('projects')}
                              >
                                프로젝트 관리
                              </Button>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                              <Button 
                                block 
                                icon={<CommentOutlined />}
                                onClick={() => setActiveTab('feedbacks')} 
                                onKeyDown={(e) => e.key === 'Enter' && setActiveTab('feedbacks')}
                              >
                                피드백 분석
                              </Button>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                              <Button 
                                block 
                                icon={<InfoCircleOutlined />}
                                onClick={() => setActiveTab('system')} onKeyDown={(e) => e.key === 'Enter' && () => setActiveTab('system')}
                              >
                                시스템 정보
                              </Button>
                            </Col>
                          </Row>
                        </UnifiedCard>

                        {/* 최근 프로젝트 */}
                        <UnifiedCard title="최근 생성된 프로젝트" className="recent-projects" style={{ marginTop: 24 }}>
                          <Table 
                            columns={projectColumns} 
                            dataSource={recentProjects}
                            rowKey="id"
                            pagination={false}
                            size="small"
                          />
                        </UnifiedCard>
                      </>
                    )
                  },
                  {
                    key: 'users',
                    label: (
                      <span>
                        <UsergroupAddOutlined />
                        사용자 관리
                      </span>
                    ),
                    children: (
                      <>
                        <UnifiedCard title="사용자 목록"
                          extra={
                            <Space>
                              <UnifiedInput placeholder="사용자 검색"
                                prefix={<SearchOutlined  / aria-label="사용자 검색">}
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                onPressEnter={() => loadUserList(1, userSearch, userFilter)}
                                style={{ width: 200 }}
                              />
                              <Select
                                placeholder="가입 방법"
                                style={{ width: 120 }}
                                allowClear
                                onChange={(value) => {
                                  const newFilter = { ...userFilter }
                                  if (value) {
                                    newFilter.login_method = value
                                  } else {
                                    delete newFilter.login_method
                                  }
                                  setUserFilter(newFilter)
                                  loadUserList(1, userSearch, newFilter)
                                }}
                              >
                                <Select.Option value="email">이메일</Select.Option>
                                <Select.Option value="google">구글</Select.Option>
                                <Select.Option value="kakao">카카오</Select.Option>
                                <Select.Option value="naver">네이버</Select.Option>
                              </Select>
                              <Button
                                icon={<ReloadOutlined />}
                                onClick={() => loadUserList(1, userSearch, userFilter)} onKeyDown={(e) => e.key === 'Enter' && () => loadUserList(1, userSearch, userFilter)}
                              />
                            </Space>
                          }
                        >
                          <Table
                            columns={userColumns}
                            dataSource={users}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                              current: userPage,
                              pageSize: 20,
                              onChange: (page) => loadUserList(page, userSearch, userFilter)
                            }}
                          />
                        </UnifiedCard>
                      </>
                    )
                  },
                  {
                    key: 'projects',
                    label: (
                      <span>
                        <FolderOpenOutlined />
                        프로젝트 관리
                      </span>
                    ),
                    children: (
                      <>
                        <UnifiedCard title="프로젝트 목록"
                          extra={
                            <Space>
                              <UnifiedInput placeholder="프로젝트 검색"
                                prefix={<SearchOutlined  / aria-label="프로젝트 검색">}
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                onPressEnter={() => loadProjectList(1, projectSearch, projectFilter)}
                                style={{ width: 200 }}
                              />
                              <Select
                                placeholder="제작 단계"
                                style={{ width: 120 }}
                                allowClear
                                onChange={(value) => {
                                  const newFilter = { ...projectFilter }
                                  if (value) {
                                    newFilter.production_phase = value
                                  } else {
                                    delete newFilter.production_phase
                                  }
                                  setProjectFilter(newFilter)
                                  loadProjectList(1, projectSearch, newFilter)
                                }}
                              >
                                <Select.Option value="planning">기획</Select.Option>
                                <Select.Option value="production">제작</Select.Option>
                                <Select.Option value="post">후반작업</Select.Option>
                                <Select.Option value="completed">완료</Select.Option>
                              </Select>
                              <Button
                                icon={<ReloadOutlined />}
                                onClick={() => loadProjectList(1, projectSearch, projectFilter)} onKeyDown={(e) => e.key === 'Enter' && () => loadProjectList(1, projectSearch, projectFilter)}
                              />
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/project/create')} onKeyDown={(e) => e.key === 'Enter' && () => navigate('/project/create')}
                                style={{
                                  background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                                  border: 'none'
                                }}
                              >
                                새 프로젝트
                              </Button>
                            </Space>
                          }
                        >
                          <Table
                            columns={adminProjectColumns}
                            dataSource={projects}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                              current: projectPage,
                              pageSize: 20,
                              onChange: (page) => loadProjectList(page, projectSearch, projectFilter)
                            }}
                          />
                        </UnifiedCard>
                      </>
                    )
                  },
                  {
                    key: 'feedbacks',
                    label: (
                      <span>
                        <CommentOutlined />
                        피드백 분석
                      </span>
                    ),
                    children: (
                      <>
                        {feedbackStats ? (
                          <>
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Card>
                                  <Statistic
                                    title="전체 피드백"
                                    value={feedbackStats.total}
                                    prefix={<CommentOutlined />}
                                  />
                                </UnifiedCard>
                              </Col>
                              <Col span={12}>
                                <Card>
                                  <Statistic
                                    title="읽지 않은 피드백"
                                    value={feedbackStats.unread}
                                    prefix={<Badge status="processing" />}
                                    valueStyle={{ color: '#fa8c16' }}
                                  />
                                </UnifiedCard>
                              </Col>
                            </Row>
                            
                            <UnifiedCard title="프로젝트별 피드백 현황" style={{ marginTop: 16 }}>
                              {feedbackStats.by_project?.length > 0 ? (
                                <Table
                                  dataSource={feedbackStats.by_project}
                                  rowKey="project__id"
                                  pagination={false}
                                  columns={[
                                    {
                                      title: '프로젝트',
                                      dataIndex: 'project__name',
                                      key: 'project__name',
                                    },
                                    {
                                      title: '전체 피드백',
                                      dataIndex: 'total',
                                      key: 'total',
                                      sorter: (a, b) => a.total - b.total,
                                    },
                                    {
                                      title: '읽지 않음',
                                      dataIndex: 'unread',
                                      key: 'unread',
                                      render: (unread) => (
                                        unread > 0 ? <Badge count={unread} /> : <span>0</span>
                                      )
                                    },
                                    {
                                      title: '액션',
                                      key: 'action',
                                      render: (_, record) => (
                                        <Button
                                          size="small"
                                          type="link"
                                          onClick={() => navigate(`/Feedback/${record.project__id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/Feedback/${record.project__id}`)}
                                        >
                                          보기
                                        </Button>
                                      )
                                    }
                                  ]}
                                />
                              ) : (
                                <Empty description="피드백 데이터가 없습니다" />
                              )}
                            </UnifiedCard>
                            
                            <UnifiedCard title="최근 피드백" style={{ marginTop: 16 }}>
                              {feedbackStats.recent?.length > 0 ? (
                                <Table
                                  dataSource={feedbackStats.recent}
                                  rowKey="id"
                                  pagination={false}
                                  columns={[
                                    {
                                      title: '프로젝트',
                                      dataIndex: 'project_name',
                                      key: 'project_name',
                                    },
                                    {
                                      title: '내용',
                                      dataIndex: 'content',
                                      key: 'content',
                                      ellipsis: true,
                                    },
                                    {
                                      title: '상태',
                                      dataIndex: 'is_read',
                                      key: 'is_read',
                                      render: (isRead) => (
                                        <Tag color={isRead ? 'default' : 'orange'}>
                                          {isRead ? '읽음' : '읽지 않음'}
                                        </Tag>
                                      )
                                    },
                                    {
                                      title: '작성일',
                                      dataIndex: 'created',
                                      key: 'created',
                                      render: (date) => moment(date).fromNow()
                                    }
                                  ]}
                                />
                              ) : (
                                <Empty description="최근 피드백이 없습니다" />
                              )}
                            </UnifiedCard>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" />
                          </div>
                        )}
                      </>
                    )
                  },
                  {
                    key: 'system',
                    label: (
                      <span>
                        <InfoCircleOutlined />
                        시스템 정보
                      </span>
                    ),
                    children: (
                      <>
                        {systemInfo ? (
                          <>
                            <Row gutter={[16, 16]}>
                              <Col xs={24} lg={12}>
                                <UnifiedCard title="시스템 환경">
                                  <p><strong>Django 버전:</strong> {systemInfo.django_version}</p>
                                  <p><strong>Python 버전:</strong> {systemInfo.python_version}</p>
                                  <p><strong>디버그 모드:</strong> {systemInfo.debug_mode ? '활성' : '비활성'}</p>
                                  <p><strong>타임존:</strong> {systemInfo.time_zone}</p>
                                  <p><strong>데이터베이스:</strong> {systemInfo.database.engine}</p>
                                  <Divider />
                                  <p><strong>프론트엔드 버전:</strong> {process.env.NEXT_PUBLIC_VERSION || '0.2.4'}</p>
                                  <p><strong>API 서버:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
                                </UnifiedCard>
                              </Col>
                              <Col xs={24} lg={12}>
                                <UnifiedCard title="데이터베이스 통계">
                                  <p><strong>총 레코드 수:</strong> {systemInfo.database.total_records.toLocaleString()}</p>
                                  <Divider />
                                  <p><strong>사용자:</strong> {systemInfo.database.tables.users.toLocaleString()}명</p>
                                  <p><strong>프로젝트:</strong> {systemInfo.database.tables.projects.toLocaleString()}개</p>
                                  <p><strong>피드백:</strong> {systemInfo.database.tables.feedbacks.toLocaleString()}개</p>
                                  <p><strong>영상 기획:</strong> {systemInfo.database.tables.planning.toLocaleString()}개</p>
                                  <p><strong>미디어 파일:</strong> {systemInfo.media.total_files.toLocaleString()}개</p>
                                </UnifiedCard>
                              </Col>
                            </Row>
                            
                            <UnifiedCard title="허용된 호스트" style={{ marginTop: 16 }}>
                              <Space wrap>
                                {systemInfo.allowed_hosts.map((host, index) => (
                                  <Tag key={index}>{host}</Tag>
                                ))}
                              </Space>
                            </UnifiedCard>
                            
                            <UnifiedCard title="관리 도구" style={{ marginTop: 16 }}>
                              <Space wrap>
                                <Button
                                  icon={<DatabaseOutlined />}
                                  onClick={handleGoToBackendAdmin} onKeyDown={(e) => e.key === 'Enter' && handleGoToBackendAdmin}
                                >
                                  Django Admin
                                </Button>
                                <Button
                                  icon={<MailOutlined />}
                                  onClick={handleGoToEmailMonitor} onKeyDown={(e) => e.key === 'Enter' && handleGoToEmailMonitor}
                                >
                                  이메일 모니터
                                </Button>
                                <Button
                                  icon={<ExportOutlined />}
                                  disabled
                                >
                                  데이터 내보내기
                                </Button>
                                <Button
                                  icon={<ReloadOutlined />}
                                  onClick={() => loadSystemInfo()} onKeyDown={(e) => e.key === 'Enter' && () => loadSystemInfo()}
                                >
                                  새로고침
                                </Button>
                              </Space>
                            </UnifiedCard>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" />
                          </div>
                        )}
                      </>
                    )
                  }
                ]}
              />
            </div>
          )}
        </main>
      </div>
    </PageTemplate>
  )
}