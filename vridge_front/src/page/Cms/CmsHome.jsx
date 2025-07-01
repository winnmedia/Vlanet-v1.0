import 'css/Cms/CmsCommon.scss'
import 'css/Cms/CmsHomeEnhanced.scss'
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

  // 인증 체크 및 프로젝트 데이터 로드
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    } else {
      // 프로젝트 데이터 가져오기
      refetchProject(dispatch, navigate)
    }
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

            <div className="part project-progress-enhanced" style={{ display: 'none' }}>
              <div className="s_title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                프로젝트 진행사항
                <button 
                  className={`collapse-btn ${showDashboard ? '' : 'collapsed'}`}
                  onClick={() => setShowDashboard(!showDashboard)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1631F8',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0F23C9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1631F8';
                  }}
                >
                  <svg 
                    width="10" 
                    height="10" 
                    viewBox="0 0 10 10" 
                    fill="white"
                    style={{
                      transform: showDashboard ? 'rotate(0deg)' : 'rotate(180deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path d="M5 7L1 3h8L5 7z"/>
                  </svg>
                </button>
              </div>
              <div style={{ 
                display: showDashboard ? 'none' : 'block',
                marginTop: '20px',
                animation: showDashboard ? '' : 'fadeIn 0.3s ease'
              }}>
                <ul className="schedule enhanced">
                  <li style={{
                    background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(22, 49, 248, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    전체
                    프로젝트 <span>{project_list.length}</span>
                  </li>
                  <li style={{
                    background: 'linear-gradient(135deg, #212529 0%, #000000 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    이번 달
                    프로젝트 <span>{this_month_project.length}</span>
                  </li>
                  <li style={{
                    background: 'linear-gradient(135deg, #212529 0%, #000000 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(255, 167, 38, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    다음 달
                    프로젝트 <span>{next_month_project.length}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 프로젝트 단계별 진행 현황 - Calendar 페이지와 동일한 디자인 */}
            {!showDashboard && (
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
            )}

            {/* 새로운 피드백 섹션 */}
            <div className="part">
              <div className="s_title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#333',
                  whiteSpace: 'nowrap' 
                }}>최근 활동</div>
                <button 
                  className={`collapse-btn ${showRecentActivity ? 'collapsed' : ''}`}
                  onClick={() => setShowRecentActivity(!showRecentActivity)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1631F8',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0F23C9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1631F8';
                  }}
                >
                  <svg 
                    width="10" 
                    height="10" 
                    viewBox="0 0 10 10" 
                    fill="white"
                    style={{
                      transform: showRecentActivity ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path d="M5 7L1 3h8L5 7z"/>
                  </svg>
                </button>
              </div>
              {!showRecentActivity && (
              <div className="feedback-list" style={{ marginTop: '20px' }}>
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
                          style={{
                            padding: '14px',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            marginBottom: '12px',
                            border: '1px solid #e9ecef',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          onClick={() => navigate(`/Feedback/${feedback.projectId}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#1631F8';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 49, 248, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e9ecef';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{
                              width: '4px',
                              height: '20px',
                              backgroundColor: feedback.projectColor || '#1631F8',
                              borderRadius: '2px',
                              marginRight: '10px'
                            }} />
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                              {feedback.projectName}
                            </div>
                          </div>
                          <div style={{ paddingLeft: '14px' }}>
                            <div style={{ fontSize: '13px', color: '#495057', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '500' }}>{feedback.nickname || '익명'}</span>
                              {feedback.section && ` - ${feedback.section}`}
                            </div>
                            {feedback.text && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6c757d',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}>
                                {feedback.text}
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '6px' }}>
                              {moment(feedback.created).fromNow()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#6c757d', 
                        padding: '40px 20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>아직 피드백이 없습니다</div>
                        <div style={{ fontSize: '13px' }}>프로젝트에 피드백이 등록되면 여기에 표시됩니다</div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6c757d', 
                    padding: '40px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>프로젝트가 없습니다</div>
                    <div style={{ fontSize: '13px' }}>새 프로젝트를 생성해보세요</div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* 마감 임박 프로젝트 섹션 */}
            <div className="part">
              <div className="s_title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#333',
                  whiteSpace: 'nowrap' 
                }}>마감 임박 프로젝트</div>
                <button 
                  className={`collapse-btn ${showDeadlineProjects ? 'collapsed' : ''}`}
                  onClick={() => setShowDeadlineProjects(!showDeadlineProjects)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1631F8',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0F23C9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1631F8';
                  }}
                >
                  <svg 
                    width="10" 
                    height="10" 
                    viewBox="0 0 10 10" 
                    fill="white"
                    style={{
                      transform: showDeadlineProjects ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path d="M5 7L1 3h8L5 7z"/>
                  </svg>
                </button>
              </div>
              {!showDeadlineProjects && (
              <div className="deadline-list" style={{ marginTop: '20px' }}>
                {project_list && project_list.length > 0 ? (
                  project_list
                    .filter(project => {
                      const daysUntilDeadline = moment(project.end_date).diff(moment(), 'days');
                      return daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
                    })
                    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                    .slice(0, 5)
                    .map(project => {
                      const daysLeft = moment(project.end_date).diff(moment(), 'days');
                      const hoursLeft = moment(project.end_date).diff(moment(), 'hours');
                      
                      return (
                        <div 
                          key={project.id}
                          style={{
                            padding: '12px',
                            backgroundColor: daysLeft <= 3 ? '#fff5f5' : '#fffbf0',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            border: `1px solid ${daysLeft <= 3 ? '#ffcdd2' : '#ffe0b2'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => navigate(`/ProjectEdit/${project.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                                {project.name}
                              </div>
                              <div style={{ fontSize: '13px', color: '#495057', marginTop: '4px' }}>
                                {project.consumer} | {project.manager}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: daysLeft <= 3 ? '#e53935' : '#f57c00',
                              backgroundColor: daysLeft <= 3 ? '#ffebee' : '#fff3e0',
                              padding: '4px 12px',
                              borderRadius: '12px'
                            }}>
                              {daysLeft === 0 ? `${hoursLeft}시간` : `${daysLeft}일`} 남음
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                    마감 임박 프로젝트가 없습니다.
                  </div>
                )}
              </div>
              )}
            </div>

            <div className="part db">
              <div className="s_title">
                Online Class <span></span>
              </div>
              <ul className="oc">
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
