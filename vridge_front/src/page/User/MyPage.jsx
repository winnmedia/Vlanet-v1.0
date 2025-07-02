import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './MyPage.scss'
import PageTemplate from 'components/PageTemplate'
import { checkSession } from 'util/util'
import { getMyPageInfo, uploadProfileImage, updateProfile } from 'api/user'
import { useSelector } from 'react-redux'

export default function MyPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.ProjectStore.user)
  const nickname = useSelector((state) => state.ProjectStore.nickname)
  
  const [loading, setLoading] = useState(true)
  const [myPageData, setMyPageData] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    bio: '',
    phone: '',
    company: '',
    position: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    } else {
      fetchMyPageData()
    }
  }, [navigate])

  const fetchMyPageData = async () => {
    try {
      const response = await getMyPageInfo()
      console.log('MyPage API response:', response)
      if (response.data && response.data.status === 'success') {
        setMyPageData(response.data.data)
        setProfileForm({
          nickname: response.data.data.profile.nickname || '',
          bio: response.data.data.profile.bio || '',
          phone: response.data.data.profile.phone || '',
          company: response.data.data.profile.company || '',
          position: response.data.data.profile.position || ''
        })
        if (response.data.data.profile.profile_image) {
          const imageUrl = response.data.data.profile.profile_image
          // 백엔드 URL이 상대 경로인 경우 처리
          if (imageUrl.startsWith('/')) {
            setImagePreview(`${process.env.REACT_APP_API_BASE_URL || 'https://videoplanet.up.railway.app'}${imageUrl}`)
          } else {
            setImagePreview(imageUrl)
          }
        }
      } else {
        console.error('마이페이지 데이터 형식 오류:', response)
        setLoading(false)
      }
    } catch (error) {
      console.error('마이페이지 데이터 로드 실패:', error)
      console.error('Error response:', error.response)
      // 에러가 발생해도 기본 데이터로 표시
      setMyPageData({
        profile: {
          email: user || '',
          nickname: nickname || '',
          login_method: 'email',
          date_joined: new Date().toISOString().split('T')[0],
          bio: '',
          phone: '',
          company: '',
          position: '',
          profile_image: null
        },
        projects: {
          owned: { total: 0, recent: [] },
          member: { total: 0, as_manager: 0, as_member: 0, recent: [] },
          recent_activity: []
        },
        stats: {
          total_projects: 0,
          active_projects: 0,
          completed_projects: 0,
          total_collaborators: 0
        },
        recent_memos: []
      })
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB를 초과할 수 없습니다.')
        return
      }
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!profileImage || isUploading) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('profile_image', profileImage)

    try {
      const response = await uploadProfileImage(formData)
      if (response.data && response.data.status === 'success') {
        alert('프로필 이미지가 업로드되었습니다.')
        setProfileImage(null)
        fetchMyPageData()
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('이미지 업로드 실패: ' + (error.response?.data?.message || error.message || '알 수 없는 오류'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const response = await updateProfile(profileForm)
      if (response.data && response.data.status === 'success') {
        alert('프로필이 업데이트되었습니다.')
        setIsEditing(false)
        fetchMyPageData()
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('프로필 업데이트 실패: ' + (error.response?.data?.message || error.message || '알 수 없는 오류'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getProjectStatus = (status) => {
    const statusMap = {
      'planned': '계획됨',
      'in_progress': '진행중',
      'completed': '완료됨'
    }
    return statusMap[status] || status
  }

  const getProjectStatusClass = (status) => {
    const classMap = {
      'planned': 'status-planned',
      'in_progress': 'status-progress',
      'completed': 'status-completed'
    }
    return classMap[status] || ''
  }

  if (loading) {
    return (
      <PageTemplate>
        <main className="mypage-container">
          <div className="loading">마이페이지 불러오는 중...</div>
        </main>
      </PageTemplate>
    )
  }

  // myPageData가 없어도 기본 UI는 표시

  return (
    <PageTemplate>
      <main className="mypage-container">
        <div className="mypage">
          <div className="mypage-header">
            <h1>마이페이지</h1>
            <div className="header-info">
              <span className="welcome-text">{myPageData?.profile?.nickname || nickname || '사용자'}님, 환영합니다</span>
            </div>
          </div>

          <div className="mypage-tabs">
            <button 
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              프로필
            </button>
            <button 
              className={activeTab === 'projects' ? 'active' : ''}
              onClick={() => setActiveTab('projects')}
            >
              프로젝트
            </button>
            <button 
              className={activeTab === 'activity' ? 'active' : ''}
              onClick={() => setActiveTab('activity')}
            >
              활동 내역
            </button>
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              통계
            </button>
          </div>

          <div className="mypage-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="profile-header">
                  <h2>프로필 정보</h2>
                  {!isEditing && (
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                      수정
                    </button>
                  )}
                </div>

                <div className="profile-image-section">
                  <div className="profile-image-container">
                    {imagePreview ? (
                      <img src={imagePreview} alt="프로필" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span>{(myPageData?.profile?.nickname || nickname || 'U').charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="image-upload">
                      <input 
                        type="file" 
                        id="profile-image-input"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="profile-image-input" className="upload-btn">
                        이미지 선택
                      </label>
                      {profileImage && (
                        <button 
                          onClick={handleImageUpload} 
                          className="upload-confirm-btn"
                          disabled={isUploading}
                        >
                          {isUploading ? '업로드 중...' : '업로드'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="profile-info">
                  <div className="info-row">
                    <label>이메일</label>
                    <div className="info-value">{myPageData?.profile?.email || user || '-'}</div>
                  </div>

                  <div className="info-row">
                    <label>닉네임</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="nickname"
                        value={profileForm.nickname}
                        onChange={handleInputChange}
                        placeholder="닉네임"
                      />
                    ) : (
                      <div className="info-value">{myPageData?.profile?.nickname || nickname || '-'}</div>
                    )}
                  </div>

                  <div className="info-row">
                    <label>자기소개</label>
                    {isEditing ? (
                      <textarea 
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleInputChange}
                        placeholder="자기소개를 입력해주세요"
                        rows="3"
                      />
                    ) : (
                      <div className="info-value">{myPageData?.profile?.bio || '-'}</div>
                    )}
                  </div>

                  <div className="info-row">
                    <label>전화번호</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleInputChange}
                        placeholder="전화번호"
                      />
                    ) : (
                      <div className="info-value">{myPageData?.profile?.phone || '-'}</div>
                    )}
                  </div>

                  <div className="info-row">
                    <label>회사/소속</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="company"
                        value={profileForm.company}
                        onChange={handleInputChange}
                        placeholder="회사/소속"
                      />
                    ) : (
                      <div className="info-value">{myPageData?.profile?.company || '-'}</div>
                    )}
                  </div>

                  <div className="info-row">
                    <label>직책</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="position"
                        value={profileForm.position}
                        onChange={handleInputChange}
                        placeholder="직책"
                      />
                    ) : (
                      <div className="info-value">{myPageData?.profile?.position || '-'}</div>
                    )}
                  </div>

                  <div className="info-row">
                    <label>로그인 방식</label>
                    <div className="info-value">{myPageData?.profile?.login_method || 'email'}</div>
                  </div>

                  <div className="info-row">
                    <label>가입일</label>
                    <div className="info-value">{myPageData?.profile?.date_joined || '-'}</div>
                  </div>

                  {isEditing && (
                    <div className="profile-actions">
                      <button 
                        onClick={handleProfileUpdate} 
                        className="save-btn"
                        disabled={isSaving}
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                      <button onClick={() => {
                        setIsEditing(false)
                        setProfileForm({
                          nickname: myPageData?.profile?.nickname || '',
                          bio: myPageData?.profile?.bio || '',
                          phone: myPageData?.profile?.phone || '',
                          company: myPageData?.profile?.company || '',
                          position: myPageData?.profile?.position || ''
                        })
                      }} className="cancel-btn">
                        취소
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="projects-section">
                <div className="project-group">
                  <h3>내가 소유한 프로젝트 ({myPageData?.projects?.owned?.total || 0}개)</h3>
                  <div className="project-list">
                    {(myPageData?.projects?.owned?.recent || []).map(project => (
                      <div key={project.id} className="project-item">
                        <div className="project-name">{project.name}</div>
                        <div className="project-info">
                          <span className="created-date">생성일: {project.created}</span>
                          <span className={`project-status ${getProjectStatusClass(project.status)}`}>
                            {getProjectStatus(project.status)}
                          </span>
                        </div>
                        <button 
                          className="view-project-btn"
                          onClick={() => navigate(`/ProjectView/${project.id}`)}
                        >
                          보기
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="project-group">
                  <h3>참여 중인 프로젝트 ({myPageData?.projects?.member?.total || 0}개)</h3>
                  <div className="sub-stats">
                    <span>관리자: {myPageData?.projects?.member?.as_manager || 0}개</span>
                    <span>멤버: {myPageData?.projects?.member?.as_member || 0}개</span>
                  </div>
                  <div className="project-list">
                    {(myPageData?.projects?.member?.recent || []).map(project => (
                      <div key={project.id} className="project-item">
                        <div className="project-name">{project.name}</div>
                        <div className="project-info">
                          <span className="role">{project.role === 'manager' ? '관리자' : '멤버'}</span>
                          <span className="joined-date">참여일: {project.joined}</span>
                        </div>
                        <button 
                          className="view-project-btn"
                          onClick={() => navigate(`/ProjectView/${project.id}`)}
                        >
                          보기
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="activity-section">
                <h2>최근 활동</h2>
                <div className="activity-list">
                  {(myPageData?.projects?.recent_activity || []).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-name">
                        {activity.name}
                        {activity.is_owner && <span className="owner-badge">소유자</span>}
                      </div>
                      <div className="activity-time">
                        마지막 업데이트: {activity.updated}
                      </div>
                    </div>
                  ))}
                </div>

                <h3>최근 메모</h3>
                <div className="memo-list">
                  {(myPageData?.recent_memos || []).map(memo => (
                    <div key={memo.id} className="memo-item">
                      <div className="memo-content">{memo.content}</div>
                      <div className="memo-date">{memo.created}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="stats-section">
                <h2>통계</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">전체 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.total_projects || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">진행 중인 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.active_projects || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">완료된 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.completed_projects || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">협업자 수</div>
                    <div className="stat-value">{myPageData?.stats?.total_collaborators || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageTemplate>
  )
}