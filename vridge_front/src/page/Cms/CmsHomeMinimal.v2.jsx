import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic';;
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { useRouter } from '../../util/nextNavigation';
import { useSelector, useDispatch } from 'react-redux';
import { refetchProject, checkSession } from '../../util/util';
import { updateProjectStore } from '../../redux/project';
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from '../../api/invitation';
import moment from 'moment';
import 'moment/locale/ko';

import PageTemplate from '../../components/PageTemplate';
import SideBar from '../../components/SideBar';
import { UnifiedCard } from '../../components/unified/UnifiedCard';
import { MinimalButton } from '../../components/minimal';
import { measureComponentPerformance, debounce } from '../../utils/performance';
import styles from './CmsHomeMinimal.module.scss';
import { Button } from '../../components/unified/Button';
import { Input } from '../../components/unified/Input';

// 프로젝트 카드를 별도 컴포넌트로 분리하여 메모이제이션
const ProjectCard = React.memo(({ project, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(project.id);
  }, [onClick, project.id]);

  return (
    <UnifiedCard
      hover
      onClick={handleClick}
      className={styles.projectCard}
      ariaLabel={`${project.name} 프로젝트`}>

      <CardHeader
        title={project.name}
        subtitle={project.client || '클라이언트 미지정'}
        action={
        <div
          className={styles.projectStatus}
          style={{ backgroundColor: project.color || '#8B8B8D' }}
          aria-hidden="true" />

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
        </div>
      </CardContent>
    </UnifiedCard>);

});

ProjectCard.displayName = 'ProjectCard';

// 최근 활동 아이템 컴포넌트
const ActivityItem = React.memo(({ feedback, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(feedback.projectId);
  }, [onClick, feedback.projectId]);

  return (
    <div
      className={styles.activityItem}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}>

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
    </div>);

});

ActivityItem.displayName = 'ActivityItem';

