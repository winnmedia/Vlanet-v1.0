import 'css/Cms/Cms.scss'
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import moment from 'moment'
import 'moment/locale/ko'

export default function CmsHome() {
  const navigate = useNavigate()
  const { project_list, this_month_project, next_month_project } = useSelector(
    (s) => s.ProjectStore,
  )
  let intervalId = useRef()
  const date = new Date()
  const [time, setTime] = useState('')
  const initial = { tab: '', on_menu: '' }
  const [side, set_side] = useState(initial)
  const { tab, on_menu } = side

  useEffect(() => {
    setTime(moment(date).format('HH:mm:ss'))
    let current_time
    intervalId = setInterval(() => {
      current_time = moment(new Date()).format('HH:mm:ss')
      if (time != current_time) {
        setTime(current_time)
      }
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar tab={tab} on_menu={on_menu} />

        <main>
          <div className="content home">
            <div className="today">
              <div className="clock">{time}</div>
              <small>{moment(date).format('YYYY.MM.DD.dd')}</small>
            </div>
            <div className="menu_box">
              <ul>
                <li
                  className="menu_calendar"
                  onClick={() => navigate('/Calendar')}
                >
                  <div className="img"></div>
                  <span>전체 일정</span>
                </li>
                <li
                  className="menu_project"
                  onClick={() => {
                    if (tab === 'project') {
                      set_side(initial)
                    } else {
                      set_side({
                        on_menu: true,
                        tab: 'project',
                      })
                    }
                  }}
                >
                  <div className="img"></div>
                  <span>프로젝트 관리</span>
                </li>
                <li
                  className="menu_feedback"
                  onClick={() => {
                    if (tab === 'feedback') {
                      set_side(initial)
                    } else {
                      set_side({
                        on_menu: true,
                        tab: 'feedback',
                      })
                    }
                  }}
                >
                  <div className="img"></div>
                  <span>영상 피드백</span>
                </li>
                <li
                  className="menu_elearning"
                  onClick={() => navigate('/Elearning')}
                >
                  <div className="img"></div>
                  <span>온라인 강의</span>
                </li>
              </ul>
            </div>

            <div className="part">
              <div className="s_title">프로젝트 진행사항</div>
              <ul className="schedule">
                <li>
                  전체 <br />
                  프로젝트 <span>{project_list.length}</span>
                </li>
                <li>
                  이번 달 <br />
                  프로젝트 <span>{this_month_project.length}</span>
                </li>
                <li>
                  다음 달 <br />
                  프로젝트 <span>{next_month_project.length}</span>
                </li>
              </ul>
            </div>

            <div className="part db">
              <div className="s_title">
                Online Class <span></span>
              </div>
              <ul className="oc">
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
                <li>
                  처음부터 배우는 <br />
                  파이널컷 프로
                  <span>영상 디자이너 김영상</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
