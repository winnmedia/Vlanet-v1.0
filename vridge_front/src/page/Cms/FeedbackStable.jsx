import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { checkSession } from 'util/util'
import 'css/Cms/Cms.scss'
import 'css/Cms/FeedbackOriginal.scss'
import 'css/Cms/CommentFix.scss'
import 'css/Cms/ButtonAlignment.scss'
import 'css/Cms/ShareDeleteFix.scss'
import 'css/Cms/ShareButtonFix.scss'
import 'css/Cms/VideoPlayerButtonFix.scss'
import 'css/Cms/UploadProgress.scss'
import 'css/Cms/LayoutFix.scss'
import 'css/Cms/SidebarSpacingFix.scss'
import 'css/Cms/ModalOpacityFix.scss'
import 'css/Cms/FeedbackSectionRedesign.scss'
import 'css/Cms/SidebarResize.scss'
import 'css/Cms/SidebarProjectSpacing.scss'
import 'css/Cms/FeedbackPageSpacing.scss'
import 'css/Cms/EncodingStatus.scss'
import 'css/Cms/FeedbackPopup.scss'
import 'css/Cms/OpinionInput.scss'

import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import 'css/Cms/SubmenuFinal.scss'
import 'css/Cms/SubmenuFeedbackFix.scss'
import FeedbackInput from 'tasks/Feedback/FeedbackInput'
import FeedbackManage from 'tasks/Feedback/FeedbackManage'
import FeedbackMore from 'tasks/Feedback/FeedbackMore'
import OpinionInput from 'tasks/Feedback/OpinionInput'
import VideoPlayer from 'components/VideoPlayer'
import VideoUploadGuide from 'components/VideoUploadGuide'

import useTab from 'hooks/UseTab'
import down from 'images/Cms/down_icon.svg'
import { useSelector } from 'react-redux'

import { FeedbackFile, GetFeedBack, DeleteFeedbackFile, GetEncodingStatus } from 'api/feedback'

import moment from 'moment'
import 'moment/locale/ko'

