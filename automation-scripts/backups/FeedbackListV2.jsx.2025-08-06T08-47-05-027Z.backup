import React, { useState, useEffect, useCallback, useMemo } from 'react'
import feedbackAPIService from '../../services/feedbackAPIService'
import LoadingSpinner from '../LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Button from '../common/Button'
import { showSuccess, showError, showWarning } from '../Toast'
import { formatDateForGroup } from '../../utils/dateFormatter'
import { isProjectAdmin, getDisplayName } from '../../utils/userPermissions'
import styles from './FeedbackListV2.module.scss'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'

/**
 * 새로운 백엔드 API와 통합된 피드백 목록 컴포넌트
 * 피드백 CRUD 및 메시지 관리 통합
 */
const FeedbackListV2 = ({ 
  projectId, 
  currentUser,
  onFeedbackSelect,
  selectedFeedbackId,
  currentVideoTime = 0,
  videoPlayerRef = null
}) => {
  // 상태 관리
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showNewFeedbackForm, setShowNewFeedbackForm] = useState(false)
  const [newFeedbackData, setNewFeedbackData] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'normal',
    timestamp: 0
  })

  // 피드백 타입 정의
  const feedbackTypes = [
    { value: 'all', label: '전체', color: '#666' },
    { value: 'general', label: '일반', color: '#1631F8' },
    { value: 'technical', label: '기술적', color: '#FFA500' },
    { value: 'creative', label: '창작', color: '#9C27B0' },
    { value: 'praise', label: '칭찬', color: '#4CAF50' },
    { value: 'question', label: '질문', color: '#2196F3' },
    { value: 'urgent', label: '긴급', color: '#F44336' }
  ]

  // 우선순위 정의
  const priorities = [
    { value: 'low', label: '낮음', color: '#9E9E9E' },
    { value: 'normal', label: '보통', color: '#2196F3' },
    { value: 'high', label: '높음', color: '#FF9800' },
    { value: 'urgent', label: '긴급', color: '#F44336' }
  ]

  // 피드백 목록 로드
  const loadFeedbacks = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const result = await feedbackAPIService.getFeedbackList(projectId)
      
      if (result.success) {
        setFeedbacks(result.data)
      } else {
        setError(result.error || '피드백을 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('피드백 로드 오류:', err)
      setError('피드백을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 컴포넌트 마운트 시 피드백 로드
  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  // 새 피드백 생성
  const handleCreateFeedback = useCallback(async () => {
    if (!newFeedbackData.title.trim()) {
      showWarning('피드백 제목을 입력해주세요.')
      return
    }

    try {
      const feedbackData = {
        ...newFeedbackData,
        timestamp: currentVideoTime || 0
      }

      const result = await feedbackAPIService.createFeedback(projectId, feedbackData)
      
      if (result.success) {
        showSuccess('피드백이 생성되었습니다.')
        setShowNewFeedbackForm(false)
        setNewFeedbackData({
          title: '',
          description: '',
          type: 'general',
          priority: 'normal',
          timestamp: 0
        })
        await loadFeedbacks()
      } else {
        showError(result.error || '피드백 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('피드백 생성 오류:', err)
      showError('피드백 생성 중 오류가 발생했습니다.')
    }
  }, [newFeedbackData, currentVideoTime, projectId, loadFeedbacks])

  // 피드백 수정
  const handleUpdateFeedback = useCallback(async (feedbackId) => {
    if (!editContent.trim()) {
      showWarning('수정할 내용을 입력해주세요.')
      return
    }

    try {
      const result = await feedbackAPIService.updateFeedback(feedbackId, {
        description: editContent
      })
      
      if (result.success) {
        showSuccess('피드백이 수정되었습니다.')
        setEditingId(null)
        setEditContent('')
        await loadFeedbacks()
      } else {
        showError(result.error || '피드백 수정에 실패했습니다.')
      }
    } catch (err) {
      console.error('피드백 수정 오류:', err)
      showError('피드백 수정 중 오류가 발생했습니다.')
    }
  }, [editContent, loadFeedbacks])

  // 피드백 삭제
  const handleDeleteFeedback = useCallback(async (feedbackId) => {
    if (!window.confirm('정말로 이 피드백을 삭제하시겠습니까?')) {
      return
    }

    try {
      const result = await feedbackAPIService.deleteFeedback(feedbackId)
      
      if (result.success) {
        showSuccess('피드백이 삭제되었습니다.')
        await loadFeedbacks()
      } else {
        showError(result.error || '피드백 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('피드백 삭제 오류:', err)
      showError('피드백 삭제 중 오류가 발생했습니다.')
    }
  }, [loadFeedbacks])

  // 피드백 선택 및 비디오 시간 이동
  const handleSelectFeedback = useCallback((feedback) => {
    if (onFeedbackSelect) {
      onFeedbackSelect(feedback)
    }

    // 비디오 플레이어로 시간 이동
    if (videoPlayerRef?.current && feedback.metadata?.timestamp) {
      videoPlayerRef.current.seekTo(feedback.metadata.timestamp)
    }
  }, [onFeedbackSelect, videoPlayerRef])

  // 필터링 및 정렬된 피드백 목록
  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbackAPIService.filterByType(feedbacks, filter)
    filtered = feedbackAPIService.sortFeedbacks(filtered, sortBy)
    return filtered
  }, [feedbacks, filter, sortBy])

  // 타임스탬프별 그룹화
  const groupedFeedbacks = useMemo(() => {
    return feedbackAPIService.groupByTimestamp(filteredFeedbacks)
  }, [filteredFeedbacks])

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 타입별 색상 가져오기
  const getTypeColor = (type) => {
    const typeObj = feedbackTypes.find(t => t.value === type)
    return typeObj?.color || '#666'
  }

  // 우선순위별 색상 가져오기
  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority)
    return priorityObj?.color || '#2196F3'
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon="⚠️"
          title="피드백을 불러올 수 없습니다"
          description={error}
          action={
            <Button onClick={loadFeedbacks} variant="primary">
              다시 시도
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h3 className={styles.title}>피드백 목록</h3>
        <Button
          variant="primary"
          size="small"
          onClick={() => setShowNewFeedbackForm(true)}
        >
          새 피드백
        </Button>
      </div>

      {/* 필터 및 정렬 */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          {feedbackTypes.map(type => (
            <button
              key={type.value}
              className={`${styles.filterBtn} ${filter === type.value ? styles.active : ''}`}
              onClick={() => setFilter(type.value)}
              style={{
                borderColor: filter === type.value ? type.color : 'transparent',
                color: filter === type.value ? type.color : '#666'
              }}
            >
              {type.label}
              {type.value !== 'all' && (
                <span className={styles.count}>
                  {feedbacks.filter(f => f.metadata?.type === type.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <select 
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_at">최신순</option>
          <option value="timestamp">시간순</option>
          <option value="priority">우선순위순</option>
        </select>
      </div>

      {/* 새 피드백 폼 */}
      {showNewFeedbackForm && (
        <div className={styles.newFeedbackForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="피드백 제목"
            value={newFeedbackData.title}
            onChange={(e) => setNewFeedbackData(prev => ({ ...prev, title: e.target.value }))}
          />
          
          <textarea
            className={styles.textarea}
            placeholder="피드백 내용"
            rows="3"
            value={newFeedbackData.description}
            onChange={(e) => setNewFeedbackData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className={styles.formControls}>
            <select
              className={styles.select}
              value={newFeedbackData.type}
              onChange={(e) => setNewFeedbackData(prev => ({ ...prev, type: e.target.value }))}
            >
              {feedbackTypes.filter(t => t.value !== 'all').map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              className={styles.select}
              value={newFeedbackData.priority}
              onChange={(e) => setNewFeedbackData(prev => ({ ...prev, priority: e.target.value }))}
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            <div className={styles.timestamp}>
              <span>타임스탬프: {formatTime(currentVideoTime)}</span>
            </div>

            <div className={styles.formActions}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowNewFeedbackForm(false)
                  setNewFeedbackData({
                    title: '',
                    description: '',
                    type: 'general',
                    priority: 'normal',
                    timestamp: 0
                  })
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleCreateFeedback}
              >
                생성
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 목록 */}
      <div className={styles.feedbackList}>
        {filteredFeedbacks.length === 0 ? (
          <EmptyState
            icon="💬"
            title="피드백이 없습니다"
            description="첫 번째 피드백을 추가해보세요"
          />
        ) : (
          filteredFeedbacks.map(feedback => (
            <div
              key={feedback.id}
              className={`${styles.feedbackItem} ${selectedFeedbackId === feedback.id ? styles.selected : ''}`}
              onClick={() => handleSelectFeedback(feedback)}
            >
              <div className={styles.feedbackHeader}>
                <div className={styles.feedbackMeta}>
                  <span 
                    className={styles.type}
                    style={{ backgroundColor: getTypeColor(feedback.metadata?.type || 'general') }}
                  >
                    {feedbackTypes.find(t => t.value === (feedback.metadata?.type || 'general'))?.label}
                  </span>
                  <span 
                    className={styles.priority}
                    style={{ color: getPriorityColor(feedback.metadata?.priority || 'normal') }}
                  >
                    {priorities.find(p => p.value === (feedback.metadata?.priority || 'normal'))?.label}
                  </span>
                  {feedback.metadata?.timestamp > 0 && (
                    <span className={styles.timestamp}>
                      {formatTime(feedback.metadata.timestamp)}
                    </span>
                  )}
                </div>
                <div className={styles.feedbackActions}>
                  {feedback.created_by === currentUser?.id && (
                    <>
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(feedback.id)
                          setEditContent(feedback.description || '')
                        }}
                      >
                        수정
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFeedback(feedback.id)
                        }}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h4 className={styles.feedbackTitle}>{feedback.title}</h4>

              {editingId === feedback.id ? (
                <div className={styles.editForm}>
                  <textarea
                    className={styles.editTextarea}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={styles.editActions}>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(null)
                        setEditContent('')
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateFeedback(feedback.id)
                      }}
                    >
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={styles.feedbackDescription}>
                  {feedback.description || '설명이 없습니다.'}
                </p>
              )}

              <div className={styles.feedbackFooter}>
                <span className={styles.author}>
                  {getDisplayName(feedback.created_by_info)}
                </span>
                <span className={styles.date}>
                  {formatDateForGroup(feedback.created_at)}
                </span>
                {feedback.messages?.length > 0 && (
                  <span className={styles.messageCount}>
                    메시지 {feedback.messages.length}개
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FeedbackListV2