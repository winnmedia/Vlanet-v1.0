import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import 'css/Cms/Cms.scss'

/* 상단 이미지 - 샘플, 기본 */
/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackAll() {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState([])
  const state = useLocation().state
  const { user } = state

  useEffect(() => {
    let groupedObjects = {}
    const feedback_data = state.feedback
    feedback_data.forEach((obj) => {
      const createdDate = moment(obj.created).format('YYYY.MM.DD.dd')
      if (groupedObjects.hasOwnProperty(createdDate)) {
        groupedObjects[createdDate].push(obj)
      } else {
        groupedObjects[createdDate] = [obj]
      }
    })
    setFeedback(Object.entries(groupedObjects))
  }, [])

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

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main>
          <div className="content feedbackall">
            <div className="title">
              <span onClick={() => navigate(`/Feedback/${state.id}`)}>
                뒤로가기
              </span>
              전체 피드백
            </div>
            <div className="list">
              {feedback.length > 0 ? (
                feedback.map((item, index) => (
                  <div className="part" key={index}>
                    <div className="day">
                      <span>{item[0]}</span>
                    </div>
                    <ul>
                      {item[1].map((data, i) => (
                        <li key={i}>
                          <div className="flex align_center">
                            <div
                              className={
                                IsAdmin(state)
                                  ? 'img_box admin'
                                  : 'img_box basic'
                              }
                            ></div>
                            <div className="txt_box">
                              {!data.security ? (
                                <>
                                  <span className="name">
                                    {data.nickname}
                                    {IsAdmin(state) ? (
                                      <small className="admin">(관리자)</small>
                                    ) : (
                                      <small className="basic">(일반)</small>
                                    )}
                                  </span>
                                  <span className="email">{data.email}</span>
                                </>
                              ) : (
                                <span className="name">익명</span>
                              )}
                            </div>
                          </div>
                          <div className="flex align_center space_between mt20">
                            <div className="subject">{data.title}</div>
                            <span className="time">{data.section}</span>
                          </div>
                          <p>{data.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="flex justify_center mt100">
                  피드백이 없습니다.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
