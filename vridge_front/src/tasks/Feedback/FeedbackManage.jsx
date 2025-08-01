import useInput from 'hooks/UseInput'
import React, { useState, useEffect } from 'react'
import styles from './FeedbackManage.module.scss'

import { DeleteFeedback } from 'api/feedback'
import { UpdateFeedback } from 'api/feedback'

export default function FeedbackManage({ refetch, current_project, user, onTimeClick }) {
  const [reactions, setReactions] = useState({})
  const [reactionCounts, setReactionCounts] = useState({})
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [editText, setEditText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackStatus, setFeedbackStatus] = useState({})
  
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
    if (!window.confirm('정말로 이 피드백을 삭제하시겠습니까?')) {
      return
    }
    
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

  const startEdit = (feedback) => {
    setEditingFeedback(feedback.id)
    setEditText(feedback.text)
  }

  const cancelEdit = () => {
    setEditingFeedback(null)
    setEditText('')
  }

  const saveEdit = async (feedbackId) => {
    if (!editText.trim()) {
      alert('피드백 내용을 입력해주세요.')
      return
    }

    setIsUpdating(true)
    try {
      await UpdateFeedback(feedbackId, { text: editText.trim() })
      window.alert('피드백이 수정되었습니다.')
      setEditingFeedback(null)
      setEditText('')
      refetch()
    } catch (err) {
      console.error('Failed to update feedback:', err)
      if (err.response && err.response.data) {
        window.alert(err.response.data.message || '피드백 수정에 실패했습니다.')
      } else {
        window.alert('피드백 수정 중 오류가 발생했습니다.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleFeedbackStatus = (feedbackId) => {
    setFeedbackStatus(prev => ({
      ...prev,
      [feedbackId]: prev[feedbackId] === 'completed' ? 'pending' : 'completed'
    }))
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

  // 검색 및 필터 로직
  const filteredFeedbacks = All_Feedback.filter(feedback => {
    const matchesSearch = feedback.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.section?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' && feedbackStatus[feedback.id] === 'completed') ||
                         (statusFilter === 'pending' && feedbackStatus[feedback.id] !== 'completed')
    
    return matchesSearch && matchesStatus
  })

  const displayFeedbacks = filteredFeedbacks.length > 0 ? filteredFeedbacks : 
                          (searchTerm || statusFilter !== 'all') ? [] : All_Feedback

  return (
    <div className="history">
      {/* 검색 및 필터 영역 */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="피드백 내용, 작성자, 시간으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1631F8'
                e.target.style.boxShadow = '0 0 0 3px rgba(22, 49, 248, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="completed">완료됨</option>
          </select>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#6c757d'
        }}>
          <span>총 {displayFeedbacks.length}개 피드백</span>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              style={{
                background: 'none',
                border: '1px solid #dc3545',
                color: '#dc3545',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#dc3545'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none'
                e.target.style.color = '#dc3545'
              }}
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      <ul>
        {displayFeedbacks.length > 0 ? (
          displayFeedbacks.map((feedback, index) => (
            <li key={index} style={{ 
              marginBottom: '20px', 
              padding: '20px', 
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}>
              {/* 피드백 상태 표시 */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={() => toggleFeedbackStatus(feedback.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: feedbackStatus[feedback.id] === 'completed' 
                      ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                      : 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                    color: 'white',
                    boxShadow: feedbackStatus[feedback.id] === 'completed'
                      ? '0 2px 8px rgba(40, 167, 69, 0.3)'
                      : '0 2px 8px rgba(255, 193, 7, 0.3)'
                  }}
                  title={feedbackStatus[feedback.id] === 'completed' ? '처리 완료됨 (클릭하여 대기중으로 변경)' : '처리 대기중 (클릭하여 완료로 변경)'}
                >
                  {feedbackStatus[feedback.id] === 'completed' ? '✓ 완료' : '⏱ 대기'}
                </button>
              </div>

              <div>
                <div style={{ marginBottom: '16px', paddingRight: '80px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div 
                      className="time" 
                      style={{ 
                        cursor: 'pointer', 
                        background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-block',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(22, 49, 248, 0.2)'
                      }}
                      onClick={() => {
                        if (onTimeClick && feedback.section) {
                          onTimeClick(feedback.section)
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(22, 49, 248, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 2px 8px rgba(22, 49, 248, 0.2)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {feedback.section}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{feedback.nickname || '익명'}</span>
                      {feedback.created && (
                        <>
                          <span>•</span>
                          <span>{new Date(feedback.created).toLocaleDateString('ko-KR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingFeedback === feedback.id ? (
                    <div style={{ marginBottom: '12px' }}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '12px',
                          border: '2px solid #1631F8',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          boxShadow: '0 0 0 3px rgba(22, 49, 248, 0.1)'
                        }}
                        placeholder="피드백 내용을 입력하세요..."
                      />
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginTop: '8px',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={cancelEdit}
                          disabled={isUpdating}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #6c757d',
                            borderRadius: '6px',
                            background: 'white',
                            color: '#6c757d',
                            fontSize: '14px',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isUpdating ? 0.6 : 1
                          }}
                        >
                          취소
                        </button>
                        <button
                          onClick={() => saveEdit(feedback.id)}
                          disabled={isUpdating || !editText.trim()}
                          style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: isUpdating || !editText.trim() 
                              ? '#6c757d' 
                              : 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: isUpdating || !editText.trim() ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isUpdating || !editText.trim() ? 0.6 : 1
                          }}
                        >
                          {isUpdating ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ 
                      margin: '0', 
                      lineHeight: '1.6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>
                      {feedback.text}
                    </p>
                  )}
                </div>

                {/* 액션 버튼들 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingFeedback !== feedback.id && (
                      <button
                        onClick={() => startEdit(feedback)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #1631F8',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#1631F8',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1631F8'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white'
                          e.currentTarget.style.color = '#1631F8'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        수정
                      </button>
                    )}
                    <button
                      onClick={() => DropFeedback(feedback.id)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #dc3545',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#dc3545',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc3545'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.color = '#dc3545'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      삭제
                    </button>
                  </div>
                </div>
                
                  {/* 반응 버튼들 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => toggleReaction(feedback.id, 'like')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: reactions[feedback.id] === 'like' ? '2px solid #28a745' : '1px solid #e9ecef',
                        backgroundColor: reactions[feedback.id] === 'like' ? 'rgba(40, 167, 69, 0.1)' : 'white',
                        color: reactions[feedback.id] === 'like' ? '#28a745' : '#666',
                        fontSize: '12px',
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
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reactions[feedback.id] !== 'like') {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      <span>👍</span> 도움됨
                      {reactionCounts[feedback.id]?.like > 0 && (
                        <span style={{ 
                          marginLeft: '2px', 
                          fontWeight: '600',
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }}>
                          {reactionCounts[feedback.id].like}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => toggleReaction(feedback.id, 'needExplanation')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: reactions[feedback.id] === 'needExplanation' ? '2px solid #ffc107' : '1px solid #e9ecef',
                        backgroundColor: reactions[feedback.id] === 'needExplanation' ? 'rgba(255, 193, 7, 0.1)' : 'white',
                        color: reactions[feedback.id] === 'needExplanation' ? '#ffc107' : '#666',
                        fontSize: '12px',
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
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reactions[feedback.id] !== 'needExplanation') {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      <span>❓</span> 설명필요
                      {reactionCounts[feedback.id]?.needExplanation > 0 && (
                        <span style={{ 
                          marginLeft: '2px', 
                          fontWeight: '600',
                          backgroundColor: '#ffc107',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }}>
                          {reactionCounts[feedback.id].needExplanation}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '16px',
            border: '2px dashed #c8d4ff'
          }}>
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '20px', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" stroke="#6c757d" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="11" x2="14" y2="11" stroke="#6c757d" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  검색 결과가 없습니다
                </h3>
                <p style={{ 
                  margin: '0 0 20px 0', 
                  color: '#6c757d', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  '{searchTerm}' 또는 '{statusFilter === 'completed' ? '완료됨' : statusFilter === 'pending' ? '대기중' : ''}' 조건과 일치하는 피드백을 찾을 수 없습니다.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(22, 49, 248, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(22, 49, 248, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(22, 49, 248, 0.2)'
                  }}
                >
                  모든 피드백 보기
                </button>
              </>
            ) : (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '20px', opacity: 0.5 }}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9h8M8 13h6" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#495057' 
                }}>
                  아직 피드백이 없습니다
                </h3>
                <p style={{ 
                  margin: '0', 
                  color: '#6c757d', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  영상에 대한 첫 번째 피드백을 남겨보세요.<br/>
                  시간을 클릭하여 특정 구간에 대한 의견을 작성할 수 있습니다.
                </p>
              </>
            )}
          </div>
        )}
      </ul>
    </div>
  )
}

React.memo(FeedbackManage)
