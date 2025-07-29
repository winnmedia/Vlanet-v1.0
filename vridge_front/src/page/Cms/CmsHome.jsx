

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from '../../components/PageTemplate'
import dynamic from 'next/dynamic';;
import UnifiedCard from '../../components/unified/UnifiedCard';

import SideBar from '../../components/SideBar';
;
;
import ProjectScheduleSection from '../../components/ProjectScheduleSection';
import ToggleButton from '../../components/ToggleButton';
import { Button } from '../../components/unified/Button';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '../../util/nextNavigation';
import { useSelector, useDispatch } from 'react-redux';
import { refetchProject, checkSession } from '../../util/util';

import moment from 'moment';
import 'moment/locale/ko';
import { UpdateDate } from '../../api/project';
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from '../../api/invitation';
import { updateProjectStore } from '../../redux/project'
const ProjectDashboard = dynamic(() => import('../../components/ProjectDashboard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const ProjectPhaseBoard = dynamic(() => import('../../components/ProjectPhaseBoard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default function CmsHome() {
  const { navigate } = useRouter();
  const dispatch = useDispatch();
  const { project_list, this_month_project, next_month_project, user } = useSelector(
    (s) => s.ProjectStore
  );
  let intervalId = useRef();
  const date = new Date();
  const [time, setTime] = useState('');
  const initial = { tab: '', on_menu: '' };
  const [side, set_side] = useState(initial);
  const { tab, on_menu } = side;
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(false);
  const [showDeadlineProjects, setShowDeadlineProjects] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState({ sent: [], received: [], recent_accepted: [] });
  const [invitationLoading, setInvitationLoading] = useState(false);

  // 인증 체크 및 프로젝트 데이터 로드
  useEffect(() => {
    const session = checkSession();
    if (!session) {
      navigate('/Login', { replace: true });
      return;
    }

    // 프로젝트 데이터 로드
    if (project_list === null) {
      refetchProject(dispatch, navigate).
      then(() => {}).
      catch((error) => {
        
        // 에러가 발생해도 빈 배열로 설정하여 무한 로딩 방지
        dispatch(updateProjectStore({ project_list: [] }));

        // 데이터베이스 업데이트 중인 경우 사용자에게 알림
        if (error.response?.data?.message?.includes('데이터베이스')) {
          alert('서버 업데이트 중입니다. 잠시 후 다시 시도해주세요.');
        }
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

  // 초대 수락 처리
  const handleAcceptInvitation = async (invitationId) => {
    try {
      await AcceptInvitation(invitationId);
      loadInvitations(); // 목록 새로고침
      refetchProject(dispatch, navigate); // 프로젝트 목록 새로고침
      alert('초대를 수락했습니다.');
    } catch (error) {
      
      alert('초대 수락에 실패했습니다.');
    }
  };

  // 초대 거절 처리
  const handleDeclineInvitation = async (invitationId) => {
    try {
      await DeclineInvitation(invitationId);
      loadInvitations(); // 목록 새로고침
      alert('초대를 거절했습니다.');
    } catch (error) {
      
      alert('초대 거절에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 초대 목록 로드
  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    // 초 단위 제거하고 분 단위로만 표시
    setTime(moment(date).format('HH:mm'));
    let current_time;
    const interval = setInterval(() => {
      current_time = moment(new Date()).format('HH:mm');
      setTime(current_time);
    }, 60000); // 1분마다 업데이트 (성능 최적화)
    return () => clearInterval(interval);
  }, []);

  // 로딩 상태는 project_list 자체로 판단
  const isLoading = project_list === null;

  if (isLoading) {
    return (
      <PageTemplate>
        <div className="cms_wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#666' }}>프로젝트를 불러오는 중...</p>
          </div>
        </div>
      </PageTemplate>);

  }

  // project_list가 빈 배열이어도 정상적으로 렌더링
  const projectListData = project_list || [];

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab={tab} on_menu={on_menu} />

        <main role="main">
          <div className="content home">
            <div className="today">
              <div className="clock">
                {time}
                <small style={{ marginLeft: '20px' }}>{moment(date).format('YYYY.MM.DD.dd')}</small>
              </div>
            </div>

            {/* 최근활동 & 초대현황 상단 섹션 */}
            <div className="home-activity-grid responsive-grid">
              {/* 최근 활동 섹션 */}
              <UnifiedCard className="activity-card">
                <div className="card-header">
                  <h3 className="card-title">최근 활동</h3>
                  <ToggleButton
                    isExpanded={!showRecentActivity}
                    onClick={() => setShowRecentActivity(!showRecentActivity)} onKeyDown={(e) => e.key === 'Enter' && setShowRecentActivity(!showRecentActivity)} />

                </div>
                {!showRecentActivity && (
                <div>
                  {projectListData.length > 0 ?
                  (() => {
                    // 모든 피드백 수집
                    const allFeedbacks = [];
                    projectListData.forEach((project) => {
                      if (project.feedback && project.feedback.length > 0) {
                        project.feedback.forEach((feedback) => {
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
                    const sortedFeedbacks = allFeedbacks.
                    sort((a, b) => new Date(b.created) - new Date(a.created)).
                    slice(0, 5);

                    return sortedFeedbacks.length > 0 ?
                    sortedFeedbacks.map((feedback, idx) =>
                    <div
                      key={`feedback-${idx}`}
                      className="feedback-item"
                      onClick={() => navigate(`/Feedback/${feedback.projectId}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/Feedback/${feedback.projectId}`)}>

                            <div className="project-info">
                              <div className="project-name">
                                {feedback.projectName}
                              </div>
                            </div>
                            <div className="feedback-content">
                              <div className="feedback-author">
                                <span>{feedback.nickname || '익명'}</span>
                                {feedback.section && ` - ${feedback.section}`}
                              </div>
                              {feedback.text &&
                        <div className="feedback-text">
                                  {feedback.text}
                                </div>
                        }
                              <div className="feedback-time">
                                {moment(feedback.created).fromNow()}
                              </div>
                            </div>
                          </div>
                    ) :

                    <div className="empty-state">
                          <div className="empty-title">아직 피드백이 없습니다</div>
                          <div className="empty-subtitle">프로젝트에 피드백이 등록되면 여기에 표시됩니다</div>
                        </div>

                  })() :

                  <div className="empty-state">
                      <div className="empty-title">프로젝트가 없습니다</div>
                      <div className="empty-description">새 프로젝트를 생성해보세요</div>
                    </div>
                  }
                </div>
                )}
              </UnifiedCard>

              {/* 초대 현황 섹션 */}
              <UnifiedCard className="invitation-card">
                <div className="card-header">
                  <h3 className="card-title">초대 현황</h3>
                  <ToggleButton
                    isExpanded={!showInvitations}
                    onClick={() => setShowInvitations(!showInvitations)} 
                    onKeyDown={(e) => e.key === 'Enter' && setShowInvitations(!showInvitations)} />

                </div>
                {!showInvitations &&
                <UnifiedCard variant="default">

                    {invitationLoading ?
                  <div className="loading-state">
                        로딩 중...
                      </div> :

                  <div>
                        {/* 받은 초대 - 컴팩트 버전 */}
                        {invitations.received && invitations.received.length > 0 &&
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
                            {invitations.received.slice(0, 2).map((invitation) =>
                      <div
                        key={invitation.id}
                        className="invitation-item">

                                <div className="invitation-info">
                                  <div className="project-name">
                                    {invitation.project_name}
                                  </div>
                                  <div className="inviter-name">
                                    {invitation.inviter_name}님이 초대
                                  </div>
                                </div>
                                
                                <div className="invitation-actions">
                                  <UnifiedButton 
                                    onClick={() => handleAcceptInvitation(invitation.id)}
                                    aria-label="Accept invitation"
                                  >
                                    수락
                                  </UnifiedButton>
                                  <UnifiedButton 
                                    onClick={() => handleDeclineInvitation(invitation.id)}
                                    aria-label="Decline invitation"
                                  >
                                    거절
                                  </UnifiedButton>
                                </div>
                              </div>
                      )}
                          </div>
                    }
                        
                        {/* 받은 초대가 없을 때 */}
                        {(!invitations.received || invitations.received.length === 0) &&
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                            받은 초대가 없습니다
                          </div>
                    }
                        
                        {/* 간단한 통계 */}
                        <div className="invitation-stats">
                          <div className="stat-item">
                            보낸 초대: <span className="stat-number">{invitations.sent?.length || 0}</span>개
                          </div>
                          <div className="stat-item">
                            최근 수락: <span className="stat-number">{invitations.recent_accepted?.length || 0}</span>개
                          </div>
                        </div>
                      </div>
                  }
                  </div>
                }
              </UnifiedCard>
            </div>

            {/* 프로젝트 단계별 진행 현황 - Calendar 페이지와 동일한 디자인 */}
            <ProjectPhaseBoard
              projects={[...projectListData]}
              onPhaseUpdate={(projectId, phaseKey, start_date, end_date, completed) => {
                const data = {
                  type: phaseKey,
                  start_date: start_date,
                  end_date: end_date,
                  completed: completed || false
                };
                UpdateDate(data, projectId).
                then(() => {
                  refetchProject(dispatch, navigate);
                }).
                catch((err) => {
                  
                  alert('단계 업데이트에 실패했습니다.');
                });
              }}
              projectCounts={{
                total: projectListData.length,
                thisMonth: this_month_project ? this_month_project.length : 0,
                nextMonth: next_month_project ? next_month_project.length : 0
              }}
              showTitle={true} />

            {/* 프로젝트 일정 섹션 */}
            <ProjectScheduleSection
              projects={projectListData} />

          </div>
        </main>
      </div>
    </PageTemplate>);

}