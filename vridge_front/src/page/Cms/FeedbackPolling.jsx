import React, { useState, useEffect, useRef, useMemo , Suspense } from 'react'
import UnifiedModal from '../../components/unified/UnifiedModal';
import dynamic from 'next/dynamic';
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { UnifiedButton } from '../../components/unified/UnifiedButton';

import { Input } from '../../components/unified/Input'
import { useRouter, useParams } from '../../util/nextNavigation'
import { checkSession } from '../../util/util'

import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'











import { useSelector } from 'react-redux'

import { FeedbackFile, GetFeedBack, DeleteFeedbackFile, GetEncodingStatus } from '../../api/feedback'
import { GetChatMessages } from '../../api/chat'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackPolling() {
  const { navigate } = useRouter()
  const { user } = useSelector((s) => s.ProjectStore)
  const { project_id } = useParams()

  // 상태 관리
  const [trigger, setTrigger] = useState(0)
  const [current_project, set_current_project] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const videoPlayerRef = useRef(null)
  const [showUploadGuide, setShowUploadGuide] = useState(false)
  const [VideoLoad, SetVideoLoad] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [encodingStatus, setEncodingStatus] = useState(null)
  const [encodingCheckInterval, setEncodingCheckInterval] = useState(null)
  const [feedbackTime, setFeedbackTime] = useState('')
  const [showProjectInfo, setShowProjectInfo] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  
  // AI 선생님 관련 상태
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [teacherFeedback, setTeacherFeedback] = useState(null)
  const [teachers, setTeachers] = useState([])

  // Polling 관련 상태
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [me, set_me] = useState({
    email: '',
    nickname: '',
    rating: '',
  })
  const [items, setItems] = useState([])
  const pollingIntervalRef = useRef(null)
  const pollingInterval = 3000 // 3초마다 polling

  // 권한 체크
  const is_admin = useMemo(() => {
    if (current_project) {
      if (
        user === current_project.owner_email ||
        current_project.member_list.filter(
          (member, index) =>
            member.email === user && member.rating === 'manager',
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
const FeedbackMessagePolling = dynamic(() => import('../../tasks/Feedback/FeedbackMessagePolling'), {
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

  // 채팅 메시지 로드 (Polling)
  const loadMessages = React.useCallback(async () => {
    if (!project_id) return;
    
    try {
      const response = await GetChatMessages(project_id);
      if (response.data && response.data.messages) {
        setItems(response.data.messages);
      }
    } catch (error) {
      
      if (error.response?.status === 404) {
        // 404인 경우 빈 배열로 초기화
        setItems([]);
      }
    }
  }, [project_id]);

  // Polling 시작
  const startPolling = React.useCallback(() => {
    if (!project_id) return;

    setConnectionStatus('connected');
    
    // 초기 메시지 로드
    loadMessages();
    
    // Polling 인터벌 설정
    pollingIntervalRef.current = setInterval(() => {
      loadMessages();
    }, pollingInterval);
  }, [project_id, loadMessages, pollingInterval]);

  // Polling 중지
  const stopPolling = React.useCallback(() => {
    
    setConnectionStatus('disconnected');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (encodingCheckInterval) {
        clearInterval(encodingCheckInterval)
      }
      stopPolling();
    }
  }, [encodingCheckInterval, stopPolling])

  // 인증 체크
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    }
  }, [navigate])

  // 피드백 데이터 로드
  useEffect(() => {
    const abortController = new AbortController()
    
    if (!project_id) return;

    GetFeedBack(project_id, { signal: abortController.signal })
      .then((res) => {
        if (res.data && res.data.result) {
          set_current_project(res.data.result)
        } else if (res.data) {
          // result 없이 바로 데이터가 오는 경우
          set_current_project(res.data)
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          // 404 에러는 피드백이 아직 생성되지 않은 경우일 수 있음
          } else if (err.response && err.response.data) {
          window.alert(err.response.data.message || '피드백을 불러오는데 실패했습니다.')
        }
      })
    
    return () => {
      abortController.abort()
    }
  }, [project_id, trigger])

  // 사용자 정보 설정
  useEffect(() => {
    if (current_project && user) {
      if (current_project.owner_email === user) {
        set_me({
          email: current_project.owner_email,
          nickname: current_project.owner_nickname,
          rating: 'manager',
        })
      } else {
        let member_me = current_project.member_list.filter(
          (i) => i.email === user,
        )
        if (member_me.length === 1) {
          member_me = member_me[0]
          set_me({
            email: member_me.email,
            nickname: member_me.nickname,
            rating: member_me.rating,
          })
        }
      }
    }
  }, [current_project, user])

  // Polling 시작/중지
  useEffect(() => {
    if (project_id && current_project) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    }
  }, [project_id, current_project, startPolling, stopPolling])

  // AI 선생님 목록 가져오기
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = typeof window !== 'undefined' && localStorage.getItem('VGID')?.replace(/"/g, '');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video-analysis/teachers/`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setTeachers(data.data || [])
        }
      } catch (error) {}
    }
    
    fetchTeachers()
  }, [])

  // Tab 관리
  const { currentTab, changeTab } = useTab(0)

  // 파일 업로드 핸들러
  const onUploadProgress = (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    setUploadProgress(percentCompleted)
  }

  function Rating(rating) {
    if (rating === 'manager') {
      return '관리자'
    } else {
      return '일반'
    }
  }

  const onUploadComplete = () => {
    refetch()
    startEncodingStatusCheck()
  }

  // 타임스탬프 클릭 핸들러
  const handleTimestampClick = (timestamp) => {
    if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
      videoPlayerRef.current.seekTo(timestamp)
    }
    setShowTeacherModal(false)
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab="feedback" />
        <main role="main">
          {/* 연결 상태 표시기 */}
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#fff',
            background: connectionStatus === 'connected' 
              ? '#28a745' 
              : connectionStatus === 'disconnected' 
                ? '#dc3545' 
                : '#ffc107',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#fff',
              animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'
            }} />
            {connectionStatus === 'connected' && '실시간 연결됨'}
            {connectionStatus === 'disconnected' && '연결 끊김'}
          </div>

          {current_project ? (
            <div className="content">
              <div className="feedback">
                <div className="title">{current_project.name || '프로젝트 이름 없음'}</div>
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
                  <ul className="tab_btn">
                    <li onClick={undefined}
                onKeyDown={(e) => { if (e.key === 'Enter') undefined }}`)}>
                      프로젝트 보기
                    </li>
                  </ul>
                </div>

                <div className="tab_content">
                  {currentTab === 0 && (
                    <div className="feedback_write">
                      <div className="left">
                        <div className="video_wrap">
                          {current_project.files ? (
                            <>
                              <VideoPlayer
                                ref={videoPlayerRef}
                                src={current_project.files}
                                onTimeUpdate={setCurrentVideoTime}
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
                            <div className="no_data">
                              <p>등록된 영상이 없습니다.</p>
                              <Button onClick={() = aria-label="Click"> setShowUploadGuide(true)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> setShowUploadGuide(true)}>
                                영상 업로드 가이드
                              </Button>
                            </div>
                          )}
                        </div>
                        <FeedbackInput
                          current_project={current_project}
                          currentVideoTime={currentVideoTime}
                          is_admin={is_admin}
                          refetch={refetch}
                          feedbackTime={feedbackTime}
                          setFeedbackTime={setFeedbackTime}
                        />
                      </div>
                      <div className="right">
                        <OpinionInput
                          current_project={current_project}
                          is_admin={is_admin}
                          refetch={refetch}
                        />
                        <div className="list">
                          <FeedbackMore 
                            current_project={current_project} 
                            onTimeClick={(timeStr) => {
                              const parts = timeStr.split(':')
                              const minutes = parseInt(parts[0]) || 0
                              const seconds = parseInt(parts[1]) || 0
                              const totalSeconds = minutes * 60 + seconds
                              
                              if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
                                videoPlayerRef.current.seekTo(totalSeconds)
                              }
                            }}
                            onFeedbackSelect={setSelectedFeedback}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTab === 1 && (
                    <div className="folder_manage">
                      <div className="upload_wrap">
                        <div className="upload-section">
                          <h3>영상 파일 업로드</h3>
                          <UnifiedInput
                            type="file"
                            accept="video/*"
                            onChange={(e) = aria-label="file input" /> {
                              const file = e.target.files[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('files', file);
                                
                                FeedbackFile(formData, project_id, onUploadProgress)
                                  .then((res) => {
                                    window.alert('파일 업로드가 완료되었습니다.');
                                    onUploadComplete();
                                  })
                                  .catch((err) => {
                                    
                                    window.alert('파일 업로드에 실패했습니다.');
                                  })
                                  .finally(() => {
                                    setUploadProgress(0);
                                  });
                              }
                            }}
                          />
                          {uploadProgress > 0 && (
                            <div className="upload-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <span>{uploadProgress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTab === 2 && is_admin && (
                    <div className="manage">
                      <FeedbackManage
                        Rating={Rating}
                        project_id={project_id}
                        FeedbackID={current_project.id}
                        refetch={refetch}
                      />
                      <FeedbackMessagePolling
                        Rating={Rating}
                        project_id={project_id}
                        socketConnected={connectionStatus === 'connected'}
                        items={items}
                        me={me}
                        onMessageSent={loadMessages}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="content">
              <div className="loading">피드백 정보를 불러오는 중...</div>
            </div>
          )}

          {showUploadGuide && (
            <VideoUploadGuide onClose={() => setShowUploadGuide(false)} />
          )}
        </main>
      </div>
    </PageTemplate>
  )
}