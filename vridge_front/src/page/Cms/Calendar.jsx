import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import CalendarBody from 'tasks/Calendar/CalendarBody'
import CalendarHeader from 'tasks/Calendar/CalendarHeader'
import CalendarTotal from 'tasks/Calendar/CalendarTotal'
import ProjectList from 'tasks/Calendar/ProjectList'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { Select, Space } from 'antd'

import moment from 'moment'
import 'moment/locale/ko'
import { refetchProject } from 'util/util'

export default function Calendar() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { project_list, this_month_project, next_month_project, user_memos } =
    useSelector((s) => s.ProjectStore)
  const [project_filter, set_project_filter] = useState(project_list)
  const { Option } = Select

  const DateList = ['월', '주', '일']
  const [DateType, SetDateType] = useState('월')

  const ProjectChange = (e) => {
    if (e === '전체') {
      set_project_filter(current_project_list)
    } else {
      const result = current_project_list.filter((project) => project.name === e)
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

  const current_project_list = useMemo(() => {
    return project_list.filter((i) => {
      return new Date(i.end_date).getMonth() == month || new Date(i.first_date).getMonth() == month
    })
  }, [month, project_list])

  useEffect(() => {
    ProjectChange('전체')
  }, [current_project_list])

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
        <main>
          <div className="title">전체 일정</div>
          <div className="content calendar">
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
                    {project_list.map((i, index) => (
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
            {totalDate && (
              <CalendarBody
                totalDate={totalDate}
                month={month}
                year={year}
                week_index={week_index}
                type={DateType}
                day={day}
                project_list={project_filter}
                user_memos={user_memos}
                refetch={refetch}
              />
            )}
            <div className="list_mark">
              <ul>
                {current_project_list.map((project, index) => (
                  <li key={index}>
                    <span style={{ background: project.color }}></span>
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
            <CalendarTotal
              project_list={project_list}
              this_month_project={this_month_project}
              next_month_project={next_month_project}
            />
            <ProjectList project_list={[...project_list]} />
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
