import React, { useState, useEffect } from 'react';
import { UnifiedButton } from '../../components/unified/UnifiedButton';

import { useSelector } from 'react-redux';
import { CreateFeedback } from '../../api/feedback';

export default function OpinionInput({ project_id, current_project, refetch }) {
  const { user } = useSelector((s) => s.ProjectStore);
  const [opinion, setOpinion] = useState('');
  const [commentType, setCommentType] = useState('general'); // 기본값: 일반
  const [submitting, setSubmitting] = useState(false);
  const [commentReactions, setCommentReactions] = useState({}); // 코멘트별 리액션 상태

  // 현재 사용자 정보 가져오기
  const userInfo = current_project?.member_list?.find((m) => m.email === user) || (
  current_project?.owner_email === user ? { email: user, nickname: current_project?.owner_nickname } : null);

  // 코멘트 종류 옵션
  const commentTypes = [
  { value: 'general', label: '일반' },
  { value: 'question', label: '질문' },
  { value: 'suggestion', label: '제안' },
  { value: 'issue', label: '문제점' },
  { value: 'praise', label: '칭찬' }];

  const handleSubmit = async () => {
    const trimmedOpinion = opinion.trim();
    if (!trimmedOpinion) {
      window.alert('코멘트를 입력해주세요.');
      return;
    }

    if (trimmedOpinion.length > 500) {
      window.alert('코멘트는 500자 이내로 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // API 호출로 의견 저장
      await CreateFeedback({
        section: `${commentTypes.find((t) => t.value === commentType).label} 코멘트`, // 코멘트 타입 포함
        comment: trimmedOpinion,
        type: 'opinion', // 의견 타입 추가
        comment_type: commentType, // 세부 코멘트 타입
        contents: trimmedOpinion, // contents 필드 추가
        title: '', // 빈 제목
        secret: false, // 기본값
        display_mode: 'anonymous' // 익명 모드 추가
      }, project_id);

      // 입력 필드 초기화
      setOpinion('');

      // 부모 컴포넌트 리페치
      if (refetch) {
        refetch();
      }

      window.alert('코멘트가 등록되었습니다.');
    } catch (error) {
      
      let errorMessage = '코멘트 등록에 실패했습니다. 다시 시도해주세요.';

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response && error.response.status) {
        switch (error.response.status) {
          case 401:
            errorMessage = '로그인이 필요합니다.';
            break;
          case 403:
            errorMessage = '권한이 없습니다.';
            break;
          case 404:
            errorMessage = '프로젝트를 찾을 수 없습니다.';
            break;
          case 500:
            errorMessage = '서버 오류가 발생했습니다.';
            break;
        }
      }

      window.alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 현재 프로젝트의 피드백 코멘트 표시
  const opinions = current_project?.feedback?.filter(
    (comment) => comment.section?.includes('코멘트') || comment.type === 'opinion'
  ) || [];

  // 로컬 스토리지에서 리액션 데이터 불러오기
  useEffect(() => {
    const savedReactions = typeof window !== 'undefined' && localStorage.getItem(`reactions_${project_id}`);
    if (savedReactions) {
      setCommentReactions(JSON.parse(savedReactions));
    }
  }, [project_id]);

  // 리액션 핸들러
  const handleReaction = (commentId, type) => {
    const key = `${commentId}_${type}`;
    const userReactionKey = `user_reaction_${commentId}_${user}`;
    const currentUserReaction = typeof window !== 'undefined' && localStorage.getItem(userReactionKey);

    setCommentReactions((prev) => {
      const newReactions = { ...prev };

      // 이미 같은 리액션을 클릭한 경우 취소
      if (currentUserReaction === type) {
        newReactions[key] = Math.max(0, (newReactions[key] || 0) - 1);
        typeof window !== 'undefined' && localStorage.removeItem(userReactionKey);
      } else {
        // 기존 리액션이 있으면 제거
        if (currentUserReaction) {
          const oldKey = `${commentId}_${currentUserReaction}`;
          newReactions[oldKey] = Math.max(0, (newReactions[oldKey] || 0) - 1);
        }
        // 새 리액션 추가
        newReactions[key] = (newReactions[key] || 0) + 1;
        typeof window !== 'undefined' && localStorage.setItem(userReactionKey, type);
      }

      // 로컬 스토리지에 저장
      typeof window !== 'undefined' && localStorage.setItem(`reactions_${project_id}`, JSON.stringify(newReactions));
      return newReactions;
    });
  };

  // 코멘트 타입별 아이콘
  const getCommentIcon = (type) => {
    switch (type) {
      case 'general':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 6H4a2 2 0 00-2 2v8a2 2 0 002 2h2v4l4-4h10a2 2 0 002-2V8a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" />
          </svg>);

      case 'question':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M9 9a3 3 0 106 0c0 1.657-1.343 3-3 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>);

      case 'suggestion':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>);

      case 'issue':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>);

      case 'praise':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>);

      default:
        return null;
    }
  };

  // 코멘트 타입별 색상
  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'general':return '#6c757d';
      case 'question':return '#17a2b8';
      case 'suggestion':return '#ffc107';
      case 'issue':return '#dc3545';
      case 'praise':return '#28a745';
      default:return '#6c757d';
    }
  };

  return (
    <div className="opinion-input-container">
      <div className="opinion-input-section">
        <div className="opinion-input-header">
          <h3 className="section-title">코멘트 작성</h3>
          <p className="section-description">프로젝트에 대한 의견을 자유롭게 남겨주세요</p>
        </div>
        
        <div className="opinion-input-area">
          <div className="comment-type-selector">
            <div className="type-buttons">
              {commentTypes.map((type) =>
              <UnifiedButton
                key={type.value}
                onClick={() => setCommentType(type.value)} type="button" aria-label="클릭"
                className={`type-button ${commentType === type.value ? 'active' : ''}`}
                style={{
                  '--type-color': getCommentTypeColor(type.value),
                  borderColor: commentType === type.value ? getCommentTypeColor(type.value) : '#e9ecef',
                  backgroundColor: commentType === type.value ? `${getCommentTypeColor(type.value)}10` : 'white',
                  color: commentType === type.value ? getCommentTypeColor(type.value) : '#6c757d'
                }}>

                  <span className="type-icon">{getCommentIcon(type.value)}</span>
                  <span className="type-label">{type.label}</span>
                </UnifiedButton>
              )}
            </div>
          </div>
          
          <div className="input-wrapper">
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`${commentTypes.find((t) => t.value === commentType)?.label || '일반'} 코멘트를 작성해주세요...`}
              maxLength={500}
              className="opinion-textarea"
              autoFocus />

            <div className="input-footer">
              <div className="input-info">
                <span className={`char-count ${opinion.length > 450 ? 'warning' : ''}`}>
                  {opinion.length}/500
                </span>
                <span className="info-text">Shift + Enter로 줄바꿈</span>
              </div>
              <Button onClick={handleSubmit} disabled aria-label="Click">
                {submitting ?
                <>
                    <span className="spinner"></span>
                    등록 중
                  </> :

                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    등록
                  </>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 코멘트 목록 표시 */}
      {opinions.length > 0 &&
      <div className="opinions-list">
          <div className="list-header">
            <h3 className="list-title">등록된 코멘트</h3>
            <span className="comment-count">{opinions.length}개</span>
          </div>
          
          <div className="comments-container">
            {opinions.map((comment, index) => {
            const commentTypeValue = comment.comment_type || 'general';
            const typeIcon = getCommentIcon(commentTypeValue);
            const typeColor = getCommentTypeColor(commentTypeValue);
            const typeLabel = commentTypes.find((t) => t.value === commentTypeValue)?.label || '일반';
            const userReactionKey = `user_reaction_${comment.id}_${user}`;
            const currentUserReaction = typeof window !== 'undefined' && localStorage.getItem(userReactionKey);

            return (
              <div key={comment.id || index} className="comment-item">
                  <div className="comment-type-indicator" style={{ backgroundColor: typeColor }}></div>
                  
                  <div className="comment-content">
                    <div className="comment-header">
                      <div className="comment-meta">
                        <span className="comment-type-badge" style={{ color: typeColor, backgroundColor: `${typeColor}10` }}>
                          {typeIcon}
                          <span>{typeLabel}</span>
                        </span>
                        <span className="comment-author">{comment.nickname || '익명'}</span>
                      </div>
                      <time className="comment-time">
                        {new Date(comment.created).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      </time>
                    </div>
                    
                    <p className="comment-text">
                      {comment.text || comment.comment || comment.contents}
                    </p>
                    
                    <div className="comment-actions">
                      <UnifiedButton
                      onClick={() => handleReaction(comment.id, 'like')} type="button" aria-label="클릭"
                      className={`reaction-button ${currentUserReaction === 'like' ? 'active' : ''}`}>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{commentReactions[`${comment.id}_like`] || 0}</span>
                      </UnifiedButton>
                      
                      <UnifiedButton
                      onClick={() => handleReaction(comment.id, 'love')} type="button" aria-label="클릭"
                      className={`reaction-button ${currentUserReaction === 'love' ? 'active' : ''}`}>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{commentReactions[`${comment.id}_love`] || 0}</span>
                      </UnifiedButton>
                    </div>
                  </div>
                </div>);

          })}
          </div>
        </div>
      }
    </div>);

}
import { Button } from '../../components/unified/Button';