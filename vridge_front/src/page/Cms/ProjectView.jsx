import 'css/Cms/CmsCommon.scss'
import 'css/Cms/CalendarToolbar.scss'
import 'css/Cms/CalendarLayout.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import CalendarHeader from 'tasks/Calendar/CalendarHeader'
import CalendarBody from 'tasks/Calendar/CalendarBody'
import ProjectList from 'tasks/Calendar/ProjectList'
import CalendarEnhanced from 'components/CalendarEnhanced'
import ProjectPhaseBoard from 'components/ProjectPhaseBoard'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { checkSession } from 'util/util'
import { useNavigationFlow } from 'hooks/useNavigationFlow'
import { SafeRoute } from 'components/SafeRoute'

import { Select, Space } from 'antd'
import moment from 'moment'
import 'moment/locale/ko'

import down from 'images/Cms/down_icon.svg'

import { GetProject, UpdateDate } from 'api/project'
import InviteInput from 'tasks/Project/InviteInput'

export default function ProjectView() {
  const navigate = useNavigate()
  const { handleNotFound } = useNavigationFlow()
  const { project_list, user, profileImage } = useSelector((s) => s.ProjectStore)
  const [current_project, set_current_project] = useState(null)
  const { project_id } = useParams()

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
          // 404 에러 처리
          handleNotFound(err)
        } else if (err.response && err.response.data) {
          window.alert(err.response.data.message)
          navigate('/CmsHome')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [project_id, navigate, handleNotFound])
  
  // 프로젝트 단계 업데이트 핸들러
  const handlePhaseUpdate = (projectId, phase, startDate, endDate) => {
    const data = {
      type: phase,
      start_date: startDate,
      end_date: endDate
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
      navigate('/Login', { replace: true })
      return
    }
    
    // project_id가 없으면 즉시 홈으로 리다이렉트
    if (!project_id) {
      console.error('Project ID is missing - redirecting to home')
      navigate('/CmsHome', { replace: true })
      return
    }
    
    // 프로젝트 로드
    console.log('Fetching project with ID:', project_id)
    refetch()
  }, [project_id, navigate, refetch])

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
        <div className="cms_wrap">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p style={{ marginTop: '20px', color: '#666' }}>프로젝트를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </PageTemplate>
    )
  }

  return (
    <SafeRoute
      checkResource={GetProject}
      resourceId={project_id}
      resourceType="project"
    >
      <PageTemplate>
        <div className="cms_wrap">
          <SideBar />
          <main className="project">
            {project_id && current_project ? (
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
                          padding: '5px 15px',
                          border: '1px solid #012fff',
                          background: viewMode === 'month' ? '#012fff' : 'white',
                          color: viewMode === 'month' ? 'white' : '#012fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        월간보기
                      </button>
                      <button 
                        className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                        onClick={() => setViewMode('timeline')}
                        style={{
                          padding: '5px 15px',
                          border: '1px solid #012fff',
                          background: viewMode === 'timeline' ? '#012fff' : 'white',
                          color: viewMode === 'timeline' ? 'white' : '#012fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        타임라인
                      </button>
                      <button 
                        className={`view-btn ${viewMode === 'gantt' ? 'active' : ''}`}
                        onClick={() => setViewMode('gantt')}
                        style={{
                          padding: '5px 15px',
                          border: '1px solid #012fff',
                          background: viewMode === 'gantt' ? '#012fff' : 'white',
                          color: viewMode === 'gantt' ? 'white' : '#012fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
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
              <div className="content" style={{ marginTop: '30px' }}>
                <ProjectPhaseBoard 
                  projects={[current_project]}
                  isAdmin={is_admin}
                  onPhaseUpdate={handlePhaseUpdate}
                  showTitle={true}
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p style={{ marginTop: '20px', color: '#666' }}>프로젝트를 불러오는 중...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </PageTemplate>
    </SafeRoute>
  )
}

const Info = React.memo(function ({ current_project, user, profileImage, is_admin, refetch, project_id }) {
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
          <button className={isExpanded ? 'on' : ''} onClick={toggleBox}>
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
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: '70px',
                    width: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 8px rgba(22, 49, 248, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  + 초대
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
                      <img src={down} />
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>멤버 초대</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
