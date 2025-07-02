import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import './MyPage.scss'
import axios from '../../api/axios'
import { setUser, setNickname, setAccessToken } from '../../store/userSlice'
import { toast } from 'react-toastify'

// 아이콘 컴포넌트들
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const ProjectIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
)

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

export default function MyPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, nickname } = useSelector(state => state.user)
  
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [stats, setStats] = useState(null)
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    fetchProfileData()
    fetchUserStats()
  }, [])

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/users/profile')
      if (response.data.status === 'success') {
        setProfileData(response.data.profile)
        setNewNickname(response.data.profile.nickname)
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error)
      toast.error('프로필 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/users/profile/stats')
      if (response.data.status === 'success') {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('통계 조회 실패:', error)
    }
  }

  const handleNicknameUpdate = async () => {
    if (!newNickname || newNickname.length < 2) {
      toast.error('닉네임은 최소 2자 이상이어야 합니다.')
      return
    }

    try {
      const response = await axios.post('/users/profile', {
        nickname: newNickname
      })
      
      if (response.data.status === 'success') {
        toast.success('닉네임이 변경되었습니다.')
        setIsEditingNickname(false)
        dispatch(setNickname(newNickname))
        fetchProfileData()
      }
    } catch (error) {
      console.error('닉네임 변경 실패:', error)
      if (error.response?.status === 409) {
        toast.error('이미 사용 중인 닉네임입니다.')
      } else {
        toast.error('닉네임 변경에 실패했습니다.')
      }
    }
  }

  const handlePasswordChange = async () => {
    const { current_password, new_password, confirm_password } = passwordData

    if (!current_password || !new_password || !confirm_password) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }

    if (new_password !== confirm_password) {
      toast.error('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (new_password.length < 10) {
      toast.error('비밀번호는 최소 10자 이상이어야 합니다.')
      return
    }

    try {
      const response = await axios.post('/users/profile/change-password', {
        current_password,
        new_password
      })
      
      if (response.data.status === 'success') {
        toast.success('비밀번호가 변경되었습니다.')
        setIsChangingPassword(false)
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      if (error.response?.status === 401) {
        toast.error('현재 비밀번호가 일치하지 않습니다.')
      } else {
        toast.error('비밀번호 변경에 실패했습니다.')
      }
    }
  }

  const handleLogout = () => {
    dispatch(setUser(''))
    dispatch(setNickname(''))
    dispatch(setAccessToken(''))
    navigate('/login')
    toast.info('로그아웃되었습니다.')
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    const password = window.prompt('계정 삭제를 위해 비밀번호를 입력해주세요:')
    if (!password) return

    try {
      const response = await axios.post('/users/profile/delete-account', {
        password,
        confirm_delete: true
      })
      
      if (response.data.status === 'success') {
        toast.success('계정이 삭제되었습니다.')
        dispatch(setUser(''))
        dispatch(setNickname(''))
        dispatch(setAccessToken(''))
        navigate('/login')
      }
    } catch (error) {
      console.error('계정 삭제 실패:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.message)
      } else {
        toast.error('계정 삭제에 실패했습니다.')
      }
    }
  }

  if (loading) {
    return (
      <div className="mypage-container">
        <div className="loading">프로필 정보를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h1>마이페이지</h1>
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutIcon />
          로그아웃
        </button>
      </div>

      <div className="mypage-content">
        <div className="mypage-sidebar">
          <ul className="tab-menu">
            <li 
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon /> 프로필 정보
            </li>
            <li 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              <ProjectIcon /> 프로젝트 통계
            </li>
            <li 
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <LockIcon /> 계정 설정
            </li>
          </ul>
        </div>

        <div className="mypage-main">
          {activeTab === 'profile' && profileData && (
            <div className="profile-section">
              <h2>프로필 정보</h2>
              
              <div className="profile-item">
                <div className="item-label">
                  <MailIcon /> 이메일
                </div>
                <div className="item-value">{profileData.email}</div>
              </div>

              <div className="profile-item">
                <div className="item-label">
                  <UserIcon /> 닉네임
                </div>
                <div className="item-value">
                  {isEditingNickname ? (
                    <div className="edit-nickname">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="새 닉네임 입력"
                      />
                      <button onClick={handleNicknameUpdate}>저장</button>
                      <button onClick={() => {
                        setIsEditingNickname(false)
                        setNewNickname(profileData.nickname)
                      }}>취소</button>
                    </div>
                  ) : (
                    <>
                      {profileData.nickname}
                      <button 
                        className="edit-btn"
                        onClick={() => setIsEditingNickname(true)}
                      >
                        수정
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-item">
                <div className="item-label">
                  <CalendarIcon /> 가입일
                </div>
                <div className="item-value">{profileData.date_joined}</div>
              </div>

              <div className="profile-item">
                <div className="item-label">
                  로그인 방식
                </div>
                <div className="item-value">
                  {profileData.login_method === 'email' ? '이메일' : profileData.login_method}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="stats-section">
              <h2>프로젝트 통계</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>전체 프로젝트</h3>
                  <div className="stat-number">{stats.total_projects}</div>
                </div>
                
                <div className="stat-card">
                  <h3>소유 프로젝트</h3>
                  <div className="stat-number">{stats.owned_projects.total}</div>
                  <div className="stat-details">
                    <span>예정: {stats.owned_projects.by_status.planned}</span>
                    <span>진행중: {stats.owned_projects.by_status.in_progress}</span>
                    <span>완료: {stats.owned_projects.by_status.completed}</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>참여 프로젝트</h3>
                  <div className="stat-number">{stats.member_projects.total}</div>
                  <div className="stat-details">
                    <span>매니저: {stats.member_projects.as_manager}</span>
                    <span>멤버: {stats.member_projects.as_member}</span>
                  </div>
                </div>
                
                {stats.recent_activity.last_project_created && (
                  <div className="stat-card">
                    <h3>최근 활동</h3>
                    <div className="stat-details">
                      <span>마지막 프로젝트 생성: {stats.recent_activity.last_project_created}</span>
                      <span>진행중인 프로젝트: {stats.recent_activity.active_projects}개</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && profileData && (
            <div className="settings-section">
              <h2>계정 설정</h2>
              
              {profileData.login_method === 'email' && (
                <div className="setting-item">
                  <h3>비밀번호 변경</h3>
                  {isChangingPassword ? (
                    <div className="password-change-form">
                      <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          current_password: e.target.value
                        })}
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호 (10자 이상)"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          new_password: e.target.value
                        })}
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value
                        })}
                      />
                      <div className="form-actions">
                        <button className="save-btn" onClick={handlePasswordChange}>
                          비밀번호 변경
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => {
                            setIsChangingPassword(false)
                            setPasswordData({
                              current_password: '',
                              new_password: '',
                              confirm_password: ''
                            })
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="change-password-btn"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      비밀번호 변경하기
                    </button>
                  )}
                </div>
              )}
              
              <div className="setting-item danger-zone">
                <h3>계정 삭제</h3>
                <p>계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
                {stats && stats.owned_projects.total > 0 && (
                  <p className="warning">
                    ⚠️ 현재 {stats.owned_projects.total}개의 프로젝트를 소유하고 있습니다. 
                    계정 삭제 전에 프로젝트를 삭제하거나 다른 사용자에게 이전해주세요.
                  </p>
                )}
                <button 
                  className="delete-account-btn"
                  onClick={handleDeleteAccount}
                  disabled={stats && stats.owned_projects.total > 0}
                >
                  계정 삭제
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}