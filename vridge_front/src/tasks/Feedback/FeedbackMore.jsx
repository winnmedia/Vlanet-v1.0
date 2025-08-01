import useInput from 'hooks/UseInput'
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import moment from 'moment'
import 'moment/locale/ko'

export default function FeedbackMore({ current_project, onTimeClick, onFeedbackSelect }) {
  const { user } = useSelector((s) => s.ProjectStore)
  const [feedback, setFeedback] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [feedbackReactions, setFeedbackReactions] = useState({}) // 피드백별 리액션 상태
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    
    try {
      let groupedObjects = {}
      // 방어 로직: feedback 필드 확인 (feedbacks가 아닌 feedback)
      const feedback_data = current_project?.feedback || []
      
      console.log('[FeedbackMore] Current project:', current_project)
      console.log('[FeedbackMore] Feedback data:', feedback_data)
      
      if (!Array.isArray(feedback_data)) {
        console.warn('[FeedbackMore] feedback is not an array:', feedback_data)
        setFeedback([])
        setIsLoading(false)
        return
      }
      
      if (feedback_data.length === 0) {
        console.log('[FeedbackMore] No feedback data available')
        setFeedback([])
        setIsLoading(false)
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
      setIsLoading(false)
    } catch (err) {
      console.error('[FeedbackMore] Error processing feedback data:', err)
      setError('피드백 데이터를 처리하는 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
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
      {isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1631F8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ 
            margin: '0', 
            color: '#6c757d', 
            fontSize: '14px' 
          }}>
            피드백을 불러오는 중...
          </p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          background: 'rgba(220, 53, 69, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(220, 53, 69, 0.2)'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '20px', color: '#dc3545' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#dc3545' 
          }}>
            오류가 발생했습니다
          </h3>
          <p style={{ 
            margin: '0 0 20px 0', 
            color: '#6c757d', 
            fontSize: '14px' 
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: '#dc3545',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#c82333'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#dc3545'
            }}
          >
            새로고침
          </button>
        </div>
      ) : feedback.length === 0 ? (
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
            피드백 등록 탭에서 새로운 피드백을 추가할 수 있습니다.
          </p>
        </div>
      ) : (
        feedback.map((item, index) => (
        <div key={index} style={{
          marginBottom: '24px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderBottom: '1px solid #e9ecef',
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057'
          }}>
            {item[0]}
          </div>
          <div style={{ padding: '8px' }}>
            {item[1].map((data, i) => (
              <div key={i} style={{
                marginBottom: i < item[1].length - 1 ? '8px' : '0'
              }}>
                <div 
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: expandedId === data.id ? 'rgba(22, 49, 248, 0.02)' : 'white',
                    borderColor: expandedId === data.id ? '#1631F8' : '#e9ecef'
                  }}
                  onClick={() => handleFeedbackClick(data)}
                  onMouseEnter={(e) => {
                    if (expandedId !== data.id) {
                      e.currentTarget.style.background = '#f8f9fa'
                      e.currentTarget.style.borderColor = '#c8d4ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedId !== data.id) {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = '#e9ecef'
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1,
                      minWidth: 0
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(22, 49, 248, 0.2)'
                      }}>
                        {data.section || '시간 미지정'}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: '#495057',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {data.text?.substring(0, 50) || data.contents?.substring(0, 50) || '내용 없음'}
                        {(data.text?.length > 50 || data.contents?.length > 50) && '...'}
                      </span>
                    </div>
                    <svg 
                      style={{
                        width: '16px',
                        height: '16px',
                        color: '#6c757d',
                        transition: 'transform 0.2s ease',
                        transform: expandedId === data.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0
                      }}
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
                  <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: 'rgba(22, 49, 248, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(22, 49, 248, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(22, 49, 248, 0.1)'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#212529',
                          marginBottom: '4px'
                        }}>
                          {data.nickname || data.email || '익명'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6c757d'
                        }}>
                          {moment(data.created).format('YYYY.MM.DD HH:mm')}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: data.security ? 
                          'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' : 
                          'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        color: 'white',
                        boxShadow: data.security ?
                          '0 2px 4px rgba(255, 193, 7, 0.3)' :
                          '0 2px 4px rgba(40, 167, 69, 0.3)'
                      }}>
                        {data.security ? '비공개' : '공개'}
                      </div>
                    </div>
                    
                    <div style={{
                      marginBottom: '16px'
                    }}>
                      <p style={{
                        margin: '0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#212529'
                      }}>
                        {data.text || data.contents || '내용 없음'}
                      </p>
                    </div>
                    
                    {data.title && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <strong style={{ color: '#495057' }}>제목:</strong> {data.title}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <button 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '20px',
                          background: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'like' ? 
                            'rgba(40, 167, 69, 0.1)' : 'white',
                          color: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'like' ? 
                            '#28a745' : '#6c757d',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          borderColor: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'like' ? 
                            '#28a745' : '#e9ecef'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(data.id, 'like');
                        }}
                        onMouseEnter={(e) => {
                          if (typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) !== 'like') {
                            e.currentTarget.style.background = '#f8f9fa'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) !== 'like') {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        <span>{feedbackReactions[`${data.id}_like`] || 0}</span>
                      </button>
                      
                      <button 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '20px',
                          background: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'dislike' ? 
                            'rgba(220, 53, 69, 0.1)' : 'white',
                          color: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'dislike' ? 
                            '#dc3545' : '#6c757d',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          borderColor: typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) === 'dislike' ? 
                            '#dc3545' : '#e9ecef'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(data.id, 'dislike');
                        }}
                        onMouseEnter={(e) => {
                          if (typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) !== 'dislike') {
                            e.currentTarget.style.background = '#f8f9fa'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (typeof window !== 'undefined' && localStorage.getItem(`user_feedback_reaction_${data.id}_${user}`) !== 'dislike') {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                        </svg>
                        <span>{feedbackReactions[`${data.id}_dislike`] || 0}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )))}
    </div>
  )
}

React.memo(FeedbackMore)