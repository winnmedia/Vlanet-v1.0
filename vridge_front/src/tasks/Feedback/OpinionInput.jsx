import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CreateFeedback, GetFeedBack } from 'api/feedback'

export default function OpinionInput({ project_id, refetch }) {
  const { user, project_list } = useSelector((s) => s.ProjectStore)
  const [opinion, setOpinion] = useState('')
  const [commentType, setCommentType] = useState('general') // 기본값: 일반
  const [submitting, setSubmitting] = useState(false)
  const [opinions, setOpinions] = useState([]) // 로컬 상태로 의견 목록 관리
  const [loading, setLoading] = useState(true)
  
  // 현재 사용자 정보 가져오기
  const currentProject = project_list?.find(p => p.id === parseInt(project_id))
  const userInfo = currentProject?.member_list?.find(m => m.email === user) || 
                   (currentProject?.owner_email === user ? { email: user, nickname: currentProject.owner_nickname } : null)
  
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
        comment_type: commentType // 세부 코멘트 타입
      }, project_id)

      // 입력 필드 초기화
      setOpinion('')
      
      // 새로운 코멘트를 즉시 추가
      const newComment = {
        id: Date.now(), // 임시 ID
        nickname: userInfo?.nickname || user,
        email: user,
        comment: trimmedOpinion,
        section: `${commentTypes.find(t => t.value === commentType).label} 코멘트`,
        created: new Date().toISOString(),
        type: 'opinion',
        comment_type: commentType
      }
      
      setOpinions(prev => [newComment, ...prev])
      
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

  // 기존 피드백(의견) 목록 가져오기
  useEffect(() => {
    const fetchOpinions = async () => {
      try {
        setLoading(true)
        const response = await GetFeedBack(project_id)
        if (response.data.result && response.data.result.comment_list) {
          // 의견 타입의 피드백만 필터링
          const opinionComments = response.data.result.comment_list.filter(
            comment => comment.section?.includes('코멘트') || comment.type === 'opinion'
          )
          setOpinions(opinionComments)
        }
      } catch (error) {
        console.error('코멘트 목록 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpinions()
  }, [project_id])

  return (
    <div className="opinion-input-container">
      <div className="opinion-header">
        <p className="description">프로젝트에 대한 코멘트를 작성해주세요.</p>
      </div>

      <div className="opinion-list">
        {loading ? (
          <div className="loading-state">
            <p>코멘트를 불러오는 중...</p>
          </div>
        ) : opinions.length > 0 ? (
          <ul>
            {opinions.map((item, index) => (
              <li key={item.id || index} className="opinion-item">
                <div className="opinion-meta">
                  <span className="email">{item.nickname || item.email}</span>
                  {item.section && (
                    <span className="comment-type-badge">{item.section}</span>
                  )}
                  <span className="date">
                    {item.created ? new Date(item.created).toLocaleString('ko-KR') : ''}
                  </span>
                </div>
                <div className="opinion-content">{item.comment}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>아직 작성된 코멘트가 없습니다.</p>
            <p>첫 번째 코멘트를 작성해보세요!</p>
          </div>
        )}
      </div>

      <div className="opinion-input-area">
        <div className="comment-type-selector">
          <label>종류:</label>
          <select 
            value={commentType} 
            onChange={(e) => setCommentType(e.target.value)}
            className="type-select"
          >
            {commentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="코멘트를 입력하세요 (최대 500자)"
          maxLength={500}
          rows={4}
          className="opinion-textarea"
          disabled={submitting}
        />
        <div className="input-footer">
          <span className="char-count">
            {opinion.length} / 500
          </span>
          <button
            onClick={handleSubmit}
            className="submit-btn"
            disabled={submitting || !opinion.trim()}
          >
            {submitting ? '등록 중...' : '코멘트 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}