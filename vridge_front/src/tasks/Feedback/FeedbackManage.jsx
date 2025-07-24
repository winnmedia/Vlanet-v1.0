import useInput from 'hooks/UseInput'
import React, { useState, useEffect } from 'react'
import styles from './FeedbackManage.module.scss'

import { DeleteFeedback } from 'api/feedback'
import { UpdateFeedback } from 'api/feedback'

export default function FeedbackManage({ refetch, current_project, user, onTimeClick }) {
  const [reactions, setReactions] = useState({})
  const [reactionCounts, setReactionCounts] = useState({})
  
  // 기존 반응 상태 초기화 및 카운트 계산
  useEffect(() => {
    // feedback 필드 확인 (feedbacks가 아닌 feedback)
    const feedbackList = current_project?.feedback || []
    
    if (Array.isArray(feedbackList)) {
      const initialReactions = {}
      const counts = {}
      
      feedbackList.forEach(feedback => {
        if (feedback.reaction) {
          initialReactions[feedback.id] = feedback.reaction
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
    } else {
      // feedback이 없거나 배열이 아닌 경우
      console.warn('[FeedbackManage] feedback is not an array:', feedbackList)
      setReactions({})
      setReactionCounts({})
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
        // 디버깅을 위해 상세 정보 출력
        console.log('[FeedbackManage] Checking feedback:', i)
        console.log('[FeedbackManage] Feedback email:', i.email)
        console.log('[FeedbackManage] Current user:', user)
        console.log('[FeedbackManage] Match result:', i.email === user)
        // email 필드로 필터링
        return i.email === user
      })
    : []
  
  // 디버깅을 위해 모든 피드백도 표시
  const All_Feedback = Array.isArray(feedbackList) ? feedbackList : []

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
    
    // API 호출로 반응 저장 (백엔드 API 준비 후 활성화)
    console.log('Reaction toggled:', feedbackId, 'with reaction:', newReaction)
    
    // TODO: 백엔드에 PATCH 메서드 구현 후 아래 코드 활성화
    // UpdateFeedback(feedbackId, { reaction: newReaction })
    //   .then((response) => {
    //     console.log('Reaction updated successfully', response)
    //     refetch()
    //   })
    //   .catch(err => {
    //     console.error('Failed to update reaction:', err)
    //     console.error('Error details:', err.response)
    //     // 실패 시 원래 상태로 되돌리기
    //     setReactions(prev => ({
    //       ...prev,
    //       [feedbackId]: currentReaction
    //     }))
        
    //     // 카운트도 원래대로 되돌리기
    //     setReactionCounts(prev => {
    //       const counts = { ...prev[feedbackId] } || { like: 0, dislike: 0, needExplanation: 0 }
          
    //       if (newReaction) {
    //         counts[newReaction] = Math.max(0, (counts[newReaction] || 0) - 1)
    //       }
          
    //       if (currentReaction) {
    //         counts[currentReaction] = (counts[currentReaction] || 0) + 1
    //       }
          
    //       return {
    //         ...prev,
    //         [feedbackId]: counts
    //       }
    //     })
    //   })
  }

  // 디버깅 로그 추가
  console.log('[FeedbackManage] Current project:', current_project)
  console.log('[FeedbackManage] Feedback list:', feedbackList)
  console.log('[FeedbackManage] My feedback:', My_Feedback)
  console.log('[FeedbackManage] User:', user)
  
  // 첫 번째 피드백의 구조 확인
  if (feedbackList.length > 0) {
    console.log('[FeedbackManage] First feedback structure:', feedbackList[0])
    console.log('[FeedbackManage] Feedback fields:', Object.keys(feedbackList[0]))
  }

  // 디버깅을 위해 일시적으로 모든 피드백 표시
  const displayFeedbacks = All_Feedback.length > 0 ? All_Feedback : My_Feedback

  return (
    <div className="history">
      <ul>
        {displayFeedbacks.length > 0 ? (
          displayFeedbacks.map((feedback, index) => (
            <li key={index} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <div className="flex align_center space_between" style={{ marginBottom: '12px' }}>
                  <div className="txt_box" style={{ flex: 1 }}>
                    <div 
                      className="time" 
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: '#2B56D1',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'inline-block',
                        transition: 'all 0.2s ease',
                        marginBottom: '8px'
                      }}
                      onClick={() => {
                        if (onTimeClick && feedback.section) {
                          onTimeClick(feedback.section)
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1E3A8A'
                        e.target.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2B56D1'
                        e.target.style.transform = 'scale(1)'
                      }}
                    >
                      {feedback.section}
                    </div>
                    <p style={{ marginBottom: '0' }}>{feedback.text}</p>
                  </div>
                  <button
                    onClick={() => DropFeedback(feedback.id)}
                    className="delete"
                    style={{ marginLeft: '12px' }}
                  >
                    삭제
                  </button>
                </div>
                
                {/* 반응 버튼들 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <button
                    onClick={() => toggleReaction(feedback.id, 'like')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #e9ecef',
                      backgroundColor: reactions[feedback.id] === 'like' ? '#e3f2fd' : 'white',
                      color: reactions[feedback.id] === 'like' ? '#1976d2' : '#666',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (reactions[feedback.id] !== 'like') {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (reactions[feedback.id] !== 'like') {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <span>👍</span> 좋아요
                    {reactionCounts[feedback.id]?.like > 0 && (
                      <span style={{ marginLeft: '4px', fontWeight: '600' }}>
                        ({reactionCounts[feedback.id].like})
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleReaction(feedback.id, 'dislike')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #e9ecef',
                      backgroundColor: reactions[feedback.id] === 'dislike' ? '#ffebee' : 'white',
                      color: reactions[feedback.id] === 'dislike' ? '#d32f2f' : '#666',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (reactions[feedback.id] !== 'dislike') {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (reactions[feedback.id] !== 'dislike') {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <span>👎</span> 싫어요
                    {reactionCounts[feedback.id]?.dislike > 0 && (
                      <span style={{ marginLeft: '4px', fontWeight: '600' }}>
                        ({reactionCounts[feedback.id].dislike})
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleReaction(feedback.id, 'needExplanation')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #e9ecef',
                      backgroundColor: reactions[feedback.id] === 'needExplanation' ? '#fff3e0' : 'white',
                      color: reactions[feedback.id] === 'needExplanation' ? '#f57c00' : '#666',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (reactions[feedback.id] !== 'needExplanation') {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (reactions[feedback.id] !== 'needExplanation') {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <span>❓</span> 설명필요
                    {reactionCounts[feedback.id]?.needExplanation > 0 && (
                      <span style={{ marginLeft: '4px', fontWeight: '600' }}>
                        ({reactionCounts[feedback.id].needExplanation})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))
        ) : (
          <div className="flex mt50 justify_center">피드백이 없습니다.</div>
        )}
      </ul>
    </div>
  )
}

React.memo(FeedbackManage)
