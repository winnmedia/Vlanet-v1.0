import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from '../../util/nextNavigation'
import { useSelector, useDispatch } from 'react-redux'
import { refetchProject, checkSession } from '../../util/util'
import { updateProjectStore } from '../../redux/project'
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from '../../api/invitation'
import moment from 'moment'
import 'moment/locale/ko'

import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'
import { MinimalCard, CardHeader, CardContent, CardFooter } from '../../components/minimal/MinimalCard'
import styles from './CmsHomeMinimal.module.scss'

export default function CmsHomeMinimal() {
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  const { project_list, this_month_project, next_month_project } = useSelector(s => s.ProjectStore)
  
  const [invitations, setInvitations] = useState({ sent: [], received: [], recent_accepted: [] })
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // 인증 체크 및 프로젝트 데이터 로드
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
      return
    }
    
    if (project_list === null) {
      refetchProject(dispatch, navigate)
        .catch(error => {
          console.error('[CmsHomeMinimal] Failed to load projects:', error)
          dispatch(updateProjectStore({ project_list: [] }))
        })
    }
  }, [navigate, dispatch, project_list])

  // 초대 목록 로드
  const loadInvitations = useCallback(async () => {
    try {
      setInvitationLoading(true)
      const response = await GetMyInvitations()
      if (response && response.data) {
        setInvitations(response.data)
      } else {
        setInvitations({ sent: [], received: [], recent_accepted: [] })
      }
    } catch (error) {
      console.error('초대 목록 로드 실패:', error)
      setInvitations({ sent: [], received: [], recent_accepted: [] })
    } finally {
      setInvitationLoading(false)
    }
  }, [])

  // 초대 수락/거절 처리
  const handleAcceptInvitation = async (invitationId) => {
    try {
      await AcceptInvitation(invitationId)
      loadInvitations()
      refetchProject(dispatch, navigate)
    } catch (error) {
      console.error('초대 수락 실패:', error)
    }
  }

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await DeclineInvitation(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('초대 거절 실패:', error)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  const isLoading = project_list === null
  
  if (isLoading) {
    return (
      <PageTemplate>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      </PageTemplate>
    )
  }
  
  const projectListData = project_list || []
  const filteredProjects = activeTab === 'all' 
    ? projectListData 
    : activeTab === 'this-month' 
    ? this_month_project || []
    : next_month_project || []

  // 최근 활동 (피드백) 수집
  const recentFeedbacks = []
  projectListData.forEach(project => {
    if (project.feedback && project.feedback.length > 0) {
      project.feedback.forEach(feedback => {
        recentFeedbacks.push({
          ...feedback,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        })
      })
    }
  })
  
  const sortedFeedbacks = recentFeedbacks
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, 3)

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        
        <main className={styles.main}>
          {/* 헤더 섹션 */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>대시보드</h1>
              <p className={styles.subtitle}>
                {moment().format('YYYY년 MM월 DD일')} • 
                전체 프로젝트 {projectListData.length}개
              </p>
            </div>
            
            <button 
              className={styles.newProjectBtn}
              onClick={() => navigate('/Create')}
            >
              새 프로젝트
            </button>
          </div>

          {/* 초대 알림 */}
          {invitations.received && invitations.received.length > 0 && (
            <MinimalCard className={styles.invitationAlert}>
              <CardContent>
                <div className={styles.invitationContent}>
                  <div>
                    <strong>{invitations.received.length}개의 새로운 초대</strong>가 있습니다
                  </div>
                  <div className={styles.invitationActions}>
                    {invitations.received[0] && (
                      <>
                        <button 
                          className={styles.acceptBtn}
                          onClick={() => handleAcceptInvitation(invitations.received[0].id)}
                        >
                          수락
                        </button>
                        <button 
                          className={styles.declineBtn}
                          onClick={() => handleDeclineInvitation(invitations.received[0].id)}
                        >
                          거절
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </MinimalCard>
          )}

          <div className={styles.content}>
            {/* 프로젝트 섹션 */}
            <div className={styles.projectSection}>
              {/* 탭 네비게이션 */}
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  전체
                  <span className={styles.count}>{projectListData.length}</span>
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'this-month' ? styles.active : ''}`}
                  onClick={() => setActiveTab('this-month')}
                >
                  이번 달
                  <span className={styles.count}>{this_month_project?.length || 0}</span>
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'next-month' ? styles.active : ''}`}
                  onClick={() => setActiveTab('next-month')}
                >
                  다음 달
                  <span className={styles.count}>{next_month_project?.length || 0}</span>
                </button>
              </div>

              {/* 프로젝트 그리드 */}
              <div className={styles.projectGrid}>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map(project => (
                    <MinimalCard 
                      key={project.id}
                      hover
                      onClick={() => navigate(`/Project/${project.id}`)}
                      className={styles.projectCard}
                    >
                      <CardHeader
                        title={project.name}
                        subtitle={project.client || '클라이언트 미지정'}
                        action={
                          <div 
                            className={styles.projectStatus}
                            style={{ backgroundColor: project.color || '#8B8B8D' }}
                          />
                        }
                      />
                      <CardContent>
                        <div className={styles.projectMeta}>
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>단계</span>
                            <span className={styles.metaValue}>
                              {project.current_phase || '시작 전'}
                            </span>
                          </div>
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>마감일</span>
                            <span className={styles.metaValue}>
                              {project.deadline ? moment(project.deadline).format('MM.DD') : '미정'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </MinimalCard>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <h3>프로젝트가 없습니다</h3>
                    <p>새 프로젝트를 만들어보세요</p>
                  </div>
                )}
              </div>
            </div>

            {/* 사이드바 섹션 */}
            <div className={styles.sidebar}>
              {/* 최근 활동 */}
              <MinimalCard className={styles.activityCard}>
                <CardHeader title="최근 활동" />
                <CardContent>
                  {sortedFeedbacks.length > 0 ? (
                    <div className={styles.activityList}>
                      {sortedFeedbacks.map((feedback, idx) => (
                        <div 
                          key={`feedback-${idx}`}
                          className={styles.activityItem}
                          onClick={() => navigate(`/Feedback/${feedback.projectId}`)}
                        >
                          <div className={styles.activityHeader}>
                            <span className={styles.projectName}>{feedback.projectName}</span>
                            <span className={styles.time}>{moment(feedback.created).fromNow()}</span>
                          </div>
                          <div className={styles.activityContent}>
                            <span className={styles.author}>{feedback.nickname || '익명'}</span>
                            {feedback.text && (
                              <span className={styles.text}>{feedback.text}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>아직 활동이 없습니다</p>
                  )}
                </CardContent>
              </MinimalCard>

              {/* 빠른 통계 */}
              <MinimalCard className={styles.statsCard}>
                <CardHeader title="프로젝트 현황" />
                <CardContent>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>진행 중</span>
                      <span className={styles.statValue}>
                        {projectListData.filter(p => p.status === 'active').length}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>완료</span>
                      <span className={styles.statValue}>
                        {projectListData.filter(p => p.status === 'completed').length}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>대기</span>
                      <span className={styles.statValue}>
                        {projectListData.filter(p => p.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </MinimalCard>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}