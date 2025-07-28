import useInput from '../../hooks/UseInput'
import React, { useState, useEffect } from 'react'
import styles from './FeedbackManage.module.scss'
import gridStyles from '../../css/Cms/FeedbackGridLayout.module.scss'

import { 
  DeleteFeedback, 
  UpdateFeedback,
  CreateFeedbackReply,
  DeleteFeedbackReply,
  ToggleFeedbackImportant,
  UpdateFeedbackReaction
} from '../../api/feedback'

export default function FeedbackManage({ refetch, current_project, user, onTimeClick }) {
  const [reactions, setReactions] = useState({})
  const [reactionCounts, setReactionCounts] = useState({})
  const [showReplyInput, setShowReplyInput] = useState({})
  const [replyTexts, setReplyTexts] = useState({})
  const [importantFeedbacks, setImportantFeedbacks] = useState({})
  
  // 기존 반응 상태 초기화 및 카운트 계산
  useEffect(() => {
    // feedback 필드 확인 (feedbacks가 아닌 feedback)
    const feedbackList = current_project?.feedback || []
    
    if (Array.isArray(feedbackList)) {
      const initialReactions = {}
      const counts = {}
      const initialImportant = {}
      
      feedbackList.forEach(feedback => {
        if (feedback.reaction) {
          initialReactions[feedback.id] = feedback.reaction
        }
        
        // 중요표시 상태 초기화
        if (feedback.is_important) {
          initialImportant[feedback.id] = true
        }
        
        // 반응 카운트 계산 (백엔드에서 제공하는 경우)
        if (feedback.reaction_counts) {
          counts[feedback.id] = feedback.reaction_counts
        } else {
          // 임시 카운트 (백엔드 구현 전)
          counts[feedback.id] = {
            like: feedback.reaction === 'like' ? 1 : 0,
            dislike: feedback.reaction === 'dislike' ? 1 : 0,
            needExplanation: feedback.reaction === 'needExplanation' ? 1 : 0
          }
        }
      })
      
      setReactions(initialReactions)
      setReactionCounts(counts)
      setImportantFeedbacks(initialImportant)
    } else {
      // feedback이 없거나 배열이 아닌 경우
      console.warn('[FeedbackManage] feedback is not an array:', feedbackList)
      setReactions({})
      setReactionCounts({})
      setImportantFeedbacks({})
    }
  }, [current_project])
  
  function DropFeedback(feedback_id) {
    DeleteFeedback(feedback_id)
      .then((res) => {
        console.log(res)
        window.alert('피드백이 삭제되었습니다.')
        refetch()
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          window.alert(err.response.data.message)
        }
      })
  }

  // feedback 필드 확인 (feedbacks가 아닌 feedback)
  const feedbackList = current_project?.feedback || []
  
  // 현재 사용자의 피드백만 필터링
  const My_Feedback = Array.isArray(feedbackList) 
    ? feedbackList.filter((i) => {
        // email 필드로 필터링
        return i.email === user
      })
    : []
  
  // 프로젝트 관리자인 경우 모든 피드백 표시
  const isProjectOwner = current_project?.owner_email === user
  const isProjectManager = current_project?.manager === user
  const showAllFeedbacks = isProjectOwner || isProjectManager
  
  const displayFeedbacks = showAllFeedbacks ? feedbackList : My_Feedback

  // 반응 토글 함수
  const toggleReaction = (feedbackId, reactionType) => {
    const currentReaction = reactions[feedbackId]
    const newReaction = currentReaction === reactionType ? null : reactionType
    
    // 로컬 상태 즉시 업데이트
    setReactions(prev => ({
      ...prev,
      [feedbackId]: newReaction
    }))
    
    // 카운트 업데이트
    setReactionCounts(prev => {
      const counts = { ...prev[feedbackId] } || { like: 0, dislike: 0, needExplanation: 0 }
      
      // 이전 반응이 있었다면 카운트 감소
      if (currentReaction) {
        counts[currentReaction] = Math.max(0, (counts[currentReaction] || 0) - 1)
      }
      
      // 새로운 반응이 있다면 카운트 증가
      if (newReaction) {
        counts[newReaction] = (counts[newReaction] || 0) + 1
      }
      
      return {
        ...prev,
        [feedbackId]: counts
      }
    })
    
    // API 호출로 반응 저장
    UpdateFeedbackReaction(feedbackId, newReaction)
      .then((response) => {
        console.log('Reaction updated successfully', response)
        refetch()
      })
      .catch(err => {
        console.error('Failed to update reaction:', err)
        // 실패 시 원래 상태로 되돌리기
        setReactions(prev => ({
          ...prev,
          [feedbackId]: currentReaction
        }))
        
        // 카운트도 원래대로 되돌리기
        setReactionCounts(prev => {
          const counts = { ...prev[feedbackId] } || { like: 0, dislike: 0, needExplanation: 0 }
          
          if (newReaction) {
            counts[newReaction] = Math.max(0, (counts[newReaction] || 0) - 1)
          }
          
          if (currentReaction) {
            counts[currentReaction] = (counts[currentReaction] || 0) + 1
          }
          
          return {
            ...prev,
            [feedbackId]: counts
          }
        })
      })
  }
  
  // 답글 제출 함수
  const submitReply = (feedbackId) => {
    const replyText = replyTexts[feedbackId]?.trim()
    if (!replyText) return
    
    CreateFeedbackReply(feedbackId, { text: replyText })
      .then((response) => {
        console.log('Reply created successfully', response)
        setReplyTexts(prev => ({ ...prev, [feedbackId]: '' }))
        setShowReplyInput(prev => ({ ...prev, [feedbackId]: false }))
        refetch()
      })
      .catch(err => {
        console.error('Failed to create reply:', err)
        window.alert('답글 등록에 실패했습니다.')
      })
  }
  
  // 중요표시 토글 함수
  const toggleImportant = (feedbackId) => {
    const wasImportant = importantFeedbacks[feedbackId]
    
    // 로컬 상태 즉시 업데이트
    setImportantFeedbacks(prev => ({
      ...prev,
      [feedbackId]: !wasImportant
    }))
    
    ToggleFeedbackImportant(feedbackId)
      .then((response) => {
        console.log('Important status toggled successfully', response)
        refetch()
      })
      .catch(err => {
        console.error('Failed to toggle important status:', err)
        // 실패 시 원래 상태로 되돌리기
        setImportantFeedbacks(prev => ({
          ...prev,
          [feedbackId]: wasImportant
        }))
      })
  }


  return (
    <div className={gridStyles['feedback-grid-container']}>
      <div className={gridStyles['feedback-grid']}>
        {displayFeedbacks.length > 0 ? (
          displayFeedbacks.map((feedback, index) => (
            <div key={feedback.id || index} className={gridStyles['feedback-card']}>
              <div className={gridStyles['card-header']}>
                <div 
                  className={gridStyles['time-badge']} 
                  onClick={() => {
                    if (onTimeClick && feedback.section) {
                      onTimeClick(feedback.section)
                    }
                  }}
                >
                  {feedback.section || '시간 미지정'}
                </div>
                <button
                  className={gridStyles['delete-btn']}
                  onClick={() => DropFeedback(feedback.id)}
                  title="삭제"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className={gridStyles['card-content']}>
                <p>{feedback.text || feedback.contents || feedback.comment}</p>
              </div>
              
              <div className={gridStyles['card-actions']}>
                <button
                  className={`${gridStyles['action-btn']} ${gridStyles.like} ${reactions[feedback.id] === 'like' ? gridStyles.active : ''}`}
                  onClick={() => toggleReaction(feedback.id, 'like')}
                >
                  <span>👍</span> 좋아요
                  {reactionCounts[feedback.id]?.like > 0 && (
                    <span className={gridStyles.count}>({reactionCounts[feedback.id].like})</span>
                  )}
                </button>
                
                <button
                  className={`${gridStyles['action-btn']} ${gridStyles.dislike} ${reactions[feedback.id] === 'dislike' ? gridStyles.active : ''}`}
                  onClick={() => toggleReaction(feedback.id, 'dislike')}
                >
                  <span>👎</span> 싫어요
                  {reactionCounts[feedback.id]?.dislike > 0 && (
                    <span className={gridStyles.count}>({reactionCounts[feedback.id].dislike})</span>
                  )}
                </button>
                
                <button
                  className={`${gridStyles['action-btn']} ${gridStyles.needExplanation} ${reactions[feedback.id] === 'needExplanation' ? gridStyles.active : ''}`}
                  onClick={() => toggleReaction(feedback.id, 'needExplanation')}
                >
                  <span>❓</span>
                  <span>추가설명필요</span>
                  {reactionCounts[feedback.id]?.needExplanation > 0 && (
                    <span className={gridStyles.count}>({reactionCounts[feedback.id].needExplanation})</span>
                  )}
                </button>
                
                <button
                  className={`${gridStyles['action-btn']} ${gridStyles.reply} ${showReplyInput[feedback.id] ? gridStyles.active : ''}`}
                  onClick={() => setShowReplyInput(prev => ({ ...prev, [feedback.id]: !prev[feedback.id] }))}
                >
                  <span>💬</span> 답글
                  {feedback.replies?.length > 0 && (
                    <span className={gridStyles.count}>({feedback.replies.length})</span>
                  )}
                </button>
                
                <button
                  className={`${gridStyles['action-btn']} ${gridStyles.important} ${importantFeedbacks[feedback.id] ? gridStyles.active : ''}`}
                  onClick={() => toggleImportant(feedback.id)}
                  title={importantFeedbacks[feedback.id] ? '중요 해제' : '중요 표시'}
                >
                  <span>{importantFeedbacks[feedback.id] ? '⭐' : '☆'}</span>
                  <span>중요</span>
                </button>
              </div>
              
              {/* 답글 섹션 */}
              {(showReplyInput[feedback.id] || feedback.replies?.length > 0) && (
                <div className={gridStyles['reply-section']}>
                  {showReplyInput[feedback.id] && (
                    <div className={gridStyles['reply-input-wrapper']}>
                      <input
                        type="text"
                        placeholder="답글을 입력하세요..."
                        value={replyTexts[feedback.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            submitReply(feedback.id)
                          }
                        }}
                      />
                      <button onClick={() => submitReply(feedback.id)}>
                        답글
                      </button>
                    </div>
                  )}
                  
                  {feedback.replies?.length > 0 && (
                    <div className={gridStyles['replies-list']}>
                      {feedback.replies.map((reply, idx) => (
                        <div key={idx} className={gridStyles['reply-item']}>
                          <div className={gridStyles['reply-author']}>
                            {reply.nickname || '익명'}
                          </div>
                          <div className={gridStyles['reply-text']}>{reply.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={gridStyles['empty-state']}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>피드백이 없습니다</h3>
            <p>첫 번째 피드백을 남겨보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

React.memo(FeedbackManage)
