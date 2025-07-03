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

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import 'css/Cms/SubmenuFinal.scss'
import 'css/Cms/SubmenuFeedbackFix.scss'
import FeedbackInput from 'tasks/Feedback/FeedbackInput'
import FeedbackManage from 'tasks/Feedback/FeedbackManage'
import FeedbackMore from 'tasks/Feedback/FeedbackMore'
import FeedbackMessage from 'tasks/Feedback/FeedbackMessage'
import OpinionInput from 'tasks/Feedback/OpinionInput'
import VideoPlayer from 'components/VideoPlayer'
import VideoUploadGuide from 'components/VideoUploadGuide'

import useTab from 'hooks/UseTab'

import down from 'images/Cms/down_icon.svg'

import { useSelector } from 'react-redux'

import { FeedbackFile, GetFeedBack, DeleteFeedbackFile, GetEncodingStatus } from 'api/feedback'

import moment from 'moment'
import 'moment/locale/ko'

export default function Feedback() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.ProjectStore)
  
  // Cleanup effect for any pending timeouts
  useEffect(() => {
    return () => {
      // Clear any pending upload timeouts
      if (window.uploadTimeouts && window.uploadTimeouts.length > 0) {
        window.uploadTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
        window.uploadTimeouts = []
      }
      // Clear lastProgressTime
      delete window.lastProgressTime
    }
  }, [])

  const { project_id } = useParams()

  const [trigger, setTrigger] = useState(0)
  const [current_project, set_current_project] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const videoPlayerRef = useRef(null)
  const [showUploadGuide, setShowUploadGuide] = useState(false)
  const [VideoLoad, SetVideoLoad] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [encodingStatus, setEncodingStatus] = useState(null)
  const [encodingCheckInterval, setEncodingCheckInterval] = useState(null)
  const [feedbackTime, setFeedbackTime] = useState('') // 피드백 시간 상태 추가
  const [showProjectInfo, setShowProjectInfo] = useState(false) // 프로젝트 정보 표시 상태
  const [selectedFeedback, setSelectedFeedback] = useState(null) // 선택된 피드백

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
      } else {
        return false
      }
    } else {
      return false
    }
  }, [current_project, user])

  const refetch = () => {
    setTrigger(Date.now())
  }

  // 인코딩 상태 체크 시작
  const startEncodingStatusCheck = () => {
    // GetEncodingStatus가 없으면 실행하지 않음
    if (typeof GetEncodingStatus !== 'function') {
      console.log('Encoding status check not available');
      return;
    }
    
    const interval = setInterval(() => {
      GetEncodingStatus(project_id)
        .then((res) => {
          setEncodingStatus(res.data.encoding_status)
          
          // 인코딩이 완료되면 체크 중지
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
          // 404 에러인 경우 인터벌 중지
          if (err.response?.status === 404) {
            clearInterval(interval)
            setEncodingCheckInterval(null)
          }
        })
    }, 5000) // 5초마다 체크
    
    setEncodingCheckInterval(interval)
  }

  // 컴포넌트 언마운트 시 인터벌 정리
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
      navigate('/Login', { replace: true })
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    
    GetFeedBack(project_id, { signal: abortController.signal })
      .then((res) => {
        console.log('Feedback data:', res.data.result)
        console.log('Files URL:', res.data.result?.files)
        console.log('Full response:', res.data)
        
        // 파일 URL 디버깅
        if (res.data.result?.files) {
          console.log('File URL type:', typeof res.data.result.files);
          console.log('File URL value:', res.data.result.files);
          
          // 파일 존재 여부 테스트
          const testUrl = res.data.result.files.startsWith('http') 
            ? res.data.result.files 
            : `https://videoplanet.up.railway.app${res.data.result.files.startsWith('/') ? '' : '/'}${res.data.result.files}`;
          
          console.log('Testing URL:', testUrl);
          
          // HEAD 요청으로 파일 존재 확인
          fetch(testUrl, { method: 'HEAD' })
            .then(response => {
              console.log('File check response:', response.status, response.statusText);
              console.log('Response headers:', response.headers);
            })
            .catch(error => {
              console.error('File check error:', error);
            });
        }
        
        set_current_project(res.data.result)
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
        }
      })
    
    // Cleanup function
    return () => {
      abortController.abort()
    }
  }, [project_id, trigger])

  function Rating(rating) {
    if (rating === 'manager') {
      return '관리자'
    } else {
      return '일반'
    }
  }

  const [socketConnected, setSocketConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connecting', 'connected', 'disconnected', 'reconnecting'
  const [me, set_me] = useState({
    email: '',
    nickname: '',
    rating: '',
  })
  // WebSocket URL 환경변수 사용
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_API_URL?.replace(/^https?:/, '').replace(/^\/\//, '') || window.location.host
  const webSocketUrl = project_id ? `${wsProtocol}//${wsHost}/ws/chat/${project_id}/` : null
  let ws = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1초

  const [items, setItems] = useState([])

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

  // WebSocket 연결 함수
  const connectWebSocket = React.useCallback(() => {
    if (!webSocketUrl || !project_id) return;
    
    // 이미 연결되어 있거나 연결 중이면 중복 연결 방지
    if (ws.current && 
        (ws.current.readyState === WebSocket.CONNECTING || 
         ws.current.readyState === WebSocket.OPEN)) {
      return;
    }

    console.log(`[WebSocket] 연결 시도... (${connectionAttempts + 1}/${maxReconnectAttempts})`)
    setConnectionStatus('connecting')
    
    try {
      ws.current = new WebSocket(webSocketUrl)

      ws.current.onopen = () => {
        console.log('[WebSocket] 연결 성공')
        setSocketConnected(true)
        setConnectionStatus('connected')
        setConnectionAttempts(0) // 성공 시 재시도 횟수 리셋
        
        // 세션 스토리지에서 저장된 메시지 로드
        const items = JSON.parse(window.sessionStorage.getItem('items'))
        if (items && items.id == project_id) {
          setItems(items.items)
        } else {
          setItems([])
        }
      }

      ws.current.onclose = (event) => {
        console.log('[WebSocket] 연결 끊김:', event.code, event.reason)
        setSocketConnected(false)
        setConnectionStatus('disconnected')
        
        // 정상적인 종료가 아니고 최대 재시도 횟수를 초과하지 않았다면 재연결 시도
        if (event.code !== 1000 && connectionAttempts < maxReconnectAttempts) {
          setConnectionStatus('reconnecting')
          const delay = Math.min(baseReconnectDelay * Math.pow(2, connectionAttempts), 30000) // 최대 30초
          console.log(`[WebSocket] ${delay}ms 후 재연결 시도...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1)
            connectWebSocket()
          }, delay)
        } else if (connectionAttempts >= maxReconnectAttempts) {
          console.log('[WebSocket] 최대 재연결 시도 횟수 초과')
          setConnectionStatus('disconnected')
        }
      }

      ws.current.onerror = (error) => {
        console.error('[WebSocket] 연결 오류:', error)
        setConnectionStatus('disconnected')
      }

      ws.current.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          setItems((prevItems) => [...prevItems, data.result])
        } catch (err) {
          console.error('[WebSocket] 메시지 파싱 오류:', err)
        }
      }
    } catch (error) {
      console.error('[WebSocket] 연결 생성 오류:', error)
      setConnectionStatus('disconnected')
    }
  }, [webSocketUrl, project_id, connectionAttempts, maxReconnectAttempts, baseReconnectDelay])

  // 수동 재연결 함수
  const manualReconnect = React.useCallback(() => {
    console.log('[WebSocket] 수동 재연결 시도')
    setConnectionAttempts(0)
    
    // 기존 연결 정리
    if (ws.current) {
      ws.current.close(1000, 'Manual reconnect')
      ws.current = null
    }
    
    // 기존 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    connectWebSocket()
  }, [connectWebSocket])

  useEffect(() => {
    connectWebSocket()

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('[WebSocket] 컴포넌트 언마운트 - 연결 정리')
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      if (ws.current) {
        ws.current.close(1000, 'Component unmount')
        ws.current = null
      }
      
      setSocketConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [project_id, webSocketUrl])
  useEffect(() => {
    if (items.length > 0) {
      const storage = { id: project_id, items: items }
      window.sessionStorage.setItem('items', JSON.stringify(storage))
    }
  }, [items])
  const content = [
    {
      tab: '코멘트',
      content: current_project && (
        <OpinionInput
          project_id={project_id}
          refetch={refetch}
        />
      ),
    },
    {
      tab: '피드백 등록',
      content: <FeedbackInput 
        project_id={project_id} 
        refetch={refetch} 
        initialTime={feedbackTime}
        onTimeChange={setFeedbackTime}
      />,
    },
    {
      tab: '피드백 관리',
      content: current_project && (
        <FeedbackManage
          refetch={refetch}
          current_project={current_project}
          user={user}
          onTimeClick={(timeStr) => {
            // Parse time string (MM:SS) to seconds
            const parts = timeStr.split(':')
            const minutes = parseInt(parts[0]) || 0
            const seconds = parseInt(parts[1]) || 0
            const totalSeconds = minutes * 60 + seconds
            
            // Seek video to this time
            if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
              videoPlayerRef.current.seekTo(totalSeconds)
            }
          }}
        />
      ),
    },
    {
      tab: '멤버',
      content: current_project && (
        <div className="member">
          <ul>
            <li className="admin">
              <div className="img"></div>
              <div className="txt">
                {current_project.owner_nickname}(관리자)
                <span>{current_project.owner_email}</span>
              </div>
            </li>
            {current_project.member_list.map((member, index) => (
              <li
                key={index}
                className={member.rating === 'manager' ? 'admin' : 'basic'}
              >
                <div className="img"></div>
                <div className="txt">
                  {member.nickname}({Rating(member.rating)})
                  <span>{member.email}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )
    }
  ]
  const { currentItem, changeItem } = useTab(0, content)

  function IsAdmin(project) {
    if (
      user === project.owner_email ||
      project.member_list.filter(
        (member, index) => member.email === user && member.rating === 'manager',
      ).length > 0
    ) {
      return true
    } else {
      return false
    }
  }

  function FileChange(e) {
    const files = e.target.files[0]
    if (!files) {
      console.error('No file selected')
      return
    }
    
    // 파일 크기 검사 (600MB)
    const maxSize = 600 * 1024 * 1024; // 600MB
    if (files.size > maxSize) {
      window.alert('파일 크기가 너무 큽니다. 600MB 이하의 파일만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    
    // 파일 형식 검사
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const fileExtension = files.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    
    if (!allowedTypes.includes(files.type) && !allowedExtensions.includes(fileExtension)) {
      window.alert('지원하지 않는 파일 형식입니다. MP4, WebM, OGG, MOV, AVI, MKV 형식만 가능합니다.');
      e.target.value = '';
      return;
    }
    
    console.log('Selected file:', files.name, 'Size:', files.size, 'Type:', files.type)
    
    const formData = new FormData()
    formData.append('files', files)
    formData.append('filename', files.name) // 파일명 추가
    
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ', ' + pair[1]);
    }
    
    if (window.confirm('파일을 업로드 하시겠습니까?')) {
      SetVideoLoad(true)
      setUploadProgress(0)
      console.log('Uploading file to project:', project_id)
      console.log('Backend URL:', process.env.REACT_APP_BACKEND_API_URL)
      
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percentCompleted)
        console.log('Upload progress:', percentCompleted + '%')
        console.log('Loaded:', progressEvent.loaded, 'Total:', progressEvent.total)
        console.log('Time:', new Date().toISOString())
        
        // 진행률이 멈춘 경우 감지
        if (percentCompleted > 0 && percentCompleted < 100) {
          // 마지막 진행 시간 저장
          window.lastProgressTime = new Date().getTime()
          
          // 10초 후에도 진행이 없으면 경고
          const timeoutId = setTimeout(() => {
            const timeSinceLastProgress = new Date().getTime() - window.lastProgressTime
            if (timeSinceLastProgress > 9000 && percentCompleted < 100) {
              console.error('Upload appears to be stalled. Last progress:', timeSinceLastProgress / 1000, 'seconds ago')
            }
          }, 10000)
          
          // 타임아웃 ID를 저장하여 나중에 정리할 수 있도록 함
          if (!window.uploadTimeouts) window.uploadTimeouts = []
          window.uploadTimeouts.push(timeoutId)
        }
      }
      
      FeedbackFile(formData, project_id, onUploadProgress)
        .then((res) => {
          console.log('Upload success:', res)
          console.log('Response data:', res.data)
          console.log('Uploaded file URL:', res.data?.file_url || res.data?.files || 'No URL returned')
          SetVideoLoad(false)
          setUploadProgress(100)
          
          // 비디오 인코딩 상태 확인 (백엔드 준비되면 활성화)
          const ENABLE_ENCODING = false; // 인코딩 기능 토글
          
          if (ENABLE_ENCODING && res.data?.encoding_status) {
            setEncodingStatus(res.data.encoding_status)
            
            // 인코딩이 pending 또는 processing인 경우 주기적으로 상태 확인
            if (res.data.encoding_status === 'pending' || res.data.encoding_status === 'processing') {
              window.alert('파일이 업로드되었습니다. 영상 인코딩이 진행 중입니다.')
              startEncodingStatusCheck()
            } else {
              window.alert('파일이 성공적으로 업로드되었습니다.')
            }
          } else {
            window.alert('파일이 성공적으로 업로드되었습니다.')
          }
          
          refetch()
          e.target.value = '' // Reset file input
          const resetProgressTimeout = setTimeout(() => setUploadProgress(0), 1000)
          
          // Store timeout for cleanup
          if (!window.uploadTimeouts) window.uploadTimeouts = []
          window.uploadTimeouts.push(resetProgressTimeout)
        })
        .catch((err) => {
          console.error('Upload error:', err)
          console.error('Error response:', err.response)
          console.error('Error status:', err.response?.status)
          console.error('Error data:', err.response?.data)
          e.target.value = ''
          SetVideoLoad(false)
          setUploadProgress(0)
          
          if (err.response && err.response.data && err.response.data.message) {
            window.alert(err.response.data.message)
          } else if (err.response && err.response.status === 401) {
            window.alert('인증이 필요합니다. 다시 로그인해주세요.')
          } else if (err.response && err.response.status === 413) {
            window.alert('파일 크기가 너무 큽니다.')
          } else {
            window.alert('파일 업로드 중 오류가 발생했습니다.')
          }
        })
    } else {
      e.target.value = ''
    }
  }

  function DeleteFile() {
    if (window.confirm('파일을 삭제 하시겠습니까?')) {
      DeleteFeedbackFile(project_id)
        .then((res) => {
          refetch()
        })
        .catch((err) => {
          if (err.response && err.response.data) {
            window.alert(err.response.data.message)
          }
        })
    }
  }

  function CopyFileUrl(url) {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.value = url
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    window.alert('링크가 복사되었습니다.')
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab="feedback" />
        <main>
          {/* WebSocket 연결 상태 표시기 */}
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            ...(connectionStatus === 'connected' ? {
              backgroundColor: 'rgba(34, 197, 94, 0.9)',
              color: 'white'
            } : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? {
              backgroundColor: 'rgba(251, 191, 36, 0.9)',
              color: 'white'
            } : {
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white'
            })
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              ...(connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? {
                animation: 'pulse 1s infinite'
              } : {})
            }} />
            {connectionStatus === 'connected' && '실시간 연결됨'}
            {connectionStatus === 'connecting' && '연결 중...'}
            {connectionStatus === 'reconnecting' && `재연결 중... (${connectionAttempts}/${maxReconnectAttempts})`}
            {connectionStatus === 'disconnected' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                연결 끊김
                <button
                  onClick={manualReconnect}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  재연결
                </button>
              </span>
            )}
          </div>
          
          {current_project && (
            <div className="content feedback feedback_page flex space_between">
              <div className="videobox video_section">
                <div
                  className={
                    current_project.files ? 'video_inner active' : 'video_inner'
                  }
                >
                  {current_project.files && (
                    <VideoPlayer
                      ref={videoPlayerRef}
                      videoUrl={(() => {
                        const fileUrl = current_project.files;
                        console.log('Original file URL:', fileUrl);
                        console.log('Backend URL from env:', process.env.REACT_APP_BACKEND_API_URL);
                        console.log('Backend URI from env:', process.env.REACT_APP_BACKEND_URI);
                        
                        // 테스트용: 404 에러가 계속 발생하면 샘플 비디오 사용
                        const USE_TEST_VIDEO = false; // true로 변경하면 테스트 비디오 사용
                        if (USE_TEST_VIDEO) {
                          return 'https://www.w3schools.com/html/mov_bbb.mp4';
                        }
                        
                        // 이미 전체 URL인 경우
                        if (fileUrl && fileUrl.startsWith('http')) {
                          console.log('Using full URL:', fileUrl);
                          return fileUrl;
                        }
                        
                        // 백엔드 URL 가져오기 - /api 제거
                        const backendUrl = process.env.REACT_APP_BACKEND_URI || 'https://videoplanet.up.railway.app';
                        
                        // 상대 경로인 경우
                        if (fileUrl && fileUrl.startsWith('/')) {
                          // /media/로 시작하면 그대로 사용
                          const fullUrl = `${backendUrl}${fileUrl}`;
                          console.log('Constructed URL:', fullUrl);
                          return fullUrl;
                        } else if (fileUrl) {
                          // 그 외의 경우 경로 그대로 사용 (백엔드에서 media/ 경로가 이미 포함되어 있을 수 있음)
                          const fullUrl = `${backendUrl}/${fileUrl}`;
                          console.log('Constructed URL with slash:', fullUrl);
                          return fullUrl;
                        } else {
                          console.error('File URL is null or undefined');
                          return '';
                        }
                      })()}
                      initialTime={currentVideoTime}
                      onFeedbackClick={(time) => {
                        // 피드백 버튼 클릭 시 피드백 등록 탭으로 이동
                        const minutes = Math.floor(time / 60)
                        const seconds = Math.floor(time % 60)
                        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                        
                        // 시간을 상태로 설정
                        setFeedbackTime(timeStr)
                        
                        // 피드백 등록 탭으로 전환
                        changeItem(1)
                      }}
                      onTimeClick={(time) => {
                        // 시간 클릭 시 해당 시간으로 코멘트 추가
                        const minutes = Math.floor(time / 60)
                        const seconds = Math.floor(time % 60)
                        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                        // 코멘트 입력 폼에 시간 추가
                        const sectionInput = document.querySelector('input[name="section"]')
                        if (sectionInput) {
                          sectionInput.value = timeStr
                        }
                      }}
                    />
                  )}
                  {IsAdmin(current_project) && !current_project.files && (
                    // <button className="submit">영상 추가</button>
                    <div className="upload_area">
                      <div className="upload_btn_wrap">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={FileChange}
                          className="video_upload"
                          id="files"
                          name="files"
                        />
                        <label htmlFor="files" className="video_upload_label">
                          <div>영상 추가</div>
                        </label>
                      </div>
                      <button 
                        className="guide_btn"
                        onClick={() => setShowUploadGuide(true)}
                      >
                        업로드 가이드
                      </button>
                    </div>
                  )}
                  {VideoLoad && (
                    <div className="loading">
                      <div className="loading-content">
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <div className="progress-text">{uploadProgress}%</div>
                        </div>
                        <div className="loading-message">영상 업로드 중...</div>
                      </div>
                    </div>
                  )}
                  {false && encodingStatus && encodingStatus !== 'completed' && encodingStatus !== 'none' && (
                    <div className="encoding-status">
                      <div className="encoding-content">
                        {encodingStatus === 'pending' && (
                          <>
                            <div className="spinner"></div>
                            <div className="encoding-message">영상 인코딩 대기 중...</div>
                          </>
                        )}
                        {encodingStatus === 'processing' && (
                          <>
                            <div className="spinner"></div>
                            <div className="encoding-message">영상 인코딩 중...</div>
                            <div className="encoding-info">최적화된 버전을 생성하고 있습니다</div>
                          </>
                        )}
                        {encodingStatus === 'failed' && (
                          <>
                            <div className="error-icon">⚠️</div>
                            <div className="encoding-message">인코딩 실패</div>
                            <div className="encoding-info">원본 파일은 사용 가능합니다</div>
                          </>
                        )}
                        {encodingStatus === 'partial' && (
                          <>
                            <div className="warning-icon">⚠️</div>
                            <div className="encoding-message">부분 인코딩 완료</div>
                            <div className="encoding-info">일부 버전만 사용 가능합니다</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="etc_box">
                  <div className="flex space_between align_center">
                    <button
                      onClick={() =>
                        navigate('/FeedbackAll', {
                          state: { ...current_project, user: user },
                        })
                      }
                      className="all"
                    >
                      피드백 전체 보기
                    </button>
                    {IsAdmin(current_project) && current_project.files && (
                      // <button className="change">
                      //   <img src={change} />
                      // </button>
                      <div className="good">
                        <div className="change_btn_wrap">
                          <input
                            type="file"
                            // accept=".avi,.mov,.mp4,.mxf"
                            accept="video/*"
                            onChange={FileChange}
                            name="files"
                            className="video_upload"
                            id="files"
                          />
                          <label htmlFor="files" className="video_upload_label">
                            <div>교체</div>
                          </label>
                        </div>
                        <div className="change_btn_wrap">
                          <div className="video_upload_label">
                            <div onClick={DeleteFile} className="delete">
                              삭제
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => CopyFileUrl(current_project.files)}
                      className="share"
                    >
                      공유
                    </div>
                  </div>
                  {/* 선택된 피드백 내용 표시 - 피드백 전체 보기 버튼 바로 아래 */}
                  {selectedFeedback && (
                    <div 
                      className="feedback-detail-display"
                      style={{
                        marginTop: '20px',
                        marginBottom: '20px',
                        padding: '24px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '16px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                        animation: 'fadeIn 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* 상단 액센트 바 */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #1631F8 0%, #0F23C9 100%)'
                      }} />
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '20px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {/* 프로필 아이콘 */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: '600'
                          }}>
                            {selectedFeedback.security ? '?' : (selectedFeedback.nickname || '').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '17px',
                              fontWeight: '600',
                              color: '#212529',
                              marginBottom: '4px'
                            }}>
                              {selectedFeedback.security ? '익명' : selectedFeedback.nickname}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{moment(selectedFeedback.created).format('YYYY.MM.DD')}</span>
                              <span style={{ fontSize: '10px' }}>•</span>
                              <span>{moment(selectedFeedback.created).format('HH:mm')}</span>
                              {selectedFeedback.section && (
                                <>
                                  <span style={{ fontSize: '10px' }}>•</span>
                                  <span style={{
                                    background: '#e3f2fd',
                                    color: '#1976d2',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>
                                    {selectedFeedback.section}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFeedback(null)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '1px solid #e9ecef',
                            fontSize: '20px',
                            color: '#999',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa'
                            e.currentTarget.style.borderColor = '#dee2e6'
                            e.currentTarget.style.color = '#495057'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.borderColor = '#e9ecef'
                            e.currentTarget.style.color = '#999'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{
                        fontSize: '15px',
                        color: '#495057',
                        lineHeight: '1.8',
                        wordBreak: 'break-word',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        {selectedFeedback.text}
                      </div>
                    </div>
                  )}
                  
                  <div className="list">
                    <FeedbackMore 
                      current_project={current_project} 
                      onTimeClick={(timeStr) => {
                        // Parse time string (MM:SS) to seconds
                        const parts = timeStr.split(':')
                        const minutes = parseInt(parts[0]) || 0
                        const seconds = parseInt(parts[1]) || 0
                        const totalSeconds = minutes * 60 + seconds
                        
                        // Seek video to this time
                        if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
                          videoPlayerRef.current.seekTo(totalSeconds)
                        }
                      }}
                      onFeedbackSelect={setSelectedFeedback}
                    />
                  </div>
                </div>
              </div>
              <div className="sidebox">
                <div className="b_title">
                  <div className="s_title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>피드백</span>
                    <button 
                      onClick={() => setShowProjectInfo(!showProjectInfo)}
                      style={{
                        background: '#0058da',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                        transform: showProjectInfo ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                  </div>
                  {showProjectInfo && current_project && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: '#f8f8f8',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>프로젝트:</strong> {current_project.name}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>담당자:</strong> {current_project.manager}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>고객사:</strong> {current_project.consumer}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>생성일:</strong> {moment(current_project.created).format('YYYY.MM.DD')}
                      </div>
                      {current_project.description && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>설명:</strong> {current_project.description}
                        </div>
                      )}
                      {is_admin && (
                        <button
                          style={{
                            width: '100%',
                            marginTop: '10px',
                            padding: '8px',
                            background: '#0058da',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#0047b8'}
                          onMouseOut={(e) => e.target.style.background = '#0058da'}
                          onClick={() => navigate(`/ProjectEdit/${project_id}`)}
                        >
                          프로젝트 관리
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="tab_container">
                  <div className="top_box tab_menu">
                    <ul className="tab_list">
                      {content.map((section, index) => (
                        <li
                          className={
                            currentItem.tab == section.tab ? 'active' : ''
                          }
                          key={index}
                          onClick={() => changeItem(index)}
                        >
                          <button>{section.tab}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="tab_content">{currentItem.content}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {showUploadGuide && (
        <VideoUploadGuide onClose={() => setShowUploadGuide(false)} />
      )}
    </PageTemplate>
  )
}

const Clip = React.memo(function ({ url, SetVideoLoad }) {
  const videoRef = useRef()
  useEffect(() => {
    videoRef.current?.load()
  }, [url])
  return (
    <video
      controls
      width={'100%'}
      height={'100%'}
      ref={videoRef}
      controlsList="nodownload"
      src={url}
      onLoadedData={() => {
        SetVideoLoad(false)
      }}
    >
      <source src={url} type="video/mp4" />
      <source src={url} type="video/webm" />
      <source
        src={url}
        // type="video/mov"
        type="video/quicktime"
      />
      <source src={url} type="video/ogg" />
      <source
        src={url}
        // type="video/mfx"
        type="video/x-mplayer2"
      />
      <source
        src={url}
        // type="video/avi"
        type="video/x-msvideo"
      />
      <source src={url} />
    </video>
  )
})
