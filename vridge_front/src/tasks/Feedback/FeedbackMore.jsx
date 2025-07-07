import useInput from 'hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'
import 'css/Cms/FeedbackMoreStyle.scss'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackMore({ current_project, onTimeClick }) {
  const [feedback, setFeedback] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let groupedObjects = {}
    // 방어 로직: feedback이 없거나 배열이 아닌 경우 처리
    const feedback_data = current_project?.feedback || []
    
    if (!Array.isArray(feedback_data)) {
      console.warn('[FeedbackMore] feedback is not an array:', feedback_data)
      setFeedback([])
      return
    }
    
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

  const handleFeedbackClick = (data) => {
    // 시간 이동
    if (onTimeClick && data.section) {
      onTimeClick(data.section)
    }
    
    // 내용 확장/축소
    if (expandedId === data.id) {
      setExpandedId(null)
    } else {
      setExpandedId(data.id)
    }
  }

  return (
    <div className="feedback-list-container">
      {feedback.map((item, index) => (
        <div key={index} className="box">
          <div className="day">{item[0]}</div>
          <ul>
            {item[1].map((data, i) => (
              <li key={i} className="feedback-item-wrapper">
                <div 
                  className={`feedback-item ${expandedId === data.id ? 'expanded' : ''}`}
                  onClick={() => handleFeedbackClick(data)}
                >
                  <div className="feedback-summary">
                    <span className="feedback-time-marker">
                      {data.section || '시간 미지정'}
                    </span>
                    <span className="feedback-preview">
                      {data.text?.substring(0, 50) || data.contents?.substring(0, 50) || '내용 없음'}
                      {(data.text?.length > 50 || data.contents?.length > 50) && '...'}
                    </span>
                    <svg 
                      className="expand-icon"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                {expandedId === data.id && (
                  <div className="feedback-detail">
                    <div className="detail-header">
                      <div className="author-info">
                        <span className="author-name">{data.nickname || data.email || '익명'}</span>
                        <span className="created-date">{moment(data.created).format('YYYY.MM.DD HH:mm')}</span>
                      </div>
                      <div className={`feedback-type ${data.security ? 'private' : 'public'}`}>
                        {data.security ? '비공개' : '공개'}
                      </div>
                    </div>
                    <div className="detail-content">
                      <p>{data.text || data.contents || '내용 없음'}</p>
                    </div>
                    {data.title && (
                      <div className="detail-title">
                        <strong>제목:</strong> {data.title}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

React.memo(FeedbackMore)