import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.scss'
import axios from '../../api/axios'
import { toast } from 'react-toastify'

// 아이콘 컴포넌트들
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const ProjectsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
)

const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // 사용자 목록 상태
  const [users, setUsers] = useState([])
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  
  // 프로젝트 목록 상태
  const [projects, setProjects] = useState([])
  const [projectPage, setProjectPage] = useState(1)
  const [projectTotalPages, setProjectTotalPages] = useState(1)
  const [projectSearch, setProjectSearch] = useState('')
  
  // 선택된 사용자 상세 정보
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailModal, setUserDetailModal] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'projects') {
      fetchProjects()
    }
  }, [activeTab, userPage, projectPage, userSearch, userFilter, projectSearch])

  const checkAdminAccess = async () => {
    try {
      // 관리자 권한 확인 (프로필 API를 통해)
      const response = await axios.get('/users/profile')
      if (!response.data.profile.is_staff) {
        toast.error('관리자 권한이 없습니다.')
        navigate('/CmsHome')
      }
    } catch (error) {
      console.error('권한 확인 실패:', error)
      navigate('/Login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin-dashboard/dashboard')
      if (response.data.status === 'success') {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
      toast.error('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const params = {
        page: userPage,
        page_size: 20,
        search: userSearch,
        login_method: userFilter
      }
      
      const response = await axios.get('/admin-dashboard/users', { params })
      if (response.data.status === 'success') {
        setUsers(response.data.users)
        setUserTotalPages(response.data.total_pages)
      }
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error)
      toast.error('사용자 목록을 불러오는데 실패했습니다.')
    }
  }

  const fetchProjects = async () => {
    try {
      const params = {
        page: projectPage,
        page_size: 20,
        search: projectSearch
      }
      
      const response = await axios.get('/admin-dashboard/projects', { params })
      if (response.data.status === 'success') {
        setProjects(response.data.projects)
        setProjectTotalPages(response.data.total_pages)
      }
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error)
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.')
    }
  }

  const fetchUserDetail = async (userId) => {
    try {
      const response = await axios.get(`/admin-dashboard/users/${userId}`)
      if (response.data.status === 'success') {
        setSelectedUser(response.data.user)
        setUserDetailModal(true)
      }
    } catch (error) {
      console.error('사용자 상세 정보 로드 실패:', error)
      toast.error('사용자 정보를 불러오는데 실패했습니다.')
    }
  }

  const toggleUserStatus = async (userId, isActive) => {
    try {
      const response = await axios.post(`/admin-dashboard/users/${userId}`, {
        is_active: !isActive
      })
      
      if (response.data.status === 'success') {
        toast.success(`사용자가 ${!isActive ? '활성화' : '비활성화'}되었습니다.`)
        fetchUsers()
        if (selectedUser && selectedUser.id === userId) {
          fetchUserDetail(userId)
        }
      }
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error)
      toast.error('사용자 상태 변경에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">대시보드를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>관리자 대시보드</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/CmsHome')}>
            홈으로 돌아가기
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUpIcon /> 개요
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          <UsersIcon /> 사용자 관리
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          <ProjectsIcon /> 프로젝트 관리
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && dashboardData && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <UsersIcon />
                </div>
                <div className="stat-info">
                  <h3>전체 사용자</h3>
                  <div className="stat-number">{dashboardData.overview.total_users}</div>
                  <div className="stat-detail">
                    활성: {dashboardData.overview.active_users}
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon projects">
                  <ProjectsIcon />
                </div>
                <div className="stat-info">
                  <h3>전체 프로젝트</h3>
                  <div className="stat-number">{dashboardData.overview.total_projects}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon trending">
                  <TrendingUpIcon />
                </div>
                <div className="stat-info">
                  <h3>최근 가입자</h3>
                  <div className="stat-number">{dashboardData.overview.recent_signups}</div>
                  <div className="stat-detail">
                    최근 7일
                  </div>
                </div>
              </div>
            </div>

            <div className="charts-section">
              <div className="chart-card">
                <h3>로그인 방식별 사용자</h3>
                <div className="login-methods">
                  {dashboardData.login_methods.map((method, index) => (
                    <div key={index} className="method-item">
                      <span className="method-name">
                        {method.login_method === 'email' ? '이메일' : method.login_method}
                      </span>
                      <span className="method-count">{method.count}명</span>
                      <div className="method-bar">
                        <div 
                          className="bar-fill"
                          style={{
                            width: `${(method.count / dashboardData.overview.total_users) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>월별 프로젝트 생성</h3>
                <div className="monthly-projects">
                  {dashboardData.projects_by_month.map((month, index) => (
                    <div key={index} className="month-item">
                      <span className="month-name">{month.month}</span>
                      <span className="month-count">{month.count}개</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="이메일 또는 닉네임 검색"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    setUserPage(1)
                  }}
                />
              </div>
              <select 
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value)
                  setUserPage(1)
                }}
              >
                <option value="">전체 로그인 방식</option>
                <option value="email">이메일</option>
                <option value="google">Google</option>
                <option value="kakao">Kakao</option>
                <option value="naver">Naver</option>
              </select>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이메일</th>
                    <th>닉네임</th>
                    <th>로그인 방식</th>
                    <th>가입일</th>
                    <th>프로젝트</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.nickname}</td>
                      <td>
                        <span className={`login-method ${user.login_method}`}>
                          {user.login_method}
                        </span>
                      </td>
                      <td>{user.date_joined}</td>
                      <td>
                        소유: {user.projects_count} / 참여: {user.member_projects_count}
                      </td>
                      <td>
                        <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn view"
                          onClick={() => fetchUserDetail(user.id)}
                        >
                          상세
                        </button>
                        <button 
                          className={`action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? '비활성화' : '활성화'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button 
                disabled={userPage === 1}
                onClick={() => setUserPage(userPage - 1)}
              >
                이전
              </button>
              <span>{userPage} / {userTotalPages}</span>
              <button 
                disabled={userPage === userTotalPages}
                onClick={() => setUserPage(userPage + 1)}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-section">
            <div className="section-header">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="프로젝트명, 매니저, 고객사 검색"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value)
                    setProjectPage(1)
                  }}
                />
              </div>
            </div>

            <div className="projects-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>프로젝트명</th>
                    <th>매니저</th>
                    <th>고객사</th>
                    <th>소유자</th>
                    <th>상태</th>
                    <th>멤버</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => (
                    <tr key={project.id}>
                      <td>{project.id}</td>
                      <td>
                        <div className="project-name">
                          <span 
                            className="color-dot"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </td>
                      <td>{project.manager}</td>
                      <td>{project.consumer}</td>
                      <td>{project.owner_nickname}</td>
                      <td>
                        <span className={`project-status ${project.status}`}>
                          {project.status === 'completed' ? '완료' :
                           project.status === 'in_progress' ? '진행중' : '예정'}
                        </span>
                      </td>
                      <td>{project.members_count}명</td>
                      <td>{project.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button 
                disabled={projectPage === 1}
                onClick={() => setProjectPage(projectPage - 1)}
              >
                이전
              </button>
              <span>{projectPage} / {projectTotalPages}</span>
              <button 
                disabled={projectPage === projectTotalPages}
                onClick={() => setProjectPage(projectPage + 1)}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 사용자 상세 정보 모달 */}
      {userDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setUserDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>사용자 상세 정보</h2>
              <button className="close-btn" onClick={() => setUserDetailModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <div className="detail-item">
                  <label>ID:</label>
                  <span>{selectedUser.id}</span>
                </div>
                <div className="detail-item">
                  <label>이메일:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <label>닉네임:</label>
                  <span>{selectedUser.nickname}</span>
                </div>
                <div className="detail-item">
                  <label>로그인 방식:</label>
                  <span>{selectedUser.login_method}</span>
                </div>
                <div className="detail-item">
                  <label>가입일:</label>
                  <span>{selectedUser.date_joined}</span>
                </div>
                <div className="detail-item">
                  <label>마지막 로그인:</label>
                  <span>{selectedUser.last_login || '없음'}</span>
                </div>
                <div className="detail-item">
                  <label>권한:</label>
                  <span>
                    {selectedUser.is_superuser ? '최고관리자' :
                     selectedUser.is_staff ? '스태프' : '일반사용자'}
                  </span>
                </div>
                
                <h3>소유 프로젝트 ({selectedUser.total_owned_projects}개)</h3>
                <ul className="project-list">
                  {selectedUser.owned_projects.map(project => (
                    <li key={project.id}>
                      {project.name} ({project.created})
                    </li>
                  ))}
                </ul>
                
                <h3>참여 프로젝트 ({selectedUser.total_member_projects}개)</h3>
                <ul className="project-list">
                  {selectedUser.member_projects.map(project => (
                    <li key={project.id}>
                      {project.name} - {project.rating === 'manager' ? '매니저' : '멤버'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}