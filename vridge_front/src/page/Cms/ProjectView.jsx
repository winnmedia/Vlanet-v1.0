


/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'
import CalendarHeader from '../../tasks/Calendar/CalendarHeader'
import CalendarBody from '../../tasks/Calendar/CalendarBody'
import ProjectList from '../../tasks/Calendar/ProjectList'
import CalendarEnhanced from '../../components/CalendarEnhanced'
import ProjectPhaseBoard from '../../components/ProjectPhaseBoard'
import ToggleButton from '../../components/ToggleButton'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { checkSession } from '../../util/util'
import { useNavigationFlow } from '../../hooks/useNavigationFlow'
import { SafeRoute } from '../../components/SafeRoute'

import { Select, Space } from 'antd'
import moment from 'moment'
import 'moment/locale/ko'

import down from '../../images/Cms/down_icon.svg'

import { GetProject, UpdateDate } from '../../api/project'
import InviteInput from '../../tasks/Project/InviteInput'
import { useProjectData } from '../../hooks/useProjectData'

// 로딩 애니메이션 스타일
const loadingAnimationStyle = `
  @keyframes progressAnimation {
    0% {
      width: 0%;
      transform: translateX(0);
    }
    50% {
      width: 70%;
    }
    100% {
      width: 100%;
      transform: translateX(100%);
    }
  }
`

