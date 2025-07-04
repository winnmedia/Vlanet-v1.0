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

import { Select, Space } from 'antd'
import moment from 'moment'
import 'moment/locale/ko'

import down from 'images/Cms/down_icon.svg'

import { GetProject, UpdateDate } from 'api/project'

export default function ProjectView() {
  const navigate = useNavigate()
  const { project_list, user } = useSelector((s) => s.ProjectStore)
  const [current_project, set_current_project] = useState(null)
  const { project_id } = useParams()

  const DateList = ['월', '주', '일']
  const [DateType, SetDateType] = useState('월')
  const [viewMode, setViewMode] = useState('month') // month, timeline, gantt
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showEnhancedView, setShowEnhancedView] = useState(false)

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

  function refetch() {
    GetProject(project_id)
      .then((res) => {
        set_current_project(res.data.result)
        console.log(res.data.result)
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
          navigate('/CmsHome')
        }
      })
  }
  
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

  useEffect(() => {
    console.log('????')
    refetch()
  }, [project_id])

  const [day, setDay] = useState(new Date().getDate() - 1)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [week_index, set_week_index] = useState(0)
  const [totalDate, setTotalDate] = useState([])

  // 인증 체크
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    }
  }, [])

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

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main className="project">
          {current_project && (
            <>
              <Info current_project={current_project} />
              <div className="content calendar">
                <div style={{ marginBottom: '20px' }}>
                  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    개별 일정표
                    <button 
                      className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#012fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                        <path d={isCollapsed ? "M4 2 L8 6 L4 10" : "M2 4 L6 8 L10 4"} stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    </button>
                    
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
          )}
        </main>
      </div>
    </PageTemplate>
  )
}

const Info = React.memo(function ({ current_project }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef()
  const [contentHeight, setContentHeight] = useState(0)

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
        <div className=" flex align_center start">
          <button className={isExpanded ? 'on' : ''} onClick={toggleBox}>
            버튼
          </button>
          <div className="s_title">{current_project.name}</div>
        </div>
        <div>
          최종 업데이트 날짜 |{' '}
          {moment(current_project.updated).format('YYYY.MM.DD')}
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
            <div className="ss_title">
              <span>멤버</span>
            </div>
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
                  className={member.rating === 'manager' ? 'admin' : 'basic'}
                  key={index}
                >
                  <div className="img"></div>
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
    </div>
  )
})
