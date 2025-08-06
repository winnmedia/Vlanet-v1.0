import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import feedbackService from '../services/feedbackService'
import { FEEDBACK_EVENTS, FEEDBACK_ERROR_MESSAGES, FEEDBACK_SUCCESS_MESSAGES } from '../constants/feedback'
import { toast } from 'react-toastify'
import { useCallback, useContext, useEffect, useState } from 'react'

const FeedbackContext = createContext()

export const useFeedbackContext = () => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedbackContext must be used within FeedbackProvider')
  }
  return context
}

export const FeedbackProvider = ({ children, projectId }) => {
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [stats, setStats] = useState(null)

  // 피드백 목록 불러오기
  const loadFeedbacks = useCallback(async () => {
    if (!projectId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const feedbackList = await feedbackService.getFeedbacks(projectId)
      setFeedbacks(feedbackList)
      
      // 통계 계산
      const calculatedStats = feedbackService.calculateStats(feedbackList)
      setStats(calculatedStats)
      
      return feedbackList
    } catch (err) {
      setError(FEEDBACK_ERROR_MESSAGES.LOAD_FAILED)
      console.error('Failed to load feedbacks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // 피드백 생성
  const createFeedback = useCallback(async (feedbackData) => {
    try {
      const newFeedback = await feedbackService.createFeedback(feedbackData, projectId)
      
      // 로컬 상태 업데이트
      setFeedbacks(prev => [newFeedback, ...prev])
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent(FEEDBACK_EVENTS.CREATED, { detail: newFeedback }))
      
      toast.success(FEEDBACK_SUCCESS_MESSAGES.CREATED)
      return newFeedback
    } catch (err) {
      toast.error(FEEDBACK_ERROR_MESSAGES.CREATE_FAILED)
      throw err
    }
  }, [projectId])

  // 피드백 수정
  const updateFeedback = useCallback(async (feedbackId, updateData) => {
    try {
      const updatedFeedback = await feedbackService.updateFeedback(feedbackId, updateData)
      
      // 로컬 상태 업데이트
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, ...updatedFeedback } : f
      ))
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent(FEEDBACK_EVENTS.UPDATED, { detail: updatedFeedback }))
      
      toast.success(FEEDBACK_SUCCESS_MESSAGES.UPDATED)
      return updatedFeedback
    } catch (err) {
      toast.error(FEEDBACK_ERROR_MESSAGES.UPDATE_FAILED)
      throw err
    }
  }, [])

  // 피드백 삭제
  const deleteFeedback = useCallback(async (feedbackId) => {
    if (!window.confirm(FEEDBACK_CONFIRM_MESSAGES.DELETE)) return
    
    try {
      await feedbackService.deleteFeedback(feedbackId)
      
      // 로컬 상태 업데이트
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId))
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent(FEEDBACK_EVENTS.DELETED, { detail: feedbackId }))
      
      toast.success(FEEDBACK_SUCCESS_MESSAGES.DELETED)
    } catch (err) {
      toast.error(FEEDBACK_ERROR_MESSAGES.DELETE_FAILED)
      throw err
    }
  }, [])

  // 반응 업데이트
  const updateReaction = useCallback(async (feedbackId, reaction) => {
    try {
      const result = await feedbackService.updateReaction(feedbackId, reaction)
      
      // 로컬 상태 업데이트
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId 
          ? { 
              ...f, 
              reaction, 
              reaction_counts: result.reaction_counts 
            } 
          : f
      ))
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent(FEEDBACK_EVENTS.REACTION_CHANGED, { 
        detail: { feedbackId, reaction, counts: result.reaction_counts } 
      }))
      
      return result
    } catch (err) {
      toast.error(FEEDBACK_ERROR_MESSAGES.REACTION_FAILED)
      throw err
    }
  }, [])

  // 상태 변경
  const updateStatus = useCallback(async (feedbackId, status) => {
    try {
      await updateFeedback(feedbackId, { status })
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent(FEEDBACK_EVENTS.STATUS_CHANGED, { 
        detail: { feedbackId, status } 
      }))
      
      toast.success(FEEDBACK_SUCCESS_MESSAGES.STATUS_UPDATED)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }, [updateFeedback])

  // 일괄 처리
  const bulkAction = useCallback(async (feedbackIds, action) => {
    const confirmMessage = action === 'delete' 
      ? FEEDBACK_CONFIRM_MESSAGES.BULK_DELETE
      : `선택한 피드백을 ${action === 'complete' ? '완료' : '대기'} 처리하시겠습니까?`
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      await feedbackService.bulkAction(feedbackIds, action)
      
      // 로컬 상태 업데이트
      if (action === 'delete') {
        setFeedbacks(prev => prev.filter(f => !feedbackIds.includes(f.id)))
        toast.success(FEEDBACK_SUCCESS_MESSAGES.BULK_DELETED)
      } else {
        const newStatus = action === 'complete' ? 'completed' : 'pending'
        setFeedbacks(prev => prev.map(f => 
          feedbackIds.includes(f.id) ? { ...f, status: newStatus } : f
        ))
        toast.success(FEEDBACK_SUCCESS_MESSAGES.BULK_COMPLETED)
      }
    } catch (err) {
      toast.error('일괄 처리에 실패했습니다.')
      throw err
    }
  }, [])

  // 프로젝트 변경 시 피드백 다시 로드
  useEffect(() => {
    if (projectId) {
      loadFeedbacks()
    } else {
      setFeedbacks([])
      setStats(null)
    }
  }, [projectId, loadFeedbacks])

  const value = {
    feedbacks,
    isLoading,
    error,
    selectedFeedback,
    stats,
    setSelectedFeedback,
    loadFeedbacks,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    updateReaction,
    updateStatus,
    bulkAction,
    refresh: loadFeedbacks
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  )
}