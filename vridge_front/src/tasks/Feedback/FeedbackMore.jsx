import useInput from '../../hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import moment from 'moment'
import 'moment/locale/ko'
import styles from '../../css/Cms/FeedbackGridLayout.module.scss'

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
      // 안전한 날짜 처리 - null/undefined 체크
      if (!obj || !obj.created) {
        console.warn('[FeedbackMore] Invalid feedback object or missing created date:', obj)
        return
      }
      
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
    <div className={styles['feedback-grid-container']}>
      {feedback.length === 0 ? (
        <div className={styles['empty-state']}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>등록된 피드백이 없습니다</h3>
          <p>피드백 등록 탭에서 새로운 피드백을 추가해보세요</p>
        </div>
      ) : (
        feedback.map((item, index) => (
        <div key={index} className={styles['feedback-date-group']}>
          <div className={styles['date-header']}>{item[0]}</div>
          <div className={styles['feedback-list']}>
            {item[1].map((data, i) => (
              <div key={data.id || i} className={styles['feedback-card']} onClick={() => handleFeedbackClick(data)}>
                <div className={styles['card-header']}>
                  <div 
                    className={styles['time-badge']}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTimeClick && data.section) {
                        onTimeClick(data.section);
                      }
                    }}
                  >
                    {data.section || '시간 미지정'}
                  </div>
                  {data.security && (
                    <div className={styles['privacy-badge']}>🔒 비공개</div>
                  )}
                </div>
                <div className={styles['card-content']}>
                  <p>
                    {data.text || data.contents || '내용 없음'}
                  </p>
                </div>
                <div className={styles['card-actions']}>
                  <button 
                    className={`${styles['action-btn']} ${styles.like} ${typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'like' ? styles.active : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(data.id, 'like');
                    }}
                  >
                    <span>👍</span>
                    <span className={styles.count}>{feedbackReactions[`${data.id}_like`] || 0}</span>
                  </button>
                  <button 
                    className={`${styles['action-btn']} ${styles.dislike} ${typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'dislike' ? styles.active : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(data.id, 'dislike');
                    }}
                  >
                    <span>👎</span>
                    <span className={styles.count}>{feedbackReactions[`${data.id}_dislike`] || 0}</span>
                  </button>
                  <div className={styles['author-info']}>
                    <span>{data.nickname || data.email || '익명'}</span>
                    <span className={styles.dot}>·</span>
                    <span>{moment(data.created).format('MM.DD HH:mm')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )))}
    </div>
  )
}

React.memo(FeedbackMore)