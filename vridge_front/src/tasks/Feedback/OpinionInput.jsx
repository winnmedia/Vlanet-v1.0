import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CreateFeedback } from 'api/feedback'
import 'css/Cms/OpinionInputSimple.scss'

export default function OpinionInput({ project_id, current_project, refetch }) {
  const { user } = useSelector((s) => s.ProjectStore)
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
      window.alert('코멘트를 입력해주세요.')
      return
    }

    if (trimmedOpinion.length > 500) {
      window.alert('코멘트는 500자 이내로 입력해주세요.')
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
      
      window.alert('코멘트가 등록되었습니다.')
    } catch (error) {
      console.error('코멘트 등록 실패:', error)
      window.alert('코멘트 등록에 실패했습니다. 다시 시도해주세요.')
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
    const savedReactions = localStorage.getItem(`reactions_${project_id}`)
    if (savedReactions) {
      setCommentReactions(JSON.parse(savedReactions))
    }
  }, [project_id])

  // 리액션 핸들러
  const handleReaction = (commentId, type) => {
    const key = `${commentId}_${type}`
    const userReactionKey = `user_reaction_${commentId}_${user}`
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
      localStorage.setItem(`reactions_${project_id}`, JSON.stringify(newReactions))
      return newReactions
    })
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
    </div>
  )
}