import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { checkSession } from 'util/util'
import 'css/Cms/Cms.scss'
import 'css/Cms/FeedbackOriginal.scss'
import 'css/Cms/UploadProgress.scss'

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import FeedbackInput from 'tasks/Feedback/FeedbackInput'
import FeedbackManage from 'tasks/Feedback/FeedbackManage'
import FeedbackMore from 'tasks/Feedback/FeedbackMore'
import FeedbackMessage from 'tasks/Feedback/FeedbackMessage'
import FeedbackPlayer from 'components/FeedbackPlayer'

import useTab from 'hooks/UseTab'

import down from 'images/Cms/down_icon.svg'

import { useSelector } from 'react-redux'

import { FeedbackFile, GetFeedBack, DeleteFeedbackFile } from 'api/feedback'

import moment from 'moment'
import 'moment/locale/ko'

export default function Feedback() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.ProjectStore)

  const { project_id } = useParams()

  const [trigger, setTrigger] = useState(0)
  const [current_project, set_current_project] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const videoPlayerRef = useRef(null)

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

  // 인증 체크
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    }
  }, [])

  useEffect(() => {
    GetFeedBack(project_id)
      .then((res) => {
        set_current_project(res.data.result)
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
        }
      })
  }, [project_id, trigger])

  function Rating(rating) {
    if (rating === 'manager') {
      return '관리자'
    } else {
      return '일반'
    }
  }

  const [socketConnected, setSocketConnected] = useState(false)
  const [me, set_me] = useState({
    email: '',
    nickname: '',
    rating: '',
  })
  const webSocketUrl = project_id ? `${process.env.REACT_APP_SOCKET_URI || 'wss://videoplanet.up.railway.app'}/ws/chat/${project_id}/` : null
  let ws = useRef(null)

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

  useEffect(() => {
    if (!webSocketUrl || !project_id) return;
    
    // if (!ws.current) {
    ws.current = new WebSocket(webSocketUrl)

    ws.current.onopen = () => {
      // console.log('connected to ' + webSocketUrl)
      console.log('connected')
      setSocketConnected(true)
      const items = JSON.parse(window.sessionStorage.getItem('items'))
      if (items && items.id == project_id) {
        setItems(items.items)
      } else {
        setItems([])
      }
    }
    ws.current.onclose = (error) => {
      // console.log('disconnect from ' + webSocketUrl)
      console.log('disconnect')
    }
    ws.current.onerror = (error) => {
      console.log('connection error')
      console.log(error)
    }

    ws.current.onmessage = (evt) => {
      const data = JSON.parse(evt.data)
      setItems((prevItems) => [...prevItems, data.result])
    }
    // }

    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [project_id])
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
        <FeedbackMessage
          Rating={Rating}
          socketConnected={socketConnected}
          ws={ws}
          items={items}
          me={me}
        />
      ),
    },
    {
      tab: '피드백 등록',
      content: <FeedbackInput project_id={project_id} refetch={refetch} />,
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
      ),
    },
    {
      tab: '프로젝트 정보',
      content: current_project && (
        <div className="info">
          <dl className="flex align_center">
            <dt>담당자</dt>
            <dd>{current_project.manager}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>고객사</dt>
            <dd>{current_project.consumer}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>프로젝트 생성</dt>
            <dd>{moment(current_project.created).format('YYYY.MM.DD.dd')}</dd>
          </dl>
          <dl className="flex align_center">
            <dt>최종 업데이트</dt>
            <dd>{moment(current_project.updated).format('YYYY.MM.DD.dd')}</dd>
          </dl>
          <dl>
            <dt>프로젝트 세부 설명</dt>
            <dd className="mt10">{current_project.description}</dd>
          </dl>
          {is_admin && (
            <button
              className="project_btn"
              onClick={() => {
                navigate(`/ProjectEdit/${project_id}`)
              }}
            >
              프로젝트 관리
            </button>
          )}
        </div>
      ),
    },
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
    
    if (window.confirm('파일을 업로드 하시겠습니까?')) {
      SetVideoLoad(true)
      setUploadProgress(0)
      console.log('Uploading file to project:', project_id)
      
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percentCompleted)
        console.log('Upload progress:', percentCompleted + '%')
      }
      
      FeedbackFile(formData, project_id, onUploadProgress)
        .then((res) => {
          console.log('Upload success:', res)
          console.log('Uploaded file URL:', res.data?.file_url || 'No URL returned')
          SetVideoLoad(false)
          setUploadProgress(100)
          refetch()
          window.alert('파일이 성공적으로 업로드되었습니다.')
          e.target.value = '' // Reset file input
          setTimeout(() => setUploadProgress(0), 1000)
        })
        .catch((err) => {
          console.error('Upload error:', err)
          console.error('Error response:', err.response)
          e.target.value = ''
          SetVideoLoad(false)
          setUploadProgress(0)
          
          if (err.response && err.response.data && err.response.data.message) {
            window.alert(err.response.data.message)
          } else {
            window.alert('파일 업로드 중 오류가 발생했습니다.')
          }
        })
    } else {
      e.target.value = ''
    }
  }
  const [VideoLoad, SetVideoLoad] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
        <SideBar />
        <main>
          {current_project && (
            <div className="content feedback feedback_page flex space_between">
              <div className="videobox video_section">
                <div
                  className={
                    current_project.files ? 'video_inner active' : 'video_inner'
                  }
                >
                  {current_project.files && (
                    <FeedbackPlayer
                      ref={videoPlayerRef}
                      videoUrl={current_project.files}
                      initialTime={currentVideoTime}
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
                    />
                  </div>
                </div>
              </div>
              <div className="sidebox">
                <div className="b_title">
                  <div className="s_title">{currentItem.tab}</div>
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
