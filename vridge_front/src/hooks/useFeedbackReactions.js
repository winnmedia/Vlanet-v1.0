import { useState, useCallback, useEffect } from 'react'

/**
 * 피드백/코멘트 반응 관리 커스텀 훅
 * @param {string} projectId - 프로젝트 ID
 * @param {string} userId - 사용자 ID/이메일
 * @param {string} storagePrefix - 로컬스토리지 키 접두사
 */
export const useFeedbackReactions = (projectId, userId, storagePrefix = 'feedback_reaction') => {
  const [reactions, setReactions] = useState({})
  const [reactionCounts, setReactionCounts] = useState({})

  // 로컬스토리지에서 반응 데이터 불러오기
  useEffect(() => {
    if (projectId && typeof window !== 'undefined') {
      const savedReactions = localStorage.getItem(`${storagePrefix}_${projectId}`)
      if (savedReactions) {
        try {
          const parsed = JSON.parse(savedReactions)
          setReactionCounts(parsed)
        } catch (e) {
          console.error('Failed to parse saved reactions:', e)
        }
      }
    }
  }, [projectId, storagePrefix])

  // 반응 토글 핸들러
  const handleReaction = useCallback((itemId, reactionType) => {
    if (!userId || !itemId) return

    const key = `${itemId}_${reactionType}`
    const userReactionKey = `user_${storagePrefix}_${itemId}_${userId}`
    const currentUserReaction = typeof window !== 'undefined' && 
      localStorage.getItem(userReactionKey)

    setReactionCounts(prev => {
      const newCounts = { ...prev }
      
      // 현재 카운트 가져오기 (없으면 0)
      if (!newCounts[itemId]) {
        newCounts[itemId] = { like: 0, dislike: 0, needExplanation: 0 }
      }
      
      // 이미 같은 반응을 클릭한 경우 취소
      if (currentUserReaction === reactionType) {
        newCounts[itemId][reactionType] = Math.max(0, newCounts[itemId][reactionType] - 1)
        typeof window !== 'undefined' && localStorage.removeItem(userReactionKey)
      } else {
        // 기존 반응이 있으면 제거
        if (currentUserReaction && newCounts[itemId][currentUserReaction] !== undefined) {
          newCounts[itemId][currentUserReaction] = Math.max(0, newCounts[itemId][currentUserReaction] - 1)
        }
        // 새 반응 추가
        newCounts[itemId][reactionType] = (newCounts[itemId][reactionType] || 0) + 1
        typeof window !== 'undefined' && localStorage.setItem(userReactionKey, reactionType)
      }
      
      // 로컬스토리지에 저장
      if (projectId && typeof window !== 'undefined') {
        localStorage.setItem(`${storagePrefix}_${projectId}`, JSON.stringify(newCounts))
      }
      
      return newCounts
    })

    // 현재 사용자의 반응 상태 업데이트
    setReactions(prev => ({
      ...prev,
      [itemId]: currentUserReaction === reactionType ? null : reactionType
    }))
  }, [projectId, userId, storagePrefix])

  // 사용자의 현재 반응 가져오기
  const getUserReaction = useCallback((itemId) => {
    if (!userId || !itemId || typeof window === 'undefined') return null
    const userReactionKey = `user_${storagePrefix}_${itemId}_${userId}`
    return localStorage.getItem(userReactionKey)
  }, [userId, storagePrefix])

  // 반응 카운트 가져오기
  const getReactionCount = useCallback((itemId, reactionType) => {
    return reactionCounts[itemId]?.[reactionType] || 0
  }, [reactionCounts])

  return {
    reactions,
    reactionCounts,
    handleReaction,
    getUserReaction,
    getReactionCount
  }
}