export default function CmsHomeMinimal() {
  const endPerformanceMeasure = measureComponentPerformance('CmsHomeMinimal');

  const { navigate } = useRouter();
  const dispatch = useDispatch();
  const { project_list, this_month_project, next_month_project } = useSelector((s) => s.ProjectStore);

  const [invitations, setInvitations] = useState({ sent: [], received: [], recent_accepted: [] });
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // 초대 목록 로드 - 메모이제이션
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

  // 초대 수락/거절 처리 - 메모이제이션
  const handleAcceptInvitation = useCallback(async (invitationId) => {
    try {
      await AcceptInvitation(invitationId);
      loadInvitations();
      refetchProject(dispatch, navigate);
    } catch (error) {}
  }, [dispatch, navigate, loadInvitations]);

  const handleDeclineInvitation = useCallback(async (invitationId) => {
    try {
      await DeclineInvitation(invitationId);
      loadInvitations();
    } catch (error) {}
  }, [loadInvitations]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // 프로젝트 네비게이션 - 메모이제이션
  const navigateToProject = useCallback((projectId) => {
    navigate(`/Project/${projectId}`);
  }, [navigate]);

  const navigateToFeedback = useCallback((projectId) => {
    navigate(`/Feedback/${projectId}`);
  }, [navigate]);

  const navigateToCreate = useCallback(() => {
    navigate('/Create');
  }, [navigate]);

  const isLoading = project_list === null;
  const projectListData = project_list || [];

  // 필터링된 프로젝트 - useMemo로 최적화
  const filteredProjects = useMemo(() => {
    let projects = activeTab === 'all' ?
    projectListData :
    activeTab === 'this-month' ?
    this_month_project || [] :
    next_month_project || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter((project) =>
      project.name?.toLowerCase().includes(query) ||
      project.client?.toLowerCase().includes(query)
      );
    }

    return projects;
  }, [activeTab, projectListData, this_month_project, next_month_project, searchQuery]);

  // 최근 활동 (피드백) 수집 - useMemo로 최적화
  const sortedFeedbacks = useMemo(() => {
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

    return recentFeedbacks.
    sort((a, b) => new Date(b.created) - new Date(a.created)).
    slice(0, 3);
  }, [projectListData]);

  // 프로젝트 통계 - useMemo로 최적화
  const projectStats = useMemo(() => ({
    active: projectListData.filter((p) => p.status === 'active').length,
    completed: projectListData.filter((p) => p.status === 'completed').length,
    pending: projectListData.filter((p) => p.status === 'pending').length
  }), [projectListData]);

  // 검색 디바운스 처리
  const handleSearchChange = useMemo(
    () => debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // 컴포넌트 렌더링 완료 시 성능 측정
  useEffect(() => {
    return endPerformanceMeasure;
  }, [endPerformanceMeasure]);

  if (isLoading) {
    return (
      <PageTemplate>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>프로젝트를 불러오는 중...</p>
        </div>
      </PageTemplate>);

  }

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
            
            <MinimalButton
              variant="primary"
              onClick={navigateToCreate}
              ariaLabel="새 프로젝트 만들기">

              새 프로젝트
            </MinimalButton>
          </div>

          {/* 초대 알림 */}
          {invitations.received && invitations.received.length > 0 &&
          <UnifiedCard className={styles.invitationAlert}>
              <CardContent>
                <div className={styles.invitationContent}>
                  <div>
                    <strong>{invitations.received.length}개의 새로운 초대</strong>가 있습니다
                  </div>
                  <div className={styles.invitationActions}>
                    {invitations.received[0] &&
                  <>
                        <MinimalButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleAcceptInvitation(invitations.received[0].id)}>

                          수락
                        </MinimalButton>
                        <MinimalButton
                      variant="ghost"
                      size="small"
                      onClick={() => handleDeclineInvitation(invitations.received[0].id)}>

                          거절
                        </MinimalButton>
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
              <div className={styles.tabs} role="tablist">
                <UnifiedButton
                  variant="ghost"
                  size="sm"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('all')}>

                  전체
                  <span className={styles.count}>{projectListData.length}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  size="sm"
                  role="tab"
                  aria-selected={activeTab === 'this-month'}
                  className={`${styles.tab} ${activeTab === 'this-month' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('this-month')}>

                  이번 달
                  <span className={styles.count}>{this_month_project?.length || 0}</span>
                </UnifiedButton>
                <UnifiedButton
                  variant="ghost"
                  size="sm"
                  role="tab"
                  aria-selected={activeTab === 'next-month'}
                  className={`${styles.tab} ${activeTab === 'next-month' ? styles.active : ''}`}
                  onClick={() = aria-label="Click"> setActiveTab('next-month')}>

                  다음 달
                  <span className={styles.count}>{next_month_project?.length || 0}</span>
                </UnifiedButton>
              </div>

              {/* 검색 바 */}
              <div className={styles.searchBar}>
                <Input
                  type="search"
                  placeholder="프로젝트 검색..."
                  onChange={(e) = aria-label="프로젝트 검색..."> handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                  aria-label="프로젝트 검색" />

              </div>

              {/* 프로젝트 그리드 */}
              <div className={styles.projectGrid} role="region" aria-label="프로젝트 목록">
                {filteredProjects.length > 0 ?
                filteredProjects.map((project) =>
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={navigateToProject} />

                ) :

                <div className={styles.emptyState}>
                    <h3>{searchQuery ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}</h3>
                    <p>{searchQuery ? '다른 검색어로 시도해보세요' : '새 프로젝트를 만들어보세요'}</p>
                  </div>
                }
              </div>
            </div>

            {/* 사이드바 섹션 */}
            <aside className={styles.sidebar}>
              {/* 최근 활동 */}
              <UnifiedCard className={styles.activityCard}>
                <CardHeader title="최근 활동" />
                <CardContent>
                  {sortedFeedbacks.length > 0 ?
                  <div className={styles.activityList}>
                      {sortedFeedbacks.map((feedback, idx) =>
                    <ActivityItem
                      key={`feedback-${idx}`}
                      feedback={feedback}
                      onClick={navigateToFeedback} />

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
                      <span className={styles.statValue}>{projectStats.active}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>완료</span>
                      <span className={styles.statValue}>{projectStats.completed}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>대기</span>
                      <span className={styles.statValue}>{projectStats.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </UnifiedCard>
            </aside>
          </div>
        </main>
      </div>
    </PageTemplate>);

}