function FeedbackStable() {
  console.log('[FeedbackStable] Component mounted')
  const navigate = useNavigate()
  const { user, project_list } = useSelector((s) => s.ProjectStore)
  const { project_id } = useParams()
  console.log('[FeedbackStable] project_id:', project_id, 'user:', user, 'project_list:', project_list?.length || 0)

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
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [feedbackTime, setFeedbackTime] = useState('')
  const [showProjectInfo, setShowProjectInfo] = useState(false)

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
      console.log('Encoding status check not available');
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
          console.error('Error checking encoding status:', err)
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
    console.log('[FeedbackStable] Session check:', session)
    if (!session) {
      console.log('[FeedbackStable] No session, redirecting to login')
      navigate('/Login', { replace: true })
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

    console.log(`[Feedback] Loading feedback for project ${project_id}`)

    GetFeedBack(project_id, { signal: abortController.signal })
      .then((res) => {
        console.log('[Feedback] Data loaded successfully:', res.data)
        
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
            console.warn('[Feedback] feedback is not an array, setting to empty array')
            projectData.feedback = []
          }
          
          // member_list가 없는 경우 빈 배열로 설정
          if (!Array.isArray(projectData.member_list)) {
            projectData.member_list = []
          }
          
          set_current_project(projectData)
        }
        
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('[Feedback] Request aborted')
          return
        }
        
        console.error('[Feedback] Load error:', err)
        console.error('[Feedback] Error response:', err.response)
        
        if (err.response?.status === 404 || err.response?.status === 400) {
          // 404 또는 400은 프로젝트가 없는 경우
          console.log('[Feedback] Project not found error:', err.response?.status)
          
          // Redux store에서 프로젝트 존재 여부 확인
          const projectExists = project_list?.some(p => p.id === parseInt(project_id))
          if (!projectExists) {
            console.log('[Feedback] Project ID', project_id, 'not found in Redux store')
            setError(`프로젝트 ID ${project_id}를 찾을 수 없습니다. 프로젝트 목록으로 돌아갑니다.`)
          } else {
            setError('프로젝트 정보를 불러오는 중 오류가 발생했습니다.')
          }
          setTimeout(() => navigate('/CmsHome'), 2000)
        } else if (err.response?.status === 401) {
          setError('인증이 필요합니다. 다시 로그인해주세요.')
          navigate('/Login', { replace: true })
        } else if (err.response?.status === 403) {
          setError('이 프로젝트에 접근할 권한이 없습니다.')
          setTimeout(() => navigate('/CmsHome'), 2000)
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
      const formData = new FormData();
      formData.append('files', file);
      
      FeedbackFile(formData, project_id, onUploadProgress)
        .then((res) => {
          window.alert('파일 업로드가 완료되었습니다.');
          onUploadComplete();
          e.target.value = ''; // input 초기화
        })
        .catch((err) => {
          console.error('Upload error:', err);
          if (err.response?.status === 413) {
            window.alert('파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.');
          } else if (err.response?.status === 401) {
            window.alert('인증이 필요합니다. 다시 로그인해주세요.');
            navigate('/Login', { replace: true });
          } else {
            window.alert('파일 업로드에 실패했습니다.');
          }
        })
        .finally(() => {
          setUploadProgress(0);
        });
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
          <main>
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
          <main>
            <div className="content">
              <div className="error">
                <h3>오류 발생</h3>
                <p>{error}</p>
                <button onClick={() => navigate('/CmsHome')}>홈으로 돌아가기</button>
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
          <main>
            <div className="content">
              <div className="error">
                <h3>프로젝트를 찾을 수 없습니다</h3>
                <button onClick={() => navigate('/CmsHome')}>홈으로 돌아가기</button>
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
        <main>
          <div className="content">
            <div className="feedback">
              <div className="title">{current_project.name || '프로젝트 이름 없음'}</div>
              <div className="tab_wrap">
                <ul>
                  <li
                    className={currentTab === 0 ? 'active' : ''}
                    onClick={() => changeTab(0)}
                  >
                    피드백
                  </li>
                  <li
                    className={currentTab === 1 ? 'active' : ''}
                    onClick={() => changeTab(1)}
                  >
                    폴더 관리
                  </li>
                  {is_admin && (
                    <li
                      className={currentTab === 2 ? 'active' : ''}
                      onClick={() => changeTab(2)}
                    >
                      게시글 관리
                    </li>
                  )}
                </ul>
                <ul className="tab_btn">
                  <li onClick={() => navigate(`/ProjectView/${project_id}`)}>
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
                            <button onClick={() => setShowUploadGuide(true)}>
                              영상 업로드 가이드
                            </button>
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
                      {selectedFeedback && (
                        <div className="selected-feedback-popup">
                          <div className="popup-header">
                            <h3>피드백 상세</h3>
                            <button onClick={() => setSelectedFeedback(null)}>×</button>
                          </div>
                          <div className="popup-content">
                            <div className="feedback-meta">
                              <span className="author">{selectedFeedback.nickname}</span>
                              <span className="date">{moment(selectedFeedback.created).format('YYYY.MM.DD HH:mm')}</span>
                            </div>
                            <div className="feedback-text">{selectedFeedback.text}</div>
                          </div>
                        </div>
                      )}
                      <OpinionInput
                        current_project={current_project}
                        is_admin={is_admin}
                        refetch={refetch}
                      />
                      <div className="list">
                        <FeedbackMore 
                          current_project={current_project} 
                          onTimeClick={handleTimestampClick}
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
                        <p className="upload-info">
                          지원 형식: MP4, AVI, MOV, WMV 등<br/>
                          최대 크기: 2GB
                        </p>
                        <div className="upload-button-wrap">
                          <label htmlFor="video-upload" className="upload-button">
                            파일 선택
                          </label>
                          <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                        {uploadProgress > 0 && (
                          <div className="upload-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{uploadProgress}%</span>
                          </div>
                        )}
                        {current_project.files && (
                          <div className="current-file">
                            <h4>현재 업로드된 파일</h4>
                            <p>{current_project.files.split('/').pop()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === 2 && is_admin && (
                  <div className="manage">
                    <FeedbackManage
                      Rating={(rating) => rating === 'manager' ? '관리자' : '일반'}
                      project_id={project_id}
                      FeedbackID={current_project.id}
                      refetch={refetch}
                    />
                    <div className="notice">
                      <p>실시간 채팅 기능은 현재 지원되지 않습니다.</p>
                      <p>피드백 탭에서 의견을 남겨주세요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showUploadGuide && (
            <VideoUploadGuide onClose={() => setShowUploadGuide(false)} />
          )}
        </main>
      </div>
    </PageTemplate>
  )
}

export default FeedbackStable