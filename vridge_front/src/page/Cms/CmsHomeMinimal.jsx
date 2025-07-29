import React, { useState, useEffect, useCallback , Suspense } from 'react'
import dynamic from 'next/dynamic';;
;

import { useRouter } from '../../util/nextNavigation';
import { useSelector, useDispatch } from 'react-redux';
import { refetchProject, checkSession } from '../../util/util';
import { updateProjectStore } from '../../redux/project';
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from '../../api/invitation';
import moment from 'moment';
import 'moment/locale/ko';
import { Button } from '../../components/unified/Button';

moment.locale('ko');

import PageTemplate from '../../components/PageTemplate';
import SideBar from '../../components/SideBar';

import { CardHeader, CardContent, CardFooter } from '../../components/minimal/MinimalCard';
import styles from './CmsHomeMinimal.module.scss'
const UnifiedCard = dynamic(() => import('../../components/unified/UnifiedCard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default function CmsHomeMinimal() {
  const { navigate } = useRouter();
  const dispatch = useDispatch();
  const { project_list, this_month_project, next_month_project } = useSelector((s) => s.ProjectStore);

  const [invitations, setInvitations] = useState({ sent: [], received: [], recent_accepted: [] });
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');

  // 인증 체크 및 프로젝트 데이터 로드
  useEffect(() => {
    const session = checkSession();
    if (!session) {
      navigate('/Login', { replace: true });
      return;
    }

    if (project_list === null) {
      refetchProject(dispatch, navigate).
      catch((error) => {
        
        dispatch(updateProjectStore({ project_list: [] }));
      });
    }
  }, [navigate, dispatch, project_list]);

  // 초대 목록 로드
  const loadInvitations = useCallback(async () => {
    try {
      setInvitationLoading(true);
      const response = await GetMyInvitations();
      if (response && response.data) {
        setInvitations(response.data);
      } else {
        setInvitations({ sent: [], received: [], recent_accepted: [] });
      }
    } catch (error) {
      
      setInvitations({ sent: [], received: [], recent_accepted: [] });
    } finally {
      setInvitationLoading(false);
    }
  }, []);

  // 초대 수락/거절 처리
  const handleAcceptInvitation = async (invitationId) => {
    try {
      await AcceptInvitation(invitationId);
      loadInvitations();
      refetchProject(dispatch, navigate);
    } catch (error) {}
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await DeclineInvitation(invitationId);
      loadInvitations();
    } catch (error) {}
  };

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const isLoading = project_list === null;

  if (isLoading) {
    return (
      <PageTemplate>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      </PageTemplate>);

  }

  const projectListData = project_list || [];

  // 프로젝트 상태별 필터링 함수
  const getProjectStatus = (project) => {
    if (!project.basic_plan || !project.basic_plan.start_date) return 'pending';

    const now = moment();
    const startDate = moment(project.basic_plan.start_date);
    const endDate = project.basic_plan.end_date ? moment(project.basic_plan.end_date) : null;

    if (endDate && now.isAfter(endDate)) {
      // 종료일이 지났는데 완료되지 않은 경우 지연
      if (project.current_phase !== '영상 납품') return 'delayed';
      return 'completed';
    }

    if (now.isBefore(startDate)) return 'pending';
    return 'active';
  };

  // 탭별 필터링
  let filteredByTab = activeTab === 'all' ?
  projectListData :
  activeTab === 'this-month' ?
  this_month_project || [] :
  next_month_project || [];

  // 상태별 필터링
  const filteredProjects = filterStatus === 'all' ?
  filteredByTab :
  filteredByTab.filter((project) => getProjectStatus(project) === filterStatus);

  // 상태별 카운트
  const statusCounts = {
    all: filteredByTab.length,
    active: filteredByTab.filter((p) => getProjectStatus(p) === 'active').length,
    delayed: filteredByTab.filter((p) => getProjectStatus(p) === 'delayed').length
  };

  // 프로젝트 토글 핸들러
  const toggleProjectExpand = (projectId) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // 최종 업데이트 시간 계산
  const getLastUpdateTime = (project) => {
    const updateTimes = [];

    // 프로젝트 자체 업데이트 시간
    if (project.updated) updateTimes.push(moment(project.updated));

    // 피드백 업데이트 시간
    if (project.feedback && project.feedback.length > 0) {
      const latestFeedback = project.feedback.
      map((f) => moment(f.created)).
      sort((a, b) => b.diff(a))[0];
      if (latestFeedback) updateTimes.push(latestFeedback);
    }

    // 메모 업데이트 시간
    if (project.memos && project.memos.length > 0) {
      const latestMemo = project.memos.
      map((m) => moment(m.date || m.created)).
      sort((a, b) => b.diff(a))[0];
      if (latestMemo) updateTimes.push(latestMemo);
    }

    // 가장 최근 시간 반환
    if (updateTimes.length === 0) return null;
    return updateTimes.sort((a, b) => b.diff(a))[0];
  };

  // 최근 활동 (피드백) 수집
  const recentFeedbacks = [];
  projectListData.forEach((project) => {
    if (project.feedback && project.feedback.length > 0) {
      project.feedback.forEach((feedback) => {
        recentFeedbacks.push({
          ...feedback,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        });
      });
    }
  });

  const sortedFeedbacks = recentFeedbacks.
  sort((a, b) => new Date(b.created) - new Date(a.created)).
  slice(0, 3);

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        
        <main className={styles.main} role="main">
          {/* 헤더 섹션 */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>대시보드</h1>
              <p className={styles.subtitle}>
                {moment().format('YYYY년 MM월 DD일')} • 
                전체 프로젝트 {projectListData.length}개
              </p>
            </div>
            
            <UnifiedButton
              variant="primary"
              onClick={() = aria-label="Click"> navigate('/Create')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate('/Create')}>

              새 프로젝트
            </UnifiedButton>
          </div>

          {/* 초대 알림 */}
          {invitations.received && invitations.received.length > 0 &&
          <UnifiedCard className={styles.invitationAlert} variant="highlight">
              <CardContent>
                <div className={styles.invitationContent}>
                  <div>
                    <strong>{invitations.received.length}개의 새로운 초대</strong>가 있습니다
                  </div>
                  <div className={styles.invitationActions}>
                    {invitations.received[0] &&
                  <>
                        <UnifiedButton
                      variant="primary"
                      size="sm"
                      onClick={() = aria-label="Click"> handleAcceptInvitation(invitations.received[0].id)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> handleAcceptInvitation(invitations.received[0].id)}>

                          수락
                        </UnifiedButton>
                        <UnifiedButton
                      variant="danger"
                      size="sm"
                      onClick={() = aria-label="Click"> handleDeclineInvitation(invitations.received[0].id)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> handleDeclineInvitation(invitations.received[0].id)}>

                          거절
                        </UnifiedButton>
                      </>
                  }
                  </div>
                </div>
              </CardContent>
            </UnifiedCard>
          }

          <div className={styles.content}>
            {/* 프로젝트 섹션 */}
            <div className={styles.projectSection}>
              {/* 탭 네비게이션 */}
              <div className={styles.tabs}>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('all')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setActiveTab('all')}>

                  전체
                  <span className={styles.count}>{projectListData.length}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.tab} ${activeTab === 'this-month' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('this-month')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setActiveTab('this-month')}>

                  이번 달
                  <span className={styles.count}>{this_month_project?.length || 0}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.tab} ${activeTab === 'next-month' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('next-month')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setActiveTab('next-month')}>

                  다음 달
                  <span className={styles.count}>{next_month_project?.length || 0}</span>
                </UnifiedButton>
              </div>
              
              {/* 상태 필터 버튼 */}
              <div className={styles.statusFilters}>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.statusFilter} ${filterStatus === 'all' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setFilterStatus('all')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setFilterStatus('all')}>

                  <span className={styles.filterLabel}>전체</span>
                  <span className={styles.filterCount}>{statusCounts.all}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.statusFilter} ${filterStatus === 'active' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setFilterStatus('active')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setFilterStatus('active')}>

                  <span className={styles.filterLabel}>진행중</span>
                  <span className={styles.filterCount}>{statusCounts.active}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  className={`${styles.statusFilter} ${filterStatus === 'delayed' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setFilterStatus('delayed')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setFilterStatus('delayed')}>

                  <span className={styles.filterLabel}>지연</span>
                  <span className={styles.filterCount}>{statusCounts.delayed}</span>
                </UnifiedButton>
              </div>

              {/* 프로젝트 그리드 */}
              <div className={styles.projectGrid}>
                {filteredProjects.length > 0 ?
                filteredProjects.map((project) =>
                <UnifiedCard key={project.id}
                  hoverable
                  clickable
                  onClick={(e) => {
                    if (e.target.closest(`.${styles.expandToggle} onKeyDown={(e) => e.key === 'Enter' && (e) => {
                    if (e.target.closest(`.${styles.expandToggle}`)) {
                      e.stopPropagation();
                      toggleProjectExpand(project.id);
                    } else if (!expandedProjects.has(project.id)) {
                      navigate(`/Project/${project.id}`);
                    }
                  }}
                  className={`${styles.projectCard} ${expandedProjects.has(project.id) ? styles.expanded : ''}`}>

                      <CardHeader
                    title={project.name}
                    subtitle={project.consumer || '클라이언트 미지정'}
                    action={
                    <div className={styles.cardActions}>
                            {(() => {
                        const lastUpdate = getLastUpdateTime(project);
                        return lastUpdate ?
                        <div className={styles.lastUpdate}>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 2V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                                  </svg>
                                  <span>{lastUpdate.fromNow()}</span>
                                </div> :
                        null;
                      })()}
                            <div
                        className={styles.projectStatus}
                        style={{ backgroundColor: project.color || '#8B8B8D' }} />

                          </div>
                    } />

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
                          <UnifiedButton
                        variant="ghost"
                        className={styles.expandToggle}
                        aria-label={expandedProjects.has(project.id) ? '접기' : '펼치기'}
                        icon={
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                            d={expandedProjects.has(project.id) ? "M6 8L10 12L14 8" : "M8 6L12 10L8 14"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round" />

                              </svg>
                        } />

                        </div>
                        
                        {/* 확장된 프로젝트 정보 */}
                        {expandedProjects.has(project.id) &&
                    <div className={styles.expandedContent}>
                            <div className={styles.divider} />
                            
                            {project.description &&
                      <div className={styles.description}>
                                <h4>프로젝트 설명</h4>
                                <p>{project.description}</p>
                              </div>
                      }
                            
                            <div className={styles.projectDetails}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>담당자</span>
                                <span className={styles.detailValue}>{project.manager || '미지정'}</span>
                              </div>
                              {project.tone_manner &&
                        <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>톤앤매너</span>
                                  <span className={styles.detailValue}>{project.tone_manner}</span>
                                </div>
                        }
                              {project.genre &&
                        <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>장르</span>
                                  <span className={styles.detailValue}>{project.genre}</span>
                                </div>
                        }
                              {project.concept &&
                        <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>콘셉트</span>
                                  <span className={styles.detailValue}>{project.concept}</span>
                                </div>
                        }
                            </div>
                            
                            {project.members && project.members.length > 0 &&
                      <div className={styles.teamMembers}>
                                <h4>팀 멤버</h4>
                                <div className={styles.memberList}>
                                  {project.members.map((member, idx) =>
                          <div key={idx} className={styles.member}>
                                      <div className={styles.memberAvatar}>
                                        {member.user?.name?.charAt(0) || member.name?.charAt(0) || '?'}
                                      </div>
                                      <span className={styles.memberName}>
                                        {member.user?.name || member.name || '알 수 없음'}
                                      </span>
                                      {member.rating === 'manager' &&
                            <span className={styles.memberRole}>관리자</span>
                            }
                                    </div>
                          )}
                                </div>
                              </div>
                      }
                            
                            <UnifiedButton
                        variant="secondary"
                        className={styles.viewProjectBtn}
                        onClick={() = aria-label="Click"> navigate(`/Project/${project.id} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate(`/Project/${project.id}`)}>

                              프로젝트 보기
                            </UnifiedButton>
                          </div>
                    }
                      </CardContent>
                    </UnifiedCard>
                ) :

                <div className={styles.emptyState}>
                    <h3>프로젝트가 없습니다</h3>
                    <p>새 프로젝트를 만들어보세요</p>
                  </div>
                }
              </div>
            </div>

            {/* 사이드바 섹션 */}
            <div className={styles.sidebar}>
              {/* 최근 활동 */}
              <UnifiedCard className={styles.activityCard}>
                <CardHeader title="최근 활동" />
                <CardContent>
                  {sortedFeedbacks.length > 0 ?
                  <div className={styles.activityList}>
                      {sortedFeedbacks.map((feedback, idx) =>
                    <div
                      key={`feedback-${idx}`}
                      className={styles.activityItem}
                      onClick={() => navigate(`/Feedback/${feedback.projectId} onKeyDown={(e) => e.key === 'Enter' && () => navigate(`/Feedback/${feedback.projectId}`)}>

                          <div className={styles.activityHeader}>
                            <span className={styles.projectName}>{feedback.projectName}</span>
                            <span className={styles.time}>{moment(feedback.created).fromNow()}</span>
                          </div>
                          <div className={styles.activityContent}>
                            <span className={styles.author}>{feedback.nickname || '익명'}</span>
                            {feedback.text &&
                        <span className={styles.text}>{feedback.text}</span>
                        }
                          </div>
                        </div>
                    )}
                    </div> :

                  <p className={styles.emptyText}>아직 활동이 없습니다</p>
                  }
                </CardContent>
              </UnifiedCard>

              {/* 빠른 통계 */}
              <UnifiedCard className={styles.statsCard}>
                <CardHeader title="프로젝트 현황" />
                <CardContent>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>진행 중</span>
                      <span className={styles.statValue}>
                        {projectListData.filter((p) => p.status === 'active').length}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>완료</span>
                      <span className={styles.statValue}>
                        {projectListData.filter((p) => p.status === 'completed').length}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>대기</span>
                      <span className={styles.statValue}>
                        {projectListData.filter((p) => p.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </UnifiedCard>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>);

}