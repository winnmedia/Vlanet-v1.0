import React, { useState, useEffect } from 'react'
import styles from './FeedbackManage.module.scss'
import { DeleteFeedback, UpdateFeedback } from 'api/feedback'

function FeedbackManage({ refetch, current_project, user, onTimeClick }) {
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
    console.log('[FeedbackManage] Current project:', current_project)
    const feedbackList = current_project?.feedback || []
    console.log('[FeedbackManage] Feedback list:', feedbackList)
    
    if (Array.isArray(feedbackList)) {
      const initialReactions = {}
      const counts = {}
      const statuses = {}
      
      feedbackList.forEach(feedback => {
        if (feedback.reaction) {
          initialReactions[feedback.id] = feedback.reaction
        }
        
        // 반응 카운트 계산
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
        
        // 상태 초기화
        statuses[feedback.id] = feedback.status || 'pending'
      })
      
      setReactions(initialReactions)
      setReactionCounts(counts)
      setFeedbackStatus(statuses)
    }
  }, [current_project])

  // 피드백 삭제 함수
  function DropFeedback(feedback_id) {
    console.log('[FeedbackManage] Deleting feedback ID:', feedback_id)
    
    if (!window.confirm('정말 이 피드백을 삭제하시겠습니까?')) {
      return
    }

    DeleteFeedback(feedback_id)
      .then((response) => {
        console.log('[FeedbackManage] Delete response:', response)
        alert('피드백이 삭제되었습니다.')
        refetch()
      })
      .catch(err => {
        console.error('피드백 삭제 실패:', err)
        console.error('Error details:', err.response)
        alert('피드백 삭제에 실패했습니다.')
      })
  }

  // 편집 시작
  const startEdit = (feedback) => {
    console.log('[FeedbackManage] Starting edit for feedback:', feedback)
    setEditingFeedback(feedback.id)
    setEditText(feedback.message || feedback.text || '')
  }

  // 편집 취소
  const cancelEdit = () => {
    setEditingFeedback(null)
    setEditText('')
  }

  // 편집 저장
  const saveEdit = async (feedbackId) => {
    console.log('[FeedbackManage] Saving edit for feedback ID:', feedbackId)
    console.log('[FeedbackManage] Edit text:', editText)
    
    if (!editText.trim()) {
      alert('피드백 내용을 입력해주세요.')
      return
    }

    setIsUpdating(true)
    try {
      const response = await UpdateFeedback(feedbackId, { text: editText })
      console.log('[FeedbackManage] Update response:', response)
      alert('피드백이 수정되었습니다.')
      setEditingFeedback(null)
      setEditText('')
      refetch()
    } catch (err) {
      console.error('피드백 수정 실패:', err)
      alert('피드백 수정에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  // 피드백 상태 토글
  const toggleFeedbackStatus = (feedbackId) => {
    const currentStatus = feedbackStatus[feedbackId] || 'pending'
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    
    setFeedbackStatus(prev => ({
      ...prev,
      [feedbackId]: newStatus
    }))
  }

  // 피드백 필터링
  const feedbackList = current_project?.feedback || []
  const allFeedbacks = Array.isArray(feedbackList) ? feedbackList : []
  
  // 검색 및 필터 적용
  const displayFeedbacks = allFeedbacks.filter(feedback => {
    const matchesSearch = !searchTerm || 
      feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (feedbackStatus[feedback.id] || 'pending') === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
        counts[currentReaction] = Math.max(0, counts[currentReaction] - 1)
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
  }

  return (
    <div className={styles.feedbackContainer}>
      {/* 검색 및 필터 영역 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="피드백 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="completed">완료됨</option>
          </select>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>총 {displayFeedbacks.length}개 피드백</span>
          
          <button
            onClick={refetch}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #1631F8',
              borderRadius: '8px',
              color: '#1631F8',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            새로고침
          </button>
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {displayFeedbacks.length > 0 ? (
          displayFeedbacks.map((feedback, index) => {
            const isMyFeedback = feedback.email === user
            const isEditing = editingFeedback === feedback.id
            
            return (
              <li key={feedback.id || index} style={{ 
                marginBottom: '20px', 
                padding: '20px', 
                backgroundColor: 'white',
                borderRadius: '12px',
                border: isMyFeedback ? '2px solid #1631F8' : '1px solid #e9ecef',
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
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: (feedbackStatus[feedback.id] || 'pending') === 'completed' 
                        ? '#28a745' 
                        : '#ffc107',
                      color: 'white'
                    }}
                  >
                    {(feedbackStatus[feedback.id] || 'pending') === 'completed' ? '완료됨' : '대기중'}
                  </button>
                </div>

                <div style={{ paddingRight: '100px' }}>
                  {/* 작성자 정보 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    {/* 아바타 */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      position: 'relative'
                    }}>
                      {feedback.nickname ? feedback.nickname[0].toUpperCase() : '?'}
                      {feedback.time_at && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: '#4CAF50',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white'
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* 작성자 이름과 시간 */}
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '14px',
                        color: '#212529'
                      }}>
                        <span>{feedback.nickname || '익명'}</span>
                        {feedback.time_at && (
                          <>
                            <span style={{ color: '#6c757d', fontWeight: '400', margin: '0 6px' }}>•</span>
                            <span style={{ color: '#1631F8', fontWeight: '500', cursor: 'pointer' }}
                                  onClick={() => onTimeClick && onTimeClick(feedback.time_at)}>
                              {feedback.time_at}
                            </span>
                          </>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6c757d',
                        marginTop: '2px' 
                      }}>
                        {new Date(feedback.created).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  {/* 피드백 내용 */}
                  <div style={{ marginBottom: '16px' }}>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #1631F8',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                          autoFocus
                        />
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => saveEdit(feedback.id)}
                            disabled={isUpdating}
                            style={{
                              padding: '8px 16px',
                              background: '#1631F8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: isUpdating ? 'wait' : 'pointer',
                              opacity: isUpdating ? 0.7 : 1
                            }}
                          >
                            {isUpdating ? '저장 중...' : '저장'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              padding: '8px 16px',
                              background: '#f8f9fa',
                              color: '#495057',
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        lineHeight: '1.6',
                        color: '#495057',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {feedback.message || feedback.text}
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼들 */}
                  {isMyFeedback && !isEditing && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <button
                        onClick={() => startEdit(feedback)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#1631F8',
                          border: '1px solid #1631F8',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        수정
                      </button>
                      
                      <button
                        onClick={() => DropFeedback(feedback.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#dc3545',
                          border: '1px solid #dc3545',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
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
                  )}

                  {/* 반응 버튼들 */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    borderTop: '1px solid #f1f3f5',
                    paddingTop: '12px'
                  }}>
                    <button
                      onClick={() => toggleReaction(feedback.id, 'like')}
                      style={{
                        padding: '6px 14px',
                        background: reactions[feedback.id] === 'like' ? '#e3f2fd' : '#f8f9fa',
                        color: reactions[feedback.id] === 'like' ? '#1976d2' : '#6c757d',
                        border: reactions[feedback.id] === 'like' ? '1px solid #1976d2' : '1px solid #e9ecef',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>👍</span> 도움됨
                      {reactionCounts[feedback.id]?.like > 0 && (
                        <span style={{
                          background: '#1976d2',
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
                      onClick={() => toggleReaction(feedback.id, 'dislike')}
                      style={{
                        padding: '6px 14px',
                        background: reactions[feedback.id] === 'dislike' ? '#ffebee' : '#f8f9fa',
                        color: reactions[feedback.id] === 'dislike' ? '#c62828' : '#6c757d',
                        border: reactions[feedback.id] === 'dislike' ? '1px solid #c62828' : '1px solid #e9ecef',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>👎</span> 아쉬움
                      {reactionCounts[feedback.id]?.dislike > 0 && (
                        <span style={{
                          background: '#c62828',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }}>
                          {reactionCounts[feedback.id].dislike}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => toggleReaction(feedback.id, 'needExplanation')}
                      style={{
                        padding: '6px 14px',
                        background: reactions[feedback.id] === 'needExplanation' ? '#fff8e1' : '#f8f9fa',
                        color: reactions[feedback.id] === 'needExplanation' ? '#f57c00' : '#6c757d',
                        border: reactions[feedback.id] === 'needExplanation' ? '1px solid #f57c00' : '1px solid #e9ecef',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>❓</span> 설명필요
                      {reactionCounts[feedback.id]?.needExplanation > 0 && (
                        <span style={{
                          background: '#f57c00',
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
              </li>
            )
          })
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '16px' }}>
                  <circle cx="11" cy="11" r="8" stroke="#6c757d" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="11" x2="14" y2="11" stroke="#6c757d" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#212529'
                }}>
                  검색 결과가 없습니다
                </h3>
                <p style={{ 
                  margin: '0', 
                  color: '#6c757d', 
                  fontSize: '14px' 
                }}>
                  다른 검색어나 필터를 시도해보세요
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    background: '#1631F8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  필터 초기화
                </button>
              </>
            ) : (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '16px' }}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9h8M8 13h6" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#212529'
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

export default React.memo(FeedbackManage)