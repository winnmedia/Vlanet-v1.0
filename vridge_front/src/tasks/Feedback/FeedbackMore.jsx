import useInput from '../../hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackMore({ current_project, onTimeClick, onFeedbackSelect }) {
  const { user } = useSelector((s) => s.ProjectStore)
  const [feedback, setFeedback] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [feedbackReactions, setFeedbackReactions] = useState({}) // 피드백별 리액션 상태

  useEffect(() => {
    let groupedObjects = {}
    // 방어 로직: feedback 필드 확인 (feedbacks가 아닌 feedback)
    const feedback_data = current_project?.feedback || []
    
    console.log('[FeedbackMore] Current project:', current_project)
    console.log('[FeedbackMore] Feedback data:', feedback_data)
    
    if (!Array.isArray(feedback_data)) {
      console.warn('[FeedbackMore] feedback is not an array:', feedback_data)
      setFeedback([])
      return
    }
    
    if (feedback_data.length === 0) {
      console.log('[FeedbackMore] No feedback data available')
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
  
  // 로컬 스토리지에서 리액션 데이터 불러오기
  useEffect(() => {
    const projectId = current_project?.id
    if (projectId) {
      const savedReactions = typeof window !== 'undefined' && localStorage.getItem(`feedback_reactions_${projectId}`)
      if (savedReactions) {
        setFeedbackReactions(JSON.parse(savedReactions))
      }
    }
  }, [current_project])

  // 리액션 핸들러
  const handleReaction = (feedbackId, type) => {
    const key = `${feedbackId}_${type}`
    const userReactionKey = `user_feedback_reaction_${feedbackId}_${user}`
    const currentUserReaction = typeof window !== 'undefined' && localStorage.getItem(userReactionKey)
    const projectId = current_project?.id
    
    setFeedbackReactions(prev => {
      const newReactions = { ...prev }
      
      // 이미 같은 리액션을 클릭한 경우 취소
      if (currentUserReaction === type) {
        newReactions[key] = Math.max(0, (newReactions[key] || 0) - 1)
        typeof window !== 'undefined' && localStorage.removeItem(userReactionKey)
      } else {
        // 기존 리액션이 있으면 제거
        if (currentUserReaction) {
          const oldKey = `${feedbackId}_${currentUserReaction}`
          newReactions[oldKey] = Math.max(0, (newReactions[oldKey] || 0) - 1)
        }
        // 새 리액션 추가
        newReactions[key] = (newReactions[key] || 0) + 1
        typeof window !== 'undefined' && localStorage.setItem(userReactionKey, type)
      }
      
      // 로컬 스토리지에 저장
      if (projectId) {
        typeof window !== 'undefined' && localStorage.setItem(`feedback_reactions_${projectId}`, JSON.stringify(newReactions))
      }
      return newReactions
    })
  }

  const handleFeedbackClick = (data) => {
    // 시간 이동
    if (onTimeClick && data.section) {
      onTimeClick(data.section)
    }
    
    // 피드백 선택 콜백 호출
    if (onFeedbackSelect) {
      onFeedbackSelect(data)
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
      {feedback.length === 0 ? (
        <div className="no-feedback-message" style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#666',
          fontSize: '14px'
        }}>
          <p>등록된 피드백이 없습니다.</p>
          <p style={{ marginTop: '10px', fontSize: '13px' }}>
            피드백 등록 탭에서 새로운 피드백을 추가해보세요.
          </p>
        </div>
      ) : (
        feedback.map((item, index) => (
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
                    <div className="detail-actions">
                      <button 
                        className={`reaction-btn like ${typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'like' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(data.id, 'like');
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        <span className="count">{feedbackReactions[`${data.id}_like`] || 0}</span>
                      </button>
                      <button 
                        className={`reaction-btn dislike ${typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'dislike' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(data.id, 'dislike');
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                        </svg>
                        <span className="count">{feedbackReactions[`${data.id}_dislike`] || 0}</span>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )))}
    </div>
  )
}

React.memo(FeedbackMore)