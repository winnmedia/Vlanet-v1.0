import 'css/Cms/CmsCommon.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import ProjectInput from 'tasks/Project/ProjectInput'
import useInput from 'hooks/UseInput'
import useFile from 'hooks/Usefile'
import ProcessDateEnhanced from 'tasks/Project/ProcessDateEnhanced'

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateProjectAPI } from 'api/project'
import { refetchProject, project_initial, project_dateRange, checkSession } from 'util/util'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { formatProcessDatesForBackend } from 'utils/dateUtils'
import { checkDomain, detectDuplicateTabs } from 'utils/domainCheck'

export default function ProjectCreate() {
  const dispatch = useDispatch()

  const navigate = useNavigate()
  const initial = project_initial()
  const [isCreating, setIsCreating] = useState(false)
  const createRequestRef = useRef(null) // API 요청 추적
  
  // 중복 요청 방지를 위한 ref
  const lastRequestRef = useRef({ name: '', timestamp: 0 })
  const isMountedRef = useRef(true)
  
  // 인증 체크 - 한 번만 실행
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      window.alert('로그인이 필요합니다.')
      navigate('/Login', { replace: true })
    }
    
    // 도메인 체크
    const currentDomain = checkDomain()
    console.log('[ProjectCreate] Mounted on domain:', currentDomain)
    
    // 다른 도메인에 활성 탭이 있는지 확인
    if (detectDuplicateTabs()) {
      console.warn('[ProjectCreate] WARNING: Active tabs on other domains detected!')
    }
    
    // cleanup function
    return () => {
      isMountedRef.current = false
      // 진행 중인 요청이 있으면 취소
      if (createRequestRef.current) {
        console.log('[ProjectCreate] Cancelling pending request on unmount')
        // axios 요청 취소는 별도 처리 필요
      }
    }
  }, [navigate])

  const initialDateRanges = project_dateRange()

  const noAt = (value) => value.length < 50
  const { inputs, onChange } = useInput(initial, noAt)
  const { name, description, manager, consumer } = inputs
  const [process, set_process] = useState(initialDateRanges)
  const null_date = process.filter(
    (i, index) => i.startDate == null || i.endDate == null,
  )
  const { files, FileChange, FileDelete } = useFile([])

  // const ValidForm =
  //   name && description && manager && consumer && null_date.length === 0
  //     ? true
  //     : false
  const ValidForm = name && description && manager && consumer ? true : false

  function CreateBtn(e) {
    // 이벤트 전파 방지
    e.preventDefault()
    e.stopPropagation()
    
    // 더블 클릭 방지를 위한 추가 체크
    if (!ValidForm) {
      window.alert('입력란을 채워주세요.')
      return
    }
    
    if (isCreating) {
      console.log('[ProjectCreate] Already creating project, ignoring duplicate request')
      return
    }
    
    // 컴포넌트가 언마운트되었는지 확인
    if (!isMountedRef.current) {
      console.log('[ProjectCreate] Component unmounted, ignoring request')
      return
    }
    
    // 5초 이내에 같은 프로젝트명으로 요청이 있었는지 확인
    const now = Date.now()
    if (lastRequestRef.current.name === inputs.name && 
        now - lastRequestRef.current.timestamp < 5000) {
      console.log('[ProjectCreate] Duplicate request blocked - same project name within 5 seconds')
      console.log('[ProjectCreate] Last request:', lastRequestRef.current)
      window.alert('동일한 프로젝트를 짧은 시간 내에 중복 생성할 수 없습니다.')
      return
    }
    
    // 다른 도메인에 활성 탭이 있는지 다시 확인
    if (detectDuplicateTabs()) {
      console.warn('[ProjectCreate] Other domain tabs detected during submission!')
      window.alert('다른 브라우저 탭이나 도메인에서 이미 작업 중입니다.\n하나의 탭에서만 작업해주세요.')
      return
    }
    
    // 요청 정보 저장
    lastRequestRef.current = { name: inputs.name, timestamp: now }
    
    setIsCreating(true)
    const formData = new FormData()
    formData.append('inputs', JSON.stringify(inputs))
    
    // process 데이터를 포맷팅하여 전송
    const formattedProcess = formatProcessDatesForBackend(process)
    
    // 디버깅: 전송되는 날짜 형식 확인
    console.log('[ProjectCreate] Process data before format:', process)
    console.log('[ProjectCreate] Process data after format:', formattedProcess)
    
    formData.append('process', JSON.stringify(formattedProcess))
    
    files.forEach((file, index) => {
      formData.append('files', file)
    })

    console.log('[ProjectCreate] === API CALL START ===')
    console.log('[ProjectCreate] isCreating state:', isCreating)
    console.log('[ProjectCreate] Project name:', inputs.name)
    console.log('[ProjectCreate] Current domain:', window.location.hostname)
    console.log('[ProjectCreate] Full URL:', window.location.href)
    console.log('[ProjectCreate] Timestamp:', new Date().toISOString())
    
    // 이미 요청 중이면 무시
    if (createRequestRef.current) {
      console.warn('[ProjectCreate] Request already in progress, ignoring duplicate')
      return
    }
    
    // API 요청 추적
    const request = CreateProjectAPI(formData)
    createRequestRef.current = request
    
    request
        .then((res) => {
          // 컴포넌트가 언마운트되었으면 무시
          if (!isMountedRef.current) {
            console.log('[ProjectCreate] Component unmounted, ignoring response')
            return
          }
          
          console.log('[ProjectCreate] === API RESPONSE SUCCESS ===')
          console.log('[ProjectCreate] Response:', res.data)
          console.log('[ProjectCreate] Project ID:', res.data.project_id)
          console.log('[ProjectCreate] Timestamp:', new Date().toISOString())
          
          // 성공 플래그 설정하여 중복 처리 방지
          lastRequestRef.current.success = true
          
          // 먼저 프로젝트 목록을 갱신
          refetchProject(dispatch, navigate).then(() => {
            console.log('[ProjectCreate] Project list refreshed')
            // 성공 후 페이지 이동
            window.alert('프로젝트 생성 완료')
            navigate('/Calendar', { replace: true })
          }).catch(err => {
            console.error('[ProjectCreate] refetchProject error:', err)
            // 에러가 발생해도 페이지는 이동
            window.alert('프로젝트 생성 완료')
            navigate('/Calendar', { replace: true })
          })
        })
        .catch((err) => {
          console.log('[ProjectCreate] === API ERROR ===')
          console.log('[ProjectCreate] Error:', err)
          console.log('[ProjectCreate] Error response:', err.response)
          console.log('[ProjectCreate] Timestamp:', new Date().toISOString())
          
          // 컴포넌트가 언마운트되었으면 무시
          if (!isMountedRef.current) {
            console.log('[ProjectCreate] Component unmounted, ignoring error')
            return
          }
          
          setIsCreating(false)
          console.log(err)
          if (err.response) {
            if (err.response.status === 401) {
              window.alert('인증이 만료되었습니다. 다시 로그인해주세요.')
              navigate('/Login', { replace: true })
            } else if (err.response.data && err.response.data.message) {
              window.alert(err.response.data.message)
            } else {
              window.alert('프로젝트 생성 중 오류가 발생했습니다.')
            }
          } else if (err.request) {
            window.alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
          } else {
            window.alert('프로젝트 생성 중 오류가 발생했습니다.')
          }
        })
        .finally(() => {
          // 요청 완료 후 ref 초기화
          createRequestRef.current = null
          setIsCreating(false)
        })
  }
  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main className="project edit">
          <div className="title">프로젝트 등록</div>
          <div className="content">
            <div className="group grid">
              <ProjectInput inputs={inputs} onChange={onChange} />
            </div>
            <div className="group mt50">
              <div className="part day">
                <div className="s_title">프로젝트 일정</div>
                <ProcessDateEnhanced process={process} set_process={set_process} />
              </div>
            </div>
            <div className="group mt50">
              <div className="part file">
                <div className="s_title">파일 등록</div>
                <ul className="upload">
                  <li>
                    <label htmlFor="file">
                      <div className="btn-upload">파일 업로드</div>
                    </label>
                    <input
                      type="file"
                      name="file"
                      id="file"
                      onChange={FileChange}
                    ></input>
                  </li>
                </ul>
                <ul className="sample">
                {files.map((file, index) => (
                  <li key={index}>
                    {file.name}
                    <button onClick={() => FileDelete(index)}>삭제</button>
                  </li>
                ))}
              </ul>
              </div>
            </div>

            <div className="btn_wrap">
              <button onClick={CreateBtn} className="submit" disabled={isCreating}>
                {isCreating ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
