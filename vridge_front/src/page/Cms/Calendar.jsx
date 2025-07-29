

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from '../../components/PageTemplate'
import dynamic from 'next/dynamic';
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { UnifiedButton } from '../../components/unified/UnifiedButton';

import SideBar from '../../components/SideBar'
import CalendarBody from '../../tasks/Calendar/CalendarBody'
import CalendarHeader from '../../tasks/Calendar/CalendarHeader'
import CalendarTotal from '../../tasks/Calendar/CalendarTotal'
import ProjectList from '../../tasks/Calendar/ProjectList'

import { Input } from '../../components/unified/Input'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useLocation } from '../../util/nextNavigation'
import { useSelector, useDispatch } from 'react-redux'

import { Select, Space } from 'antd'

import moment from 'moment'
import 'moment/locale/ko'
import { refetchProject, checkSession } from '../../util/util'
import { UpdateDate, WriteMemo } from '../../api/project'
import { Button } from '../../components/unified/Button'

const CalendarEnhanced = dynamic(() => import('../../components/CalendarEnhanced'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default function Calendar() {
  const router = useRouter()
  const { navigate } = router
  const location = useLocation()
  const dispatch = useDispatch()
  const { project_list, this_month_project, next_month_project, user_memos, user } =
    useSelector((s) => s.ProjectStore)
  const [project_filter, set_project_filter] = useState([])
  const { Option } = Select
  const [message, setMessage] = useState(null)
  const [activeControllers, setActiveControllers] = useState([])
  
  // Cleanup effect for any pending API requests
  useEffect(() => {
    return () => {
      activeControllers.forEach(controller => {
        if (controller && controller.abort) {
          controller.abort()
        }
      })
    }
  }, [])

  const DateList = ['월', '주', '일']
  const [DateType, SetDateType] = useState('월')

  const ProjectChange = (e) => {
    if (e === '전체') {
      set_project_filter(current_project_list || [])
    } else {
      const result = (current_project_list || []).filter((project) => project.name === e)
      set_project_filter(result)
    }
  }

  function refetch() {
    refetchProject(dispatch, navigate)
  }

  const DateTypeChange = (val) => {
    const index = DateList.indexOf(val)
    changeDate(DateList[index])
    SetDateType(DateList[index])
  }

  const [day, setDay] = useState(new Date().getDate() - 1)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [week_index, set_week_index] = useState(0)
  const [totalDate, setTotalDate] = useState([])
  const [showEnhancedView, setShowEnhancedView] = useState(false)
  const [viewMode, setViewMode] = useState('month') // month, timeline, gantt
  const [selectedPhase, setSelectedPhase] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Enhanced calendar handlers
  const handlePhaseUpdate = (projectId, phase, startDate, endDate, completed) => {
    const data = {
      type: phase,
      start_date: startDate,
      end_date: endDate,
      completed: completed !== undefined ? completed : false
    }
    const controller = new AbortController()
    
    UpdateDate(data, projectId, { signal: controller.signal })
      .then(() => {
        refetch()
      })
      .catch(err => {})
    
    return controller
  }
  
  const handleMemoAdd = (date, memo) => {
    const controller = new AbortController()
    
    WriteMemo({ date, memo }, 'user', { signal: controller.signal })
      .then(() => {
        refetch()
      })
      .catch(err => {})
    
    return controller
  }

  const current_project_list = useMemo(() => {
    if (!project_list) return []
    return project_list.filter((i) => {
      return new Date(i.end_date).getMonth() == month || new Date(i.first_date).getMonth() == month
    })
  }, [month, project_list])

  // project_list가 변경될 때 project_filter 업데이트
  useEffect(() => {
    if (project_list) {
      set_project_filter(project_list)
    }
  }, [project_list])

  // 인증 체크만 수행 (프로젝트 목록은 App.js에서 이미 로드됨)
  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    
    // 이미 로드 중이거나 로드됨을 추적하는 플래그가 필요
    // 현재는 주석 처리하여 Calendar에서는 프로젝트 목록을 가져오지 않음
    // refetchProject 호출을 완전히 제거
    // App.js에서만 호출하도록 함
  }, []) // 빈 배열로 최초 마운트 시에만 실행

  // navigate state로 전달된 메시지 처리
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
      
      // 새로 생성된 프로젝트 정보가 있으면 로그
      if (location.state.newProjectId) {
        // 프로젝트 목록 강제 새로고침
        refetchProject(dispatch, navigate).then(() => {})
      }
      
      // 메시지를 3초 후에 자동으로 사라지게 함
      const timer = setTimeout(() => {
        setMessage(null)
        // location state 클리어를 위해 navigate
        navigate(location.pathname, { replace: true, state: {} })
      }, 3000)
      
      // cleanup function
      return () => clearTimeout(timer)
    }
  }, [location.state])

  useEffect(() => {
    ProjectChange('전체')
  }, [current_project_list])

  const changeDate = (type) => {
    //이전 날짜
    let PVLastDate = new Date(year, month, 0).getDate()
    let PVLastDay = new Date(year, month, 0).getDay()
    //다음 날짜
    const ThisLasyDay = new Date(year, month + 1, 0).getDay()
    const ThisLasyDate = new Date(year, month + 1, 0).getDate()
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
        <main role="main">
          {/* 메시지 표시 */}
          {message && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease-out'
            }}>
              {message}
            </div>
          )}
          <div className="title" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              캘린더
              <UnifiedButton 
                className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => setIsCollapsed(!isCollapsed)} onKeyDown={(e) => e.key === 'Enter' && setIsCollapsed(!isCollapsed)}
              />
            </div>
            <div className="calendar-toolbar" style={{ 
              display: isCollapsed ? 'none' : 'flex'
            }}>
              <ul className="tab_list" style={{ 
                display: 'flex', 
                gap: '8px',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                alignItems: 'center'
              }}>
                <li className={viewMode === 'month' ? 'active' : ''}>
                  <UnifiedButton 
                    onClick={() => setViewMode('month')} onKeyDown={(e) => e.key === 'Enter' && setViewMode('month')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: viewMode === 'month' ? '#012fff' : 'transparent',
                      color: viewMode === 'month' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: viewMode === 'month' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'month') {
                      e.target.style.background = 'rgba(1, 47, 255, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'month') {
                      e.target.style.background = 'transparent'
                    }
                  }}
                >
                  월간 보기
                </UnifiedButton>
              </li>
              <li className={viewMode === 'timeline' ? 'active' : ''}>
                <Button onClick={() => setViewMode('timeline')} onKeyDown={(e) => e.key === 'Enter' && setViewMode('timeline')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    background: viewMode === 'timeline' ? '#012fff' : 'transparent',
                    color: viewMode === 'timeline' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'timeline' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'timeline') {
                      e.target.style.background = 'rgba(1, 47, 255, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'timeline') {
                      e.target.style.background = 'transparent'
                    }
                  }}
                >
                  타임라인
                </Button>
              </li>
              <li className={viewMode === 'gantt' ? 'active' : ''}>
                <Button onClick={() => setViewMode('gantt')} onKeyDown={(e) => e.key === 'Enter' && setViewMode('gantt')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    background: viewMode === 'gantt' ? '#012fff' : 'transparent',
                    color: viewMode === 'gantt' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'gantt' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'gantt') {
                      e.target.style.background = 'rgba(1, 47, 255, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'gantt') {
                      e.target.style.background = 'transparent'
                    }
                  }}
                >
                  간트 차트
                </Button>
              </li>
              <div style={{ borderLeft: '1px solid #e0e0e0', height: '16px', margin: '0 12px' }}></div>
              <li style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    width: '150px',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0058da'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0'
                  }}
                />
                <UnifiedInput variant="select" className="" value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0058da'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0'
                  }}
                >
                  <option value="all">모든 단계</option>
                  <option value="basic_plan">기초기획안</option>
                  <option value="story_board">스토리보드</option>
                  <option value="filming">촬영</option>
                  <option value="video_edit">편집</option>
                  <option value="post_work">후반작업</option>
                  <option value="video_preview">시사</option>
                  <option value="confirmation">컨펌</option>
                  <option value="video_delivery">납품</option>
                </UnifiedInput>
              </li>
            </ul>
            </div>
          </div>
          <div className={`content calendar ${isCollapsed ? 'collapsed' : ''}`}>
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
              <div className="type">
                <Space wrap>
                  <Select
                    popupClassName="a"
                    className="b"
                    style={{ width: 140 }}
                    defaultValue={'전체'}
                    onChange={ProjectChange}
                  >
                    <Option value="전체">전체</Option>
                    {(project_list || []).map((i, index) => (
                      <Option key={index} value={i.name}>
                        {i.name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    defaultValue={DateList[0]}
                    style={{ width: 140 }}
                    value={DateType}
                    onChange={DateTypeChange}
                    options={DateList.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                  />
                </Space>
              </div>
            </div>
            {!isCollapsed && (
              viewMode === 'month' ? (
                totalDate && (
                  <CalendarBody
                    totalDate={totalDate}
                    month={month}
                    year={year}
                    week_index={week_index}
                    type={DateType}
                    day={day}
                    project_list={(project_filter || []).filter(project => {
                      // Apply search filter
                      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
                      // Apply phase filter
                      const matchesPhase = selectedPhase === 'all' || 
                        (project[selectedPhase] && project[selectedPhase].start_date)
                      return matchesSearch && matchesPhase
                    })}
                    user_memos={user_memos}
                    refetch={refetch}
                  />
                )
              ) : (
                <CalendarEnhanced
                  projects={project_filter}
                  phases={[
                    'basic_plan', 'story_board', 'filming', 'video_edit',
                    'post_work', 'video_preview', 'confirmation', 'video_delivery'
                  ]}
                  onPhaseUpdate={handlePhaseUpdate}
                  onMemoAdd={handleMemoAdd}
                  isAdmin={user === 'admin' || user === 'calendar'}
                  initialViewMode={viewMode}
                  initialSearchTerm={searchTerm}
                  initialSelectedPhase={selectedPhase}
                />
              )
            )}
            <div className="list_mark">
              <ul>
                {(current_project_list || []).map((project, index) => (
                  <li key={index}>
                    <span style={{ background: project.color }}></span>
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
            {viewMode === 'month' ? (
              <ProjectPhaseBoard 
                projects={[...(project_list || [])]} 
                onPhaseUpdate={handlePhaseUpdate}
                projectCounts={{
                  total: (project_list || []).length,
                  thisMonth: (this_month_project || []).length,
                  nextMonth: (next_month_project || []).length
                }}
                showTitle={true}
              />
            ) : (
              <ProjectList project_list={[...(project_list || [])]} />
            )}
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