export default function ProjectView() {
  const router = useRouter()
  const navigate = router.push
  const { handleNotFound } = useNavigationFlow()
  const { project_list, user, profileImage } = useSelector((s) => s.ProjectStore)
  const [current_project, set_current_project] = useState(null)
  const project_id = router.query.id
  const [hasLoadedProject, setHasLoadedProject] = useState(false)

  const DateList = ['월', '주', '일']
  const [DateType, SetDateType] = useState('월')
  const [viewMode, setViewMode] = useState('month') // month, timeline, gantt
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showEnhancedView, setShowEnhancedView] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const CityChange = (val) => {
    const index = DateList.indexOf(val)
    changeDate(DateList[index])
    SetDateType(DateList[index])
  }

  const refetch = React.useCallback(() => {
    if (!project_id) {
      console.error('Project ID is missing')
      return
    }
    
    setIsLoading(true)
    GetProject(project_id)
      .then((res) => {
        if (res.data && res.data.result) {
          set_current_project(res.data.result)
          console.log('Project refetched:', res.data.result)
        }
      })
      .catch((err) => {
        console.error('Error fetching project:', err)
        if (err.response && err.response.status === 404) {
          console.error('Project not found')
          window.alert('프로젝트를 찾을 수 없습니다.')
          navigate('/cmshome')
        } else if (err.response && err.response.data) {
          window.alert(err.response.data.message)
          navigate('/cmshome')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [project_id])
  
  // 프로젝트 단계 업데이트 핸들러
  const handlePhaseUpdate = (projectId, phase, startDate, endDate, completed = null) => {
    const data = {
      type: phase,
      start_date: startDate,
      end_date: endDate
    }
    
    // 완료 상태가 전달된 경우 추가
    if (completed !== null) {
      data.completed = completed
    }
    
    UpdateDate(data, projectId)
      .then(() => {
        refetch()
      })
      .catch(err => {
        console.error('Failed to update phase:', err)
        window.alert('프로젝트 단계 업데이트에 실패했습니다.')
      })
  }

  const [day, setDay] = useState(new Date().getDate() - 1)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [week_index, set_week_index] = useState(0)
  const [totalDate, setTotalDate] = useState([])

  // 인증 체크 및 프로젝트 로드 (통합)
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    
    // project_id가 없으면 즉시 홈으로 리다이렉트
    if (!project_id) {
      console.error('Project ID is missing - redirecting to home')
      navigate('/CmsHome', { replace: true })
      return
    }
    
    // 이미 로드한 프로젝트면 스킵
    if (hasLoadedProject && current_project && current_project.id === project_id) {
      console.log('Project already loaded, skipping')
      return
    }
    
    // 프로젝트 로드
    console.log('Fetching project with ID:', project_id)
    setIsLoading(true)
    GetProject(project_id)
      .then((res) => {
        if (res.data && res.data.result) {
          set_current_project(res.data.result)
          setHasLoadedProject(true)
          console.log('Project loaded:', res.data.result)
        }
      })
      .catch((err) => {
        console.error('Error fetching project:', err)
        if (err.response && err.response.status === 404) {
          console.error('Project not found')
          window.alert('프로젝트를 찾을 수 없습니다.')
          // 404 에러 처리
          handleNotFound(err)
        } else if (err.response && err.response.data) {
          window.alert(err.response.data.message)
          navigate('/cmshome')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [project_id, navigate, handleNotFound])

  const changeDate = (type) => {
    //이전 날짜
    let PVLastDate = new Date(year, month, 0).getDate()
    let PVLastDay = new Date(year, month, 0).getDay()
    console.log('이전날짜', PVLastDate, PVLastDay)
    //다음 날짜
    const ThisLasyDay = new Date(year, month + 1, 0).getDay()
    const ThisLasyDate = new Date(year, month + 1, 0).getDate()
    console.log('다음날짜', ThisLasyDate, ThisLasyDay)

    //이전 날짜 만들기
    let PVLD = []
    if (PVLastDay !== 6) {
      let pre_month = month - 1
      let pre_year = year
      if (pre_month < 0) {
        --pre_year
        pre_month = 11
      }
      for (let i = 0; i < PVLastDay + 1; i++) {
        PVLD.unshift(new Date(pre_year, pre_month, PVLastDate - i))
      }
    }

    //다음 날짜 만들기
    let TLD = []
    let next_month = month + 1
    let next_year = year
    if (next_month > 11) {
      ++next_year
      next_month = 0
    }
    for (let i = 1; i < 7 - ThisLasyDay; i++) {
      if (i === 0) {
        return TLD
      }
      TLD.push(new Date(next_year, next_month, i))
    }

    //현재날짜
    let TD = []

    for (let i = 1; i < ThisLasyDate + 1; i++) {
      TD.push(new Date(year, month, i))
    }
    let result

    if (type === '일') {
      result = TD
      setTotalDate(result)
      return result
    } else {
      result = PVLD.concat(TD, TLD)
      const dividedList = []

      for (let i = 0; i < result.length; i += 7) {
        const sublist = result.slice(i, i + 7)
        dividedList.push(sublist)
      }

      setTotalDate(dividedList)
      return dividedList
    }
  }

  useEffect(() => {
    changeDate(DateType)
  }, [])
  

  // project_id가 없거나 로딩 중일 때
  if (!project_id || isLoading) {
    return (
      <PageTemplate>
        <style>{loadingAnimationStyle}</style>
        <div className="cms_wrap">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="loading-box" style={{ background: 'white', padding: '40px 60px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', textAlign: 'center', minWidth: '300px' }}>
              <div className="loading-progress-bar" style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden', margin: '20px 0' }}>
                <div className="progress-fill" style={{ height: '100%', background: 'linear-gradient(90deg, #1631F8, #0F23C9)', borderRadius: '3px', animation: 'progressAnimation 2s ease-in-out infinite' }}></div>
              </div>
              <div className="loading-text">
                <div className="loading-message" style={{ fontSize: '16px', color: '#333', marginTop: '10px', fontWeight: '500' }}>프로젝트를 불러오는 중...</div>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>
    )
  }

  // SafeRoute 제거하고 직접 렌더링
  return (
    <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main className="project">
            {current_project ? (
            <>
              <Info 
            current_project={current_project} 
            user={user} 
            profileImage={profileImage} 
            is_admin={is_admin}
            refetch={refetch}
            project_id={project_id}
          />
              <div className="content calendar">
                <div style={{ marginBottom: '20px' }}>
                  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    개별 일정표
                    <button 
                      className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
                      onClick={() => setIsCollapsed(!isCollapsed)}
                    />
                    
                    <div style={{ marginLeft: '20px', display: 'flex', gap: '6px' }}>
                      <button 
                        className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                        style={{
                          padding: '8px 20px',
                          border: '1px solid #dee2e6',
                          background: viewMode === 'month' ? 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)' : 'white',
                          color: viewMode === 'month' ? 'white' : '#495057',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: viewMode === 'month' ? '0 2px 4px rgba(22, 49, 248, 0.2)' : 'none'
                        }}
                      >
                        월간보기
                      </button>
                      <button 
                        className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                        onClick={() => setViewMode('timeline')}
                        style={{
                          padding: '8px 20px',
                          border: '1px solid #dee2e6',
                          background: viewMode === 'timeline' ? 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)' : 'white',
                          color: viewMode === 'timeline' ? 'white' : '#495057',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: viewMode === 'timeline' ? '0 2px 4px rgba(22, 49, 248, 0.2)' : 'none'
                        }}
                      >
                        타임라인
                      </button>
                      <button 
                        className={`view-btn ${viewMode === 'gantt' ? 'active' : ''}`}
                        onClick={() => setViewMode('gantt')}
                        style={{
                          padding: '8px 20px',
                          border: '1px solid #dee2e6',
                          background: viewMode === 'gantt' ? 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)' : 'white',
                          color: viewMode === 'gantt' ? 'white' : '#495057',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: viewMode === 'gantt' ? '0 2px 4px rgba(22, 49, 248, 0.2)' : 'none'
                        }}
                      >
                        간트차트
                      </button>
                    </div>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="filter flex space_between align_center">
                      <CalendarHeader
                        totalDate={totalDate}
                        year={year}
                        month={month}
                        setMonth={setMonth}
                        setYear={setYear}
                        week_index={week_index}
                        set_week_index={set_week_index}
                        type={DateType}
                        changeDate={changeDate}
                        day={day}
                        setDay={setDay}
                      />
                      <div className="type flex align_center">
                        <Select
                          defaultValue={DateType}
                          style={{ width: 140 }}
                          value={DateType}
                          onChange={CityChange}
                          options={DateList.map((option) => ({
                            label: option,
                            value: option,
                          }))}
                        />
                        {is_admin && (
                          <button
                            onClick={() =>
                              navigate(`/ProjectEdit/${current_project.id}`)
                            }
                            className="submit"
                          >
                            프로젝트 관리
                          </button>
                        )}
                      </div>
                    </div>
                    {totalDate && viewMode === 'month' && (
                      <CalendarBody
                        totalDate={totalDate}
                        month={month}
                        year={year}
                        week_index={week_index}
                        type={DateType}
                        day={day}
                        current_project={current_project}
                        is_admin={is_admin}
                        refetch={refetch}
                      />
                    )}
                    
                    {viewMode !== 'month' && (
                      <CalendarEnhanced
                        projects={[current_project]}
                        viewMode={viewMode}
                        selectedPhase="all"
                        onPhaseUpdate={handlePhaseUpdate}
                        isAdmin={is_admin}
                      />
                    )}
                    
                    <div className="list_mark">
                      <ul>
                        <li>
                          <span className="first"></span>
                          기초기획안 작성
                        </li>
                        <li>
                          <span className="second"></span>
                          스토리보드 작성
                        </li>
                        <li>
                          <span className="third"></span>
                          촬영 (계획/진행)
                        </li>
                        <li>
                          <span className="fourth"></span>
                          비디오 편집
                        </li>
                        <li>
                          <span className="fifth"></span>
                          후반 작업
                        </li>
                        <li>
                          <span className="sixth"></span>
                          비디오 시사 (피드백)
                        </li>
                        <li>
                          <span className="seven"></span>
                          최종 컨펌
                        </li>
                        <li>
                          <span className="eighth"></span>
                          영상 납품
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              
              {/* 프로젝트 단계 보드 추가 */}
              <div className="content phase-board" style={{ 
                marginTop: '30px',
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e9ecef'
              }}>
                <ProjectPhaseBoard 
                  projects={[current_project]}
                  isAdmin={is_admin}
                  onPhaseUpdate={handlePhaseUpdate}
                  showTitle={true}
                />
              </div>
            </>
          ) : (
            <>
              <style>{loadingAnimationStyle}</style>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="loading-box" style={{ background: 'white', padding: '40px 60px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', textAlign: 'center', minWidth: '300px' }}>
                  <div className="loading-progress-bar" style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden', margin: '20px 0' }}>
                    <div className="progress-fill" style={{ height: '100%', background: 'linear-gradient(90deg, #1631F8, #0F23C9)', borderRadius: '3px', animation: 'progressAnimation 2s ease-in-out infinite' }}></div>
                  </div>
                  <div className="loading-text">
                    <div className="loading-message" style={{ fontSize: '16px', color: '#333', marginTop: '10px', fontWeight: '500' }}>프로젝트를 불러오는 중...</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </PageTemplate>
  )
}

const Info = React.memo(function ({ current_project, user, profileImage, is_admin, refetch, project_id }) {
  const router = useRouter()
  const navigate = router.push
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef()
  const [contentHeight, setContentHeight] = useState(0)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [contentRef.current, isExpanded])

  const toggleBox = () => {
    setIsExpanded(!isExpanded)
  }

  const boxStyle = {
    height: isExpanded ? `${contentHeight}px` : '0',
  }

  function filename(file) {
    return file.split('/').pop().split('\\').pop()
  }
  function download(file) {
    if (file) {
      const link = document.createElement('a')
      link.href = file
      link.download = filename(file)
      link.target = '_blank'
      link.click()
    }
  }

  return (
    <div className="info_wrap">
      <div className="name_box flex align_center space_between">
        <div className="s_title">{current_project.name}</div>
        <div className="flex align_center" style={{ gap: '15px' }}>
          <div>
            최종 업데이트 날짜 |{' '}
            {moment(current_project.updated).format('YYYY.MM.DD')}
          </div>
          {is_admin && (
            <button 
              onClick={() => navigate(`/project/${project_id}/edit`)}
              style={{
                background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(22, 49, 248, 0.2)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 8px rgba(22, 49, 248, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 4px rgba(22, 49, 248, 0.2)'
              }}
            >
              프로젝트 설정
            </button>
          )}
          <button className={`project-info-toggle ${isExpanded ? 'on' : ''}`} onClick={toggleBox}>
            프로젝트 정보
          </button>
        </div>
      </div>
      <div className="box" style={boxStyle}>
        <div ref={contentRef} className="inner">
          <div className="explanation">
            <div className="ss_title">
              <span>프로젝트 설명</span>
            </div>
            <p>{current_project.description}</p>
          </div>
          <div className="member">
            <div className="ss_title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>멤버</span>
              {is_admin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: '70px',
                    width: 'auto',
                    boxShadow: '0 2px 4px rgba(22, 49, 248, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 8px rgba(22, 49, 248, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 4px rgba(22, 49, 248, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: '1' }}>+</span> 초대
                </button>
              )}
            </div>
            <ul>
              <li className="admin">
                <div className="img" style={
                  current_project.owner_email === user && profileImage ? {
                    backgroundImage: `url(${profileImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}
                }></div>
                <div className="txt">
                  {current_project.owner_nickname}(관리자)
                  <span>{current_project.owner_email}</span>
                </div>
              </li>
              {current_project.member_list.map((member, index) => (
                <li
                  className={member.rating === 'manager' ? 'admin' : 'basic'}
                  key={index}
                >
                  <div className="img" style={
                    member.email === user && profileImage ? {
                      backgroundImage: `url(${profileImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}
                  }></div>
                  <div className="txt">
                    {member.nickname}(
                    {member.rating === 'manager' ? '관리자' : '일반'})
                    <span>{member.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="info">
            <div className="ss_title">
              <span>프로젝트 정보</span>
            </div>
            <dl>
              <dt>작업자</dt>
              <dd>{current_project.manager}</dd>
            </dl>
            <dl>
              <dt>고객사</dt>
              <dd>{current_project.consumer}</dd>
            </dl>
            <dl>
              <dt>
                프로젝트
                <br />
                생성일
              </dt>
              <dd>{moment(current_project.created).format('YYYY.MM.DD')}</dd>
            </dl>
            <dl>
              <dt>등록 파일</dt>
              <dd>
                {current_project.files.map((item, index) => (
                  <div key={index} onClick={() => download(item.files)}>
                    {filename(item.file_name)}
                    <i>
                      <img src={down.src || down} />
                    </i>
                  </div>
                ))}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      {/* 멤버 초대 모달 */}
      {showInviteModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e9ecef'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#212529' }}>멤버 초대</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  color: '#495057'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e9ecef'
                  e.target.style.color = '#212529'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8f9fa'
                  e.target.style.color = '#495057'
                }}
              >
                ×
              </button>
            </div>
            
            <InviteInput
              project_id={project_id}
              set_current_project={refetch}
              pending_list={current_project.pending_list || []}
              onInvitationSent={() => {
                // 초대 성공 시 모달 닫고 프로젝트 정보 새로고침
                setShowInviteModal(false)
                setTimeout(() => {
                  refetch()
                }, 500)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
})
