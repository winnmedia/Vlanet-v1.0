import React, { useState, useEffect, useRef, useMemo , Suspense } from 'react'
import dynamic from 'next/dynamic';
;
;

import { UnifiedButton } from '../../components/unified/UnifiedButton';

import { Input } from '../../components/unified/Input'
import { useRouter, useParams } from '../../util/nextNavigation'
import { checkSession } from '../../util/util'
import '../../css/Cms/FeedbackVideoResponsive.scss'

import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'










import { useSelector } from 'react-redux'

import { FeedbackFile, GetFeedBack, DeleteFeedbackFile, GetEncodingStatus } from '../../api/feedback'

import moment from 'moment'
import 'moment/locale/ko'

// 시간 포맷 함수
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function FeedbackStable() {
  const { navigate } = useRouter()
  const { user, project_list } = useSelector((s) => s.ProjectStore)
  const { project_id } = useParams()
  // 상태 관리
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trigger, setTrigger] = useState(0)
  const [current_project, set_current_project] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const videoPlayerRef = useRef(null)
  const [showUploadGuide, setShowUploadGuide] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [encodingStatus, setEncodingStatus] = useState(null)
  const [encodingCheckInterval, setEncodingCheckInterval] = useState(null)
  const [feedbackTime, setFeedbackTime] = useState('')
  const [showProjectInfo, setShowProjectInfo] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState('feedback') // 'feedback' or 'comment'

  // 권한 체크
  const is_admin = useMemo(() => {
    if (current_project) {
      if (
        user === current_project.owner_email ||
        current_project.member_list.filter(
          (member) => member.email === user && member.rating === 'manager',
        ).length > 0
      ) {
        return true
      }
    }
    return false
  }, [current_project, user])

  const refetch = () => {
    setTrigger(Date.now())
  }

  // 인코딩 상태 체크
  const startEncodingStatusCheck = () => {
    if (typeof GetEncodingStatus !== 'function') {
      
import { Button } from '../../components/unified/Button'
const down = dynamic(() => import('../../images/Cms/down_icon.svg'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const useTab = dynamic(() => import('../../hooks/UseTab'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const VideoUploadGuide = dynamic(() => import('../../components/VideoUploadGuide'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const VideoPlayer = dynamic(() => import('../../components/VideoPlayer'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const OpinionInput = dynamic(() => import('../../tasks/Feedback/OpinionInput'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const FeedbackMore = dynamic(() => import('../../tasks/Feedback/FeedbackMore'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const FeedbackManage = dynamic(() => import('../../tasks/Feedback/FeedbackManage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const FeedbackInput = dynamic(() => import('../../tasks/Feedback/FeedbackInput'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const UnifiedCard = dynamic(() => import('../../components/unified/UnifiedCard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const UnifiedModal = dynamic(() => import('../../components/unified/UnifiedModal'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
      return;
    }
    
    const interval = setInterval(() => {
      GetEncodingStatus(project_id)
        .then((res) => {
          setEncodingStatus(res.data.encoding_status)
          
          if (res.data.encoding_status === 'completed' || res.data.encoding_status === 'failed') {
            clearInterval(interval)
            setEncodingCheckInterval(null)
            
            if (res.data.encoding_status === 'completed') {
              window.alert('영상 인코딩이 완료되었습니다.')
              refetch()
            } else if (res.data.encoding_status === 'failed') {
              window.alert('영상 인코딩에 실패했습니다. 다시 시도해주세요.')
            }
          }
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            clearInterval(interval)
            setEncodingCheckInterval(null)
          }
        })
    }, 5000)
    
    setEncodingCheckInterval(interval)
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (encodingCheckInterval) {
        clearInterval(encodingCheckInterval)
      }
    }
  }, [encodingCheckInterval])

  // 인증 체크
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  // 피드백 데이터 로드
  useEffect(() => {
    const abortController = new AbortController()
    
    if (!project_id) {
      setError('프로젝트 ID가 없습니다.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    GetFeedBack(project_id, { signal: abortController.signal })
      .then((res) => {
        // API 응답 처리
        let projectData = null
        
        if (res.data && res.data.result) {
          // 표준 형식
          projectData = res.data.result
        } else if (res.data && res.data.project) {
          // 대체 형식
          projectData = res.data.project
        } else if (res.data) {
          // 직접 데이터
          projectData = res.data
        } else {
          throw new Error('프로젝트 데이터가 없습니다.')
        }
        
        // 데이터 검증 및 기본값 설정
        if (projectData) {
          // feedback이 배열이 아닌 경우 빈 배열로 설정
          if (!Array.isArray(projectData.feedback)) {
            projectData.feedback = []
          }
          
          // member_list가 없는 경우 빈 배열로 설정
          if (!Array.isArray(projectData.member_list)) {
            projectData.member_list = []
          }
          
          // files URL 로깅
          set_current_project(projectData)
        }
        
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return
        }
        
        if (err.response?.status === 404 || err.response?.status === 400) {
          // 404 또는 400은 프로젝트가 없는 경우
          // Redux store에서 프로젝트 존재 여부 확인
          const projectExists = project_list?.some(p => p.id === parseInt(project_id))
          if (!projectExists) {
            setError(`프로젝트 ID ${project_id}를 찾을 수 없습니다. 프로젝트 목록으로 돌아갑니다.`)
          } else {
            setError('프로젝트 정보를 불러오는 중 오류가 발생했습니다.')
          }
          setTimeout(() => navigate('/cmshome'), 2000)
        } else if (err.response?.status === 401) {
          setError('인증이 필요합니다. 다시 로그인해주세요.')
          navigate('/login', { replace: true })
        } else if (err.response?.status === 403) {
          setError('이 프로젝트에 접근할 권한이 없습니다.')
          setTimeout(() => navigate('/cmshome'), 2000)
        } else if (err.response?.data?.message) {
          setError(err.response.data.message)
        } else if (err.message === 'Network Error') {
          setError('네트워크 연결을 확인해주세요.')
        } else {
          setError('피드백을 불러오는데 실패했습니다.')
        }
        
        setLoading(false)
      })
    
    return () => {
      abortController.abort()
    }
  }, [project_id, trigger, navigate])

  // Tab 관리
  const { currentTab, changeTab } = useTab(0)

  // 파일 업로드 핸들러
  const onUploadProgress = (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    setUploadProgress(percentCompleted)
  }

  const onUploadComplete = () => {
    refetch()
    startEncodingStatusCheck()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  }

  const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('files', file);
    
    FeedbackFile(formData, project_id, onUploadProgress)
      .then((res) => {
        window.alert('파일 업로드가 완료되었습니다.');
        onUploadComplete();
        // input 초기화
        const input = typeof window !== 'undefined' && document.getElementById('video-upload');
        if (input) input.value = '';
      })
      .catch((err) => {
        
        if (err.response?.status === 413) {
          window.alert('파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.');
        } else if (err.response?.status === 401) {
          window.alert('인증이 필요합니다. 다시 로그인해주세요.');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 405) {
          window.alert('파일 업로드 기능이 현재 지원되지 않습니다. 서버 설정을 확인해주세요.');
        } else if (err.response?.status === 404) {
          window.alert('업로드 경로를 찾을 수 없습니다. 프로젝트가 존재하는지 확인해주세요.');
        } else {
          window.alert(`파일 업로드에 실패했습니다. (오류 코드: ${err.response?.status || '네트워크 오류'})`);
        }
      })
      .finally(() => {
        setUploadProgress(0);
      });
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        uploadFile(file);
      } else {
        window.alert('동영상 파일만 업로드 가능합니다.');
      }
    }
  }

  // 타임스탬프 클릭 핸들러
  const handleTimestampClick = (timeStr) => {
    const parts = timeStr.split(':')
    const minutes = parseInt(parts[0]) || 0
    const seconds = parseInt(parts[1]) || 0
    const totalSeconds = minutes * 60 + seconds
    
    if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
      videoPlayerRef.current.seekTo(totalSeconds)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar tab="feedback" />
          <main role="main">
            <div className="content">
              <div className="loading">피드백 정보를 불러오는 중...</div>
            </div>
          </main>
        </div>
      </PageTemplate>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar tab="feedback" />
          <main role="main">
            <div className="content">
              <div className="error">
                <h3>오류 발생</h3>
                <p>{error}</p>
                <Button onClick={() = aria-label="Click"> navigate('/cmshome')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate('/cmshome')}>홈으로 돌아가기</Button>
              </div>
            </div>
          </main>
        </div>
      </PageTemplate>
    )
  }

  // 데이터가 없는 경우
  if (!current_project) {
    return (
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar tab="feedback" />
          <main role="main">
            <div className="content">
              <div className="error">
                <h3>프로젝트를 찾을 수 없습니다</h3>
                <Button onClick={() = aria-label="Click"> navigate('/cmshome')} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigate('/cmshome')}>홈으로 돌아가기</Button>
              </div>
            </div>
          </main>
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab="feedback" />
        <main role="main">
          <div className="content">
            <div className="feedback">
              <div className="feedback-header">
                <div className="header-content">
                  <div className="header-left">
                    <Button variant="ghost" aria-label="Click"> navigate('/cmshome')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </Button>
                    <div className="project-info">
                      <h1 className="project-name">{current_project.name || '프로젝트 이름 없음'}</h1>
                      <div className="project-meta">
                        <span className="meta-item">담당자: {current_project.manager || '미지정'}</span>
                        <span className="meta-item">의뢰사: {current_project.consumer || '미지정'}</span>
                        <span className="meta-item">멤버: {current_project.member_list?.length || 0}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="header-right">
                    <Button  aria-label="Click"> setShowProjectInfo(!showProjectInfo)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <circle cx="12" cy="8" r="1" />
                      </svg>
                      프로젝트 정보
                    </Button>
                    <Button  aria-label="Click"> navigate(`/ProjectView/${project_id}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      프로젝트 보기
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="tab_wrap">
                <ul>
                  <li
                    className={currentTab === 0 ? 'active' : ''}
                    onClick={undefined}
                onKeyDown={(e) => { if (e.key === 'Enter') undefined }}
                  >
                    피드백
                  </li>
                  <li
                    className={currentTab === 1 ? 'active' : ''}
                    onClick={undefined}
                onKeyDown={(e) => { if (e.key === 'Enter') undefined }}
                  >
                    폴더 관리
                  </li>
                  {is_admin && (
                    <li
                      className={currentTab === 2 ? 'active' : ''}
                      onClick={undefined}
                onKeyDown={(e) => { if (e.key === 'Enter') undefined }}
                    >
                      게시글 관리
                    </li>
                  )}
                </ul>
              </div>

              <div className="tab_content">
                {currentTab === 0 && (
                  <div className="feedback_write">
                    {/* 왼쪽 - 플레이어 섹션 */}
                    <div className="player-section">
                      <div className="player-wrapper">
                        <div className="videobox">
                          <div className={`video_inner ${current_project.files ? 'active' : ''}`}>
                            {current_project.files ? (
                              <>
                                <VideoPlayer
                                  ref={videoPlayerRef}
                                  videoUrl={current_project.files}
                                  onTimeUpdate={setCurrentVideoTime}
                                  onFeedbackClick={(time) => {
                                    // 현재 시간을 MM:SS 형식으로 변환
                                    const formattedTime = formatTime(time);
                                    setFeedbackTime(formattedTime);
                                    // 피드백 탭으로 전환
                                    setActiveFormTab('feedback');
                                  }}
                                />
                                {encodingStatus && encodingStatus !== 'completed' && (
                                  <div className="encoding-status">
                                    <div className="encoding-message">
                                      {encodingStatus === 'processing' && '영상을 인코딩 중입니다...'}
                                      {encodingStatus === 'failed' && '인코딩에 실패했습니다.'}
                                    </div>
                                    {encodingStatus === 'processing' && (
                                      <div className="encoding-progress">
                                        <div className="progress-bar">
                                          <div className="progress-fill" style={{ width: '50%' }}></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="upload_area">
                                <div className="upload_btn_wrap">
                                  <UnifiedInput id="video_upload"
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileUpload}
                                    className="video_upload"
                                   / aria-label="file input">
                                  <label htmlFor="video_upload" className="video_upload_label">
                                    <div>영상 업로드</div>
                                  </label>
                                </div>
                                <Button  aria-label="Click"> setShowUploadGuide(true)}>
                                  업로드 가이드
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="player-controls">
                        <div className="control-group">
                          <Button onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.seekTo(Math.max(0, currentVideoTime - 3));
                            }} onKeyDown={(e) => { if (e.key === 'Enter') {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.seekTo(Math.max(0, currentVideoTime - 3));
                            } }}
                          }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 8 8 12 12 16" />
                              <polyline points="16 8 12 12 16 16" />
                            </svg>
                            3초 뒤로
                          </Button>
                          <Button onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.seekTo(currentVideoTime + 3);
                            }} onKeyDown={(e) => { if (e.key === 'Enter') {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.seekTo(currentVideoTime + 3);
                            } }}
                          }}>
                            3초 앞으로
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="8 8 12 12 8 16" />
                              <polyline points="12 8 16 12 12 16" />
                            </svg>
                          </Button>
                        </div>
                        <div className="control-group">
                          <Button onClick={() => {
                              // 현재 페이지 URL 복사
                              const shareUrl = typeof window !== 'undefined' && window.location.href;
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                window.alert('피드백 페이지 링크가 복사되었습니다.');
                              }} onKeyDown={(e) => { if (e.key === 'Enter') {
                              // 현재 페이지 URL 복사
                              const shareUrl = typeof window !== 'undefined' && window.location.href;
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                window.alert('피드백 페이지 링크가 복사되었습니다.');
                              } }}).catch(() => {
                                window.alert('링크 복사에 실패했습니다.');
                              });
                            }}
                            style={{
                              backgroundColor: '#0058da',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#0047b8'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#0058da'}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            페이지 공유
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 오른쪽 - 폼 섹션 */}
                    <div className="forms-section" style={{ width: activeFormTab === 'comment' ? '650px' : '400px', transition: 'width 0.3s ease' }}>
                      <div className="form-tabs">
                        <UnifiedButton 
                          className={`tab-button ${activeFormTab === 'feedback' ? 'active' : ''}`}
                          onClick={() => setActiveFormTab('feedback')} type="button" aria-label="클릭" onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setActiveFormTab('feedback')}
                        >
                          피드백 등록
                        </UnifiedButton>
                        <UnifiedButton 
                          className={`tab-button ${activeFormTab === 'comment' ? 'active' : ''}`}
                          onClick={() => setActiveFormTab('comment')} type="button" aria-label="클릭" onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setActiveFormTab('comment')}
                        >
                          코멘트 작성
                        </UnifiedButton>
                      </div>
                      
                      <div className="form-content">
                        {activeFormTab === 'feedback' ? (
                          <div className="tab-wrapper">
                            <div className="form-area">
                              <div className="feedback-form">
                                <div className="form-header">
                                  <h3>피드백 등록</h3>
                                  <p>영상의 특정 구간에 대한 피드백을 남겨주세요</p>
                                </div>
                                <FeedbackInput
                                  project_id={project_id}
                                  current_project={current_project}
                                  initialTime={feedbackTime}
                                  onTimeChange={setFeedbackTime}
                                  refetch={refetch}
                                />
                              </div>
                            </div>
                            
                            <div className="feedback-list-area">
                              <h4>피드백 목록</h4>
                              <div className="list">
                                <FeedbackMore 
                                  current_project={current_project} 
                                  onTimeClick={handleTimestampClick}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="tab-wrapper">
                            <div className="form-area">
                              <div className="comment-section">
                                <div className="section-header">
                                  <h3>코멘트 작성</h3>
                                  <p>프로젝트에 대한 전반적인 의견을 작성해주세요</p>
                                </div>
                                <OpinionInput
                                  project_id={project_id}
                                  current_project={current_project}
                                  is_admin={is_admin}
                                  refetch={refetch}
                                />
                              </div>
                            </div>
                            
                            <div className="feedback-list-area">
                              <h4>최근 코멘트</h4>
                              <div className="list">
                                <FeedbackMore 
                                  current_project={current_project} 
                                  onTimeClick={handleTimestampClick}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                )}

                {currentTab === 1 && (
                  <div className="folder_manage">
                    <div className="upload_section">
                      <div className="section-header">
                        <h3>파일 업로드</h3>
                        <p>프로젝트에 필요한 영상 파일을 업로드하세요</p>
                      </div>
                      
                      <div 
                        className={`upload-dropzone ${isDragging ? 'active' : ''}`}
                        id="dropzone"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <div className="dropzone-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </div>
                        <h4>파일을 여기에 드래그하거나</h4>
                        <p>아래 버튼을 클릭하여 선택하세요</p>
                        <label htmlFor="video-upload" className="upload-button">
                          파일 선택
                        </label>
                        <UnifiedInput id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={handleFileUpload}
                          multiple
                         / aria-label="file input">
                      </div>
                      
                      {uploadProgress > 0 && (
                        <div className="upload-status">
                          <div className="status-item">
                            <div className="file-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            </div>
                            <div className="file-info">
                              <div className="file-name">동영상 파일 업로드 중...</div>
                              <div className="file-size">진행률: {uploadProgress}%</div>
                              <div className="progress-wrapper">
                                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="files_section">
                      <div className="section-header">
                        <h3>업로드된 파일</h3>
                        <span className="file-count">{current_project.files ? '1개' : '0개'}</span>
                      </div>
                      
                      <div className="file-list">
                        {current_project.files ? (
                          <div className="file-item active">
                            <div className="file-thumbnail">
                              <div className="file-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              </div>
                            </div>
                            <div className="file-details">
                              <div className="file-name">{current_project.files.split('/').pop()}</div>
                              <div className="file-meta">
                                <span>동영상</span>
                                <span>•</span>
                                <span>업로드됨</span>
                              </div>
                            </div>
                            <div className="file-actions">
                              <UnifiedButton title="다운로드" aria-label="Click" type="button">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </UnifiedButton>
                              {is_admin && (
                                <Button variant="danger" title="삭제" aria-label="Click"> {
                                  if (window.confirm('파일을 삭제하시겠습니까?')) {
                                    DeleteFeedbackFile(project_id)
                                      .then(() => {
                                        window.alert('파일이 삭제되었습니다.')
                                        refetch()
                                      })
                                      .catch(() => {
                                        window.alert('파일 삭제에 실패했습니다.')
                                      })
                                  }
                                }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                              <polyline points="13 2 13 9 20 9" />
                            </svg>
                            <p>아직 업로드된 파일이 없습니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === 2 && is_admin && (
                  <div className="manage">
                    <div className="feedback-manage-section">
                      <div className="section-header">
                        <h3>피드백 관리</h3>
                        <div className="filter-controls">
                          <UnifiedInput variant="select" className="filter-select" >
                            <option value="all">전체 보기</option>
                            <option value="public">공개 피드백</option>
                            <option value="private">비공개 피드백</option>
                          </UnifiedInput>
                        </div>
                      </div>
                      
                      <div className="feedback-list">
                        {current_project.feedback && current_project.feedback.length > 0 ? (
                          current_project.feedback.map((item, idx) => (
                            <div key={idx} className="feedback-item">
                              <div className="feedback-header">
                                <div className="feedback-info">
                                  <span className="feedback-time">{item.section || '시간 미지정'}</span>
                                  <div className="feedback-author">
                                    by <span className="author-name">{item.nickname || item.email || '익명'}</span>
                                  </div>
                                </div>
                                <div className="feedback-actions">
                                  <UnifiedButton title="수정" aria-label="Click" type="button">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </UnifiedButton>
                                  <Button variant="danger" title="삭제" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Click">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>} />
                                </div>
                              </div>
                              <div className="feedback-content">
                                {item.text || item.contents || '내용 없음'}
                              </div>
                              <div className="feedback-footer">
                                <div className="feedback-status">
                                  <span className={`status-badge ${item.security ? 'private' : 'public'}`}>
                                    {item.security ? '비공개' : '공개'}
                                  </span>
                                </div>
                                <span className="feedback-date">
                                  {moment(item.created).format('YYYY.MM.DD HH:mm')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 11H3v10h10v-6h4l2-2-6-6-2 2v4z" />
                              <path d="M17 3l4 4-4 4" />
                            </svg>
                            <h4>피드백이 없습니다</h4>
                            <p>아직 등록된 피드백이 없습니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="management-sidebar">
                      <UnifiedCard variant="default" className="stats-card" >
                        <h4>프로젝트 통계</h4>
                        <div className="stat-item">
                          <span className="stat-label">전체 피드백</span>
                          <span className="stat-value">{current_project.feedback?.length || 0}</span>
                        </UnifiedCard>
                        <div className="stat-item">
                          <span className="stat-label">프로젝트 멤버</span>
                          <span className="stat-value">{current_project.member_list?.length || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">업로드된 파일</span>
                          <span className="stat-value">{current_project.files ? 1 : 0}</span>
                        </div>
                      </div>
                      
                      <div className="notice-section">
                        <div className="notice-header">
                          <h4>공지사항</h4>
                          <Button title="공지 추가" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Click">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>} />
                        </div>
                        <div className="notice-empty">
                          <p>실시간 채팅 기능은 현재 지원되지 않습니다.</p>
                          <p>피드백 탭에서 의견을 남겨주세요.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showUploadGuide && (
            <VideoUploadGuide onClose={() => setShowUploadGuide(false)} />
          )}
          
          {showProjectInfo && (
            <div className="modal-backdrop" onClick={() = role="dialog" aria-modal="true"> setShowProjectInfo(false)} onKeyDown={(e) => e.key === 'Enter' && () = role="dialog" aria-modal="true"> setShowProjectInfo(false)}>
              <div className="modal-content project-info-modal" onClick={(e) = role="dialog" aria-modal="true"> e.stopPropagation()} onKeyDown={(e) => e.key === 'Enter' && (e) = role="dialog" aria-modal="true"> e.stopPropagation()}>
                <div className="modal-header" role="dialog" aria-modal="true">
                  <h3>프로젝트 정보</h3>
                  <Button variant="ghost" aria-label="Click"> setShowProjectInfo(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
                <div className="modal-body" role="dialog" aria-modal="true">
                  <div className="info-group">
                    <label>프로젝트명</label>
                    <p>{current_project.name}</p>
                  </div>
                  <div className="info-group">
                    <label>담당자</label>
                    <p>{current_project.manager || '미지정'}</p>
                  </div>
                  <div className="info-group">
                    <label>의뢰사</label>
                    <p>{current_project.consumer || '미지정'}</p>
                  </div>
                  <div className="info-group">
                    <label>설명</label>
                    <p>{current_project.description || '설명이 없습니다.'}</p>
                  </div>
                  <div className="info-group">
                    <label>생성일</label>
                    <p>{moment(current_project.created).format('YYYY년 MM월 DD일')}</p>
                  </div>
                  <div className="info-group">
                    <label>멤버 ({current_project.member_list?.length || 0}명)</label>
                    <div className="member-list">
                      {current_project.member_list?.map((member, idx) => (
                        <div key={idx} className="member-item">
                          <span className="member-name">{member.nickname || member.email}</span>
                          <span className="member-role">{member.rating === 'manager' ? '관리자' : '일반'}</span>
                        </div>
                      )) || <p>멤버가 없습니다.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </PageTemplate>
  )
}

export default FeedbackStable