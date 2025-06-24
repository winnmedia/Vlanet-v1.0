import useInput from 'hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackMore({ current_project }) {
  const [feedback, setFeedback] = useState([])
  const [openPopup, setOpenPopup] = useState(null) // 추가된 부분


  const closeView = (event, date_index, item_index) => {
    event.stopPropagation()
    setOpenPopup(null) // 팝업 닫을 때 현재 열려있는 팝업 인덱스 초기화
  }

  useEffect(() => {
    let groupedObjects = {}
    const feedback_data = current_project.feedback
    feedback_data.forEach((obj) => {
      const createdDate = moment(obj.created).format('YYYY.MM.DD.dd')
      if (groupedObjects.hasOwnProperty(createdDate)) {
        groupedObjects[createdDate].push(obj)
      } else {
        groupedObjects[createdDate] = [obj]
      }
    })
    setFeedback(Object.entries(groupedObjects))
  }, [current_project])

  return (
    <>
      {feedback.map((item, index) => (
        <div key={index} className="box">
          <div className="day">{item[0]}</div>
          <ul>
            {item[1].map((data, i) => (
              <li className={openPopup && openPopup.id === data.id ? 'on' : ''} key={i} onClick={() => setOpenPopup(data)}>
                {data.section}
                {openPopup &&
                  openPopup.id === data.id && ( // 추가된 부분
                    <div className="view-container">
                      <div className="view">
                        <div>
                          <div className="txt_box">
                            {openPopup.security ? (
                              <>
                                <span className="name">익명</span>
                                <span className="name">{openPopup.section}</span>
                              </>
                            ) : (
                              <>
                                <span className="name">{openPopup.nickname}</span>
                                <span className="email">{openPopup.email}</span>
                              </>
                            )}
                          </div>
                          <div className="comment_box">{openPopup.text}</div>
                        </div>
                      </div>
                      <button
                        className="close-button"
                        onClick={(event) => closeView(event, index, i)}
                      >
                        X
                      </button>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

React.memo(FeedbackMore)
