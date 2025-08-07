import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CreateFeedback } from '../../api/feedback'
import { checkSession } from '../../util/util'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { message } from 'antd'

export default function OpinionInput({ project_id, current_project, refetch }) {
  const router = useRouter()
  const navigate = router.push
  const { user } = useSelector((s) => s.ProjectStore)
  
  // 인증 체크
  useEffect(() => {
    const token = checkSession()
    if (!token) {
      toast.error('로그인이 필요한 서비스입니다.')
      navigate('/login')
    }
  }, [])
  const [opinion, setOpinion] = useState('')
  const [commentType, setCommentType] = useState('general') // 기본값: 일반
  const [submitting, setSubmitting] = useState(false)
  const [commentReactions, setCommentReactions] = useState({}) // 코멘트별 리액션 상태
  
  // 현재 사용자 정보 가져오기
  const userInfo = current_project?.member_list?.find(m => m.email === user) || 
                   (current_project?.owner_email === user ? { email: user, nickname: current_project?.owner_nickname } : null)
  
  // 코멘트 종류 옵션
  const commentTypes = [
    { value: 'general', label: '일반' },
    { value: 'question', label: '질문' },
    { value: 'suggestion', label: '제안' },
    { value: 'issue', label: '문제점' },
    { value: 'praise', label: '칭찬' },
  ]

  const handleSubmit = async () => {
    const trimmedOpinion = opinion.trim()
    if (!trimmedOpinion) {
      toast.warning('코멘트를 입력해주세요.');
      return
    }

    if (trimmedOpinion.length > 500) {
      toast.warning('코멘트는 500자 이내로 입력해주세요.');
      return
    }

    setSubmitting(true)
    try {
      // API 호출로 의견 저장
      await CreateFeedback({
        section: `${commentTypes.find(t => t.value === commentType).label} 코멘트`, // 코멘트 타입 포함
        comment: trimmedOpinion,
        type: 'opinion', // 의견 타입 추가
        comment_type: commentType, // 세부 코멘트 타입
        contents: trimmedOpinion, // contents 필드 추가
        title: '', // 빈 제목
        secret: false // 기본값
      }, project_id)

      // 입력 필드 초기화
      setOpinion('')
      
      // 부모 컴포넌트 리페치
      if (refetch) {
        refetch()
      }
      
      toast.success('코멘트가 등록되었습니다.');
    } catch (error) {
      console.error('코멘트 등록 실패:', error)
      let errorMessage = '코멘트 등록에 실패했습니다. 다시 시도해주세요.'
      
      if (error.response?.status === 401) {
        toast.error('로그인이 필요합니다.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('권한이 없습니다.');
      } else if (error.response?.status === 404) {
        toast.error('프로젝트를 찾을 수 없습니다.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('코멘트 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 현재 프로젝트의 피드백 코멘트 표시
  const opinions = current_project?.feedback?.filter(
    comment => comment.section?.includes('코멘트') || comment.type === 'opinion'
  ) || []
  
  console.log('OpinionInput - opinions:', opinions)
  console.log('OpinionInput - current_project:', current_project)

  // 로컬 스토리지에서 리액션 데이터 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedReactions = localStorage.getItem(`reactions_${project_id}`)
      if (savedReactions) {
        try {
          setCommentReactions(JSON.parse(savedReactions))
        } catch (err) {
          console.error('Failed to parse reactions from localStorage:', err)
        }
      }
    }
  }, [project_id])

  // 리액션 핸들러
  const handleReaction = (commentId, type) => {
    const key = `${commentId}_${type}`
    const userReactionKey = `user_reaction_${commentId}_${user}`
    
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available')
      return
    }
    
    const currentUserReaction = localStorage.getItem(userReactionKey)
    
    setCommentReactions(prev => {
      const newReactions = { ...prev }
      
      // 이미 같은 리액션을 클릭한 경우 취소
      if (currentUserReaction === type) {
        newReactions[key] = Math.max(0, (newReactions[key] || 0) - 1)
        localStorage.removeItem(userReactionKey)
      } else {
        // 기존 리액션이 있으면 제거
        if (currentUserReaction) {
          const oldKey = `${commentId}_${currentUserReaction}`
          newReactions[oldKey] = Math.max(0, (newReactions[oldKey] || 0) - 1)
        }
        // 새 리액션 추가
        newReactions[key] = (newReactions[key] || 0) + 1
        localStorage.setItem(userReactionKey, type)
      }
      
      // 로컬 스토리지에 저장
      try {
        localStorage.setItem(`reactions_${project_id}`, JSON.stringify(newReactions))
      } catch (err) {
        console.error('Failed to save reactions to localStorage:', err)
      }
      return newReactions
    })
  }

  // 코멘트 타입별 아이콘
  const getCommentIcon = (type) => {
    switch(type) {
      case 'general':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 6H4a2 2 0 00-2 2v8a2 2 0 002 2h2v4l4-4h10a2 2 0 002-2V8a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'question':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9a3 3 0 106 0c0 1.657-1.343 3-3 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
        )
      case 'suggestion':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'issue':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
        )
      case 'praise':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  // 코멘트 타입별 색상
  const getCommentTypeColor = (type) => {
    switch(type) {
      case 'general': return '#6c757d'
      case 'question': return '#17a2b8'
      case 'suggestion': return '#ffc107'
      case 'issue': return '#dc3545'
      case 'praise': return '#28a745'
      default: return '#6c757d'
    }
  }

  return (
    <div className="opinion-input-container">
      <div className="opinion-input-area">
        <div className="comment-type-selector">
          <select 
            value={commentType} 
            onChange={(e) => setCommentType(e.target.value)}
            className="comment-type-select"
          >
            {commentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} 코멘트
              </option>
            ))}
          </select>
        </div>
        
        <textarea
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="프로젝트에 대한 전반적인 의견을 작성해주세요.&#10;&#10;개선사항, 좋았던 점, 추가 요청사항 등 자유롭게 의견을 남겨주세요."
          maxLength={500}
          className="opinion-textarea"
          autoFocus
        />
        
        <div className="button-area">
          <span className={`char-count ${opinion.length > 450 ? 'warning' : ''}`}>
            {opinion.length} / 500
          </span>
          <button 
            onClick={handleSubmit}
            disabled={submitting || !opinion.trim()}
            className="submit-button"
          >
            {submitting ? '등록 중...' : '코멘트 등록'}
          </button>
        </div>
      </div>

      {/* 코멘트 목록 표시 */}
      {opinions.length > 0 && (
        <div className="opinions-list" style={{ marginTop: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
            등록된 코멘트 ({opinions.length})
          </h4>
          {opinions.map((comment, index) => {
            const commentTypeValue = comment.comment_type || 'general'
            const typeIcon = getCommentIcon(commentTypeValue)
            const typeColor = getCommentTypeColor(commentTypeValue)
            const typeLabel = commentTypes.find(t => t.value === commentTypeValue)?.label || '일반'
            
            return (
              <div key={comment.id || index} style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #e9ecef',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* 코멘트 타입 아이콘 */}
                  <div style={{
                    minWidth: '32px',
                    height: '32px',
                    backgroundColor: `${typeColor}20`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: typeColor
                  }}>
                    {typeIcon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: typeColor,
                          backgroundColor: `${typeColor}10`,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {typeLabel}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          {comment.nickname || '익명'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#adb5bd' }}>
                        {new Date(comment.created).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    
                    <p style={{ 
                      margin: '0',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#495057',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {comment.text || comment.comment || comment.contents}
                    </p>
                    
                    {/* 리액션 버튼들 */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '12px'
                    }}>
                      <button
                        onClick={() => handleReaction(comment.id, 'like')}
                        style={{
                          background: 'white',
                          border: '1px solid #e9ecef',
                          borderRadius: '16px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        👍 {commentReactions[`${comment.id}_like`] || 0}
                      </button>
                      <button
                        onClick={() => handleReaction(comment.id, 'love')}
                        style={{
                          background: 'white',
                          border: '1px solid #e9ecef',
                          borderRadius: '16px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❤️ {commentReactions[`${comment.id}_love`] || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
