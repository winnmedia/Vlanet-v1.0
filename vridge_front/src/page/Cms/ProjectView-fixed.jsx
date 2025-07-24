import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { checkSession } from 'util/util'
import { useProjectDetail } from 'hooks/useProjectDetail'

import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import CalendarHeader from 'tasks/Calendar/CalendarHeader'
import CalendarBody from 'tasks/Calendar/CalendarBody'
import CalendarEnhanced from 'components/CalendarEnhanced'
import ProjectPhaseBoard from 'components/ProjectPhaseBoard'

import { Select } from 'antd'
import moment from 'moment'
import 'moment/locale/ko'

import down from 'images/Cms/down_icon.svg'
import { UpdateDate } from 'api/project'
import InviteInput from 'tasks/Project/InviteInput'

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
  const project_id = router.query.id
  
  // Redux store에서 사용자 정보만 가져옴
  const { user, profileImage } = useSelector((s) => s.ProjectStore)
  
  // 커스텀 훅으로 프로젝트 상세 정보 가져오기 (중복 방지)
  const { project: current_project, isLoading, error, refetch } = useProjectDetail(project_id)
  
  const DateList = ['월', '주', '일']
  const [DateType, SetDateType] = useState('월')
  const [viewMode, setViewMode] = useState('month')
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const is_admin = useMemo(() => {
    if (!current_project || !user) return false
    
    if (user === current_project.owner_email) return true
    
    return current_project.member_list.some(
      member => member.email === user && member.rating === 'manager'
    )
  }, [current_project, user])
  
  const [day, setDay] = useState(new Date().getDate() - 1)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [week_index, set_week_index] = useState(0)
  const [totalDate, setTotalDate] = useState([])
  
  // 세션 체크 및 리다이렉트
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    
    if (!project_id) {
      console.error('Project ID is missing - redirecting to home')
      navigate('/cmshome', { replace: true })
    }
  }, [project_id, navigate])
  
  // 오류 처리
  useEffect(() => {
    if (error) {
      if (error.response?.status === 404) {
        window.alert('프로젝트를 찾을 수 없습니다.')
        navigate('/cmshome')
      } else if (error.response?.data?.message) {
        window.alert(error.response.data.message)
        navigate('/cmshome')
      }
    }
  }, [error, navigate])
  
  const handlePhaseUpdate = (projectId, phase, startDate, endDate) => {
    const data = {
      type: phase,
      start_date: startDate,
      end_date: endDate
    }
    UpdateDate(data, projectId)
      .then(() => refetch())
      .catch(err => {
        console.error('Failed to update phase:', err)
        window.alert('프로젝트 단계 업데이트에 실패했습니다.')
      })
  }
  
  const CityChange = (val) => {
    const index = DateList.indexOf(val)
    changeDate(DateList[index])
    SetDateType(DateList[index])
  }
  
  const changeDate = (type) => {
    // 날짜 계산 로직 (기존 코드와 동일)
    let PVLastDate = new Date(year, month, 0).getDate()
    let PVLastDay = new Date(year, month, 0).getDay()
    
    const ThisLasyDay = new Date(year, month + 1, 0).getDay()
    const ThisLasyDate = new Date(year, month + 1, 0).getDate()
    
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
    
    let TLD = []
    let next_month = month + 1
    let next_year = year
    if (next_month > 11) {
      ++next_year
      next_month = 0
    }
    for (let i = 1; i < 7 - ThisLasyDay; i++) {
      if (i === 0) return TLD
      TLD.push(new Date(next_year, next_month, i))
    }
    
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
  
  // 로딩 중일 때
  if (isLoading || !project_id) {
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
                      {['month', 'timeline', 'gantt'].map(mode => (
                        <button 
                          key={mode}
                          className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                          onClick={() => setViewMode(mode)}
                          style={{
                            padding: '5px 15px',
                            border: '1px solid #012fff',
                            background: viewMode === mode ? '#012fff' : 'white',
                            color: viewMode === mode ? 'white' : '#012fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {mode === 'month' ? '월간보기' : mode === 'timeline' ? '타임라인' : '간트차트'}
                        </button>
                      ))}
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
                            onClick={() => navigate(`/project/${current_project.id}/edit`)}
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
                        <li><span className="first"></span>기초기획안 작성</li>
                        <li><span className="second"></span>스토리보드 작성</li>
                        <li><span className="third"></span>촬영 (계획/진행)</li>
                        <li><span className="fourth"></span>비디오 편집</li>
                        <li><span className="fifth"></span>후반 작업</li>
                        <li><span className="sixth"></span>비디오 시사 (피드백)</li>
                        <li><span className="seven"></span>최종 컨펌</li>
                        <li><span className="eighth"></span>영상 납품</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              
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

// Info 컴포넌트 (기존과 동일)
const Info = React.memo(function ({ current_project, user, profileImage, is_admin, refetch, project_id }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  
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
            최종 업데이트 날짜 | {moment(current_project.updated).format('YYYY.MM.DD')}
          </div>
          <button className={isExpanded ? 'on' : ''} onClick={() => setIsExpanded(!isExpanded)}>
            프로젝트 정보
          </button>
        </div>
      </div>
      
      <div className="box" style={{ height: isExpanded ? 'auto' : '0', overflow: 'hidden', transition: 'height 0.3s ease' }}>
        <div className="inner">
          <div className="explanation">
            <div className="ss_title"><span>프로젝트 설명</span></div>
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
                <li className={member.rating === 'manager' ? 'admin' : 'basic'} key={index}>
                  <div className="img" style={
                    member.email === user && profileImage ? {
                      backgroundImage: `url(${profileImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}
                  }></div>
                  <div className="txt">
                    {member.nickname}({member.rating === 'manager' ? '관리자' : '일반'})
                    <span>{member.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="info">
            <div className="ss_title"><span>프로젝트 정보</span></div>
            <dl>
              <dt>작업자</dt>
              <dd>{current_project.manager}</dd>
            </dl>
            <dl>
              <dt>고객사</dt>
              <dd>{current_project.consumer}</dd>
            </dl>
            <dl>
              <dt>프로젝트<br />생성일</dt>
              <dd>{moment(current_project.created).format('YYYY.MM.DD')}</dd>
            </dl>
            <dl>
              <dt>등록 파일</dt>
              <dd>
                {current_project.files.map((item, index) => (
                  <div key={index} onClick={() => download(item.files)}>
                    {filename(item.file_name)}
                    <i><img src={down.src || down} alt="download" /></i>
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
                  cursor: 'pointer'
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
                setShowInviteModal(false)
                setTimeout(refetch, 500)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
})