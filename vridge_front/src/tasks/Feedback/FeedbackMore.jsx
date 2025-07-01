import useInput from 'hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackMore({ current_project, onTimeClick, onFeedbackSelect }) {
  const [feedback, setFeedback] = useState([])
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)

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

  const handleFeedbackClick = (data) => {
    if (selectedFeedbackId === data.id) {
      setSelectedFeedbackId(null)
      if (onFeedbackSelect) {
        onFeedbackSelect(null)
      }
    } else {
      setSelectedFeedbackId(data.id)
      if (onFeedbackSelect) {
        onFeedbackSelect(data)
      }
    }
  }

  return (
    <div className="feedback-list-container">
      {feedback.map((item, index) => (
        <div key={index} className="box">
          <div className="day">{item[0]}</div>
          <ul>
            {item[1].map((data, i) => (
              <li 
                key={i} 
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span 
                  className="feedback-time-marker"
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: selectedFeedbackId === data.id ? '#1E3A8A' : '#2B56D1',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'inline-block',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    border: 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeedbackClick(data)
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFeedbackId !== data.id) {
                      e.target.style.backgroundColor = '#1E3A8A'
                    }
                    e.target.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFeedbackId !== data.id) {
                      e.target.style.backgroundColor = '#2B56D1'
                    } else {
                      e.target.style.backgroundColor = '#1E3A8A'
                    }
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  {data.section}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

React.memo(FeedbackMore)