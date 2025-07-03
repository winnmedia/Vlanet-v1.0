import 'css/Cms/CmsCommon.scss'
import 'css/Cms/ProjectCreate.scss'
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
  const submitButtonRef = useRef(null) // 제출 버튼 ref
  
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

  // 디바운스된 생성 함수
  const createProjectWithDebounce = React.useCallback(() => {
    // 이미 생성 중이거나 컴포넌트가 언마운트된 경우 중단
    if (isCreating || !isMountedRef.current) {
      return
    }
    
    // 입력값 검증
    if (!ValidForm) {
      alert('입력란을 채워주세요.')
      return
    }
    
    console.log('[ProjectCreate] Starting atomic project creation...')
    setIsCreating(true)
    
    // 버튼 즉시 비활성화
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true
    }
    // 원자적 프로젝트 생성을 위한 JSON 데이터 구성
    const projectData = {
      name: inputs.name,
      manager: inputs.manager,
      consumer: inputs.consumer,
      description: inputs.description,
      color: inputs.color || '#1631F8',
      process: formatProcessDatesForBackend(process)
    }
    
    console.log('[ProjectCreate] Atomic creation data:', projectData)
    
    // 원자적 API 호출 (FormData 대신 JSON)
    const request = CreateProjectAPI(projectData)
    createRequestRef.current = request
    
    request
        .then((res) => {
          if (!isMountedRef.current) {
            console.log('[ProjectCreate] Component unmounted, ignoring response')
            return
          }
          
          console.log('[ProjectCreate] Success:', res.data)
          
          // 즉시 페이지 이동
          navigate('/Calendar', { 
            replace: true,
            state: { message: '프로젝트가 성공적으로 생성되었습니다.' }
          })
          
          // 프로젝트 목록 갱신
          setTimeout(() => {
            refetchProject(dispatch, navigate).catch(err => {
              console.error('[ProjectCreate] refetchProject error:', err)
              // 에러가 발생해도 재시도
              setTimeout(() => {
                refetchProject(dispatch, navigate).then(() => {
                  console.log('[ProjectCreate] Project list refreshed on retry')
                }).catch(retryErr => {
                  console.error('[ProjectCreate] Retry failed:', retryErr)
                })
              }, 1000)
            })
          }, 100)
        })
        .catch((err) => {
          if (!isMountedRef.current) return
          
          console.error('[ProjectCreate] Error:', err)
          setIsCreating(false)
          
          // 버튼 다시 활성화
          if (submitButtonRef.current) {
            submitButtonRef.current.disabled = false
          }
          
          // 에러 타입별 처리
          if (err.response?.status === 409) {
            // 중복 프로젝트 에러
            alert(err.response.data.error || '같은 이름의 프로젝트가 이미 존재합니다.')
          } else if (err.response?.status === 401) {
            alert('인증이 만료되었습니다. 다시 로그인해주세요.')
            navigate('/Login', { replace: true })
          } else if (err.response?.data?.error) {
            alert(err.response.data.error)
          } else {
            alert('프로젝트 생성 중 오류가 발생했습니다.')
          }
        })
        .finally(() => {
          createRequestRef.current = null
        })
  }, [isCreating, ValidForm, inputs, process, files, navigate, dispatch])
  
  // 디바운스된 버튼 클릭 핸들러
  const CreateBtn = React.useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 디바운스 적용 (500ms)
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true
      setTimeout(() => {
        if (submitButtonRef.current && !isCreating) {
          submitButtonRef.current.disabled = false
        }
      }, 500)
    }
    
    createProjectWithDebounce()
  }, [createProjectWithDebounce, isCreating])
  return (
    <PageTemplate>
      <div className="cms_wrap project-create">
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
              <button 
                ref={submitButtonRef}
                onClick={CreateBtn} 
                className="submit" 
                disabled={isCreating || !ValidForm}
                style={{ 
                  opacity: (isCreating || !ValidForm) ? 0.6 : 1,
                  cursor: (isCreating || !ValidForm) ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreating ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
