import 'css/Cms/CmsCommon.scss'
import 'css/Cms/CmsHomeRedesign.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import ProjectDashboard from 'components/ProjectDashboard'
import ProjectPhaseBoard from 'components/ProjectPhaseBoard'

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { refetchProject, checkSession } from 'util/util'

import moment from 'moment'
import 'moment/locale/ko'
import { UpdateDate } from 'api/project'
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from 'api/invitation'

export default function CmsHome() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { project_list, this_month_project, next_month_project, user } = useSelector(
    (s) => s.ProjectStore,
  )
  let intervalId = useRef()
  const date = new Date()
  const [time, setTime] = useState('')
  const initial = { tab: '', on_menu: '' }
  const [side, set_side] = useState(initial)
  const { tab, on_menu } = side
  const [showDashboard, setShowDashboard] = useState(false)
  const [showRecentActivity, setShowRecentActivity] = useState(false)
  const [showDeadlineProjects, setShowDeadlineProjects] = useState(false)
  const [showInvitations, setShowInvitations] = useState(false)
  const [invitations, setInvitations] = useState({ sent: [], received: [], recent_accepted: [] })
  const [invitationLoading, setInvitationLoading] = useState(false)

  // 인증 체크 및 프로젝트 목록 확인
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
      return
    }
    
    console.log('[CmsHome] Component mounted, project_list length:', project_list?.length || 0)
    
    // 프로젝트 목록이 없으면 로드
    if (!project_list) {
      console.log('[CmsHome] Project list not found, loading...')
      refetchProject(dispatch, navigate).then(() => {
        console.log('[CmsHome] Project list loaded')
      }).catch(err => {
        console.error('[CmsHome] Failed to load project list:', err)
      })
    }
  }, [dispatch, navigate]) // 의존성 추가

  // 초대 목록 로드
  const loadInvitations = async () => {
    try {
      setInvitationLoading(true)
      const response = await GetMyInvitations()
      setInvitations(response.data)
    } catch (error) {
      console.error('초대 목록 로드 실패:', error)
    } finally {
      setInvitationLoading(false)
    }
  }

  // 초대 수락 처리
  const handleAcceptInvitation = async (invitationId) => {
    try {
      await AcceptInvitation(invitationId)
      loadInvitations() // 목록 새로고침
      refetchProject(dispatch, navigate) // 프로젝트 목록 새로고침
      alert('초대를 수락했습니다.')
    } catch (error) {
      console.error('초대 수락 실패:', error)
      alert('초대 수락에 실패했습니다.')
    }
  }

  // 초대 거절 처리
  const handleDeclineInvitation = async (invitationId) => {
    try {
      await DeclineInvitation(invitationId)
      loadInvitations() // 목록 새로고침
      alert('초대를 거절했습니다.')
    } catch (error) {
      console.error('초대 거절 실패:', error)
      alert('초대 거절에 실패했습니다.')
    }
  }

  // 컴포넌트 마운트 시 초대 목록 로드
  useEffect(() => {
    loadInvitations()
  }, [])

  useEffect(() => {
    setTime(moment(date).format('HH:mm:ss'))
    let current_time
    intervalId = setInterval(() => {
      current_time = moment(new Date()).format('HH:mm:ss')
      if (time != current_time) {
        setTime(current_time)
      }
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  // 프로젝트 데이터가 로드되지 않았을 때 로딩 표시 제거
  // 빈 배열도 허용
  // if (!project_list) {
  //   return (
  //     <PageTemplate>
  //       <div className="cms_wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //         <div>Loading...</div>
  //       </div>
  //     </PageTemplate>
  //   )
  // }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab={tab} on_menu={on_menu} />

        <main>
          <div className="content home">
            <div className="today">
              <div className="clock">
                {time}
                <small style={{ marginLeft: '20px' }}>{moment(date).format('YYYY.MM.DD.dd')}</small>
              </div>
            </div>

            {/* 최근활동 & 초대현황 상단 섹션 */}
            <div className="top-grid">
              {/* 최근 활동 섹션 */}
              <div className="part">
                <div className="s_title">
                  최근 활동
                  <button 
                    className={`collapse-btn ${showRecentActivity ? 'collapsed' : ''}`}
                    onClick={() => setShowRecentActivity(!showRecentActivity)}
                  />
                </div>
                {!showRecentActivity && (
                <div className="feedback-list">
                  {project_list && project_list.length > 0 ? (
                    (() => {
                      // 모든 피드백 수집
                      const allFeedbacks = [];
                      project_list.forEach(project => {
                        if (project.feedback && project.feedback.length > 0) {
                          project.feedback.forEach(feedback => {
                            allFeedbacks.push({
                              ...feedback,
                              projectId: project.id,
                              projectName: project.name,
                              projectColor: project.color
                            });
                          });
                        }
                      });
                      
                      // 최근 순으로 정렬
                      const sortedFeedbacks = allFeedbacks
                        .sort((a, b) => new Date(b.created) - new Date(a.created))
                        .slice(0, 5);
                      
                      return sortedFeedbacks.length > 0 ? (
                        sortedFeedbacks.map((feedback, idx) => (
                          <div 
                            key={`feedback-${idx}`}
                            className="feedback-item"
                            onClick={() => navigate(`/Feedback/${feedback.projectId}`)}
                          >
                            <div className="feedback-header">
                              <div className="project-indicator" style={{ backgroundColor: feedback.projectColor || '#1631F8' }} />
                              <div className="project-name">
                                {feedback.projectName}
                              </div>
                            </div>
                            <div className="feedback-content">
                              <div className="feedback-author">
                                <span>{feedback.nickname || '익명'}</span>
                                {feedback.section && ` - ${feedback.section}`}
                              </div>
                              {feedback.text && (
                                <div className="feedback-text">
                                  {feedback.text}
                                </div>
                              )}
                              <div className="feedback-time">
                                {moment(feedback.created).fromNow()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">
                          <div className="empty-title">아직 피드백이 없습니다</div>
                          <div className="empty-description">프로젝트에 피드백이 등록되면 여기에 표시됩니다</div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="empty-state">
                      <div className="empty-title">프로젝트가 없습니다</div>
                      <div className="empty-description">새 프로젝트를 생성해보세요</div>
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* 초대 현황 섹션 */}
              <div className="part">
                <div className="s_title">
                  초대 현황
                  <button 
                    className={`collapse-btn ${showInvitations ? 'collapsed' : ''}`}
                    onClick={() => setShowInvitations(!showInvitations)}
                  />
                </div>
                {!showInvitations && (
                  <div className="invitation-section">
                    {invitationLoading ? (
                      <div className="loading-state">
                        로딩 중...
                      </div>
                    ) : (
                      <div className="invitation-content">
                        {/* 받은 초대 - 컴팩트 버전 */}
                        {invitations.received && invitations.received.length > 0 && (
                          <div>
                            <h4 style={{ 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              color: '#495057', 
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              받은 초대
                              <span style={{
                                backgroundColor: '#1631F8',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                textAlign: 'center'
                              }}>
                                {invitations.received.length}
                              </span>
                            </h4>
                            {invitations.received.slice(0, 2).map(invitation => (
                              <div 
                                key={invitation.id}
                                style={{
                                  padding: '12px',
                                  backgroundColor: '#f8f9ff',
                                  borderRadius: '8px',
                                  marginBottom: '10px',
                                  border: '1px solid #e3e9ff',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ marginBottom: '10px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#212529', marginBottom: '2px' }}>
                                    {invitation.project_name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#495057' }}>
                                    {invitation.inviter_name}님이 초대
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleAcceptInvitation(invitation.id)}
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    수락
                                  </button>
                                  <button
                                    onClick={() => handleDeclineInvitation(invitation.id)}
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    거절
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* 간단한 통계 */}
                        <div className="invitation-stats">
                          <div>보낸 초대: {invitations.sent?.length || 0}개</div>
                          <div>최근 수락: {invitations.recent_accepted?.length || 0}개</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 프로젝트 현황 섹션 */}
            <div className="part project-progress-enhanced">
              <div className="s_title">
                프로젝트 현황
                <button
                  className="refresh-btn"
                  onClick={() => {
                    console.log('[CmsHome] Manual refresh triggered')
                    refetchProject(dispatch, navigate).then(() => {
                      console.log('[CmsHome] Project list refreshed manually')
                      alert('프로젝트 목록이 새로고침 되었습니다.')
                    }).catch(err => {
                      console.error('[CmsHome] Manual refresh failed:', err)
                      alert('프로젝트 목록 새로고침에 실패했습니다.')
                    })
                  }}
                >
                  새로고침
                </button>
                <button 
                  className={`collapse-btn ${showDashboard ? '' : 'collapsed'}`}
                  onClick={() => setShowDashboard(!showDashboard)}
                />
              </div>
              <div className={`dashboard-content ${showDashboard ? 'hidden' : ''}`}>
                <ul className="schedule enhanced">
                  <li>
                    전체 프로젝트
                    <span>{project_list.length}</span>
                  </li>
                  <li>
                    이번 달 프로젝트
                    <span>{this_month_project.length}</span>
                  </li>
                  <li>
                    다음 달 프로젝트
                    <span>{next_month_project.length}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 프로젝트 단계별 진행 현황 - 프로젝트 현황 아래에 표시 */}
            {!showDashboard && (
              <div className="part phase-board-section">
                <ProjectPhaseBoard 
                  projects={[...project_list]} 
                  onPhaseUpdate={(projectId, phase, startDate, endDate, completed) => {
                    const data = {
                      type: phase,
                      start_date: startDate,
                      end_date: endDate,
                      completed: completed !== undefined ? completed : false
                    }
                    UpdateDate(data, projectId)
                      .then(() => {
                        refetchProject(dispatch, navigate)
                      })
                      .catch(err => {
                        console.error('Failed to update phase:', err)
                      })
                  }}
                  projectCounts={{
                    total: project_list.length,
                    thisMonth: this_month_project.length,
                    nextMonth: next_month_project.length
                  }}
                  showTitle={true}
                />
              </div>
            )}

          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
