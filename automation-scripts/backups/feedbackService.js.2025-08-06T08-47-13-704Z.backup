import { 
  GetFeedBack, 
  CreateFeedback, 
  DeleteFeedback, 
  UpdateFeedback, 
  UpdateFeedbackReaction,
  GetFeedbackDetail 
} from '../api/feedback'

/**
 * 피드백 서비스 - 모든 피드백 관련 API 호출을 중앙 관리
 */
class FeedbackService {
  /**
   * 프로젝트의 모든 피드백 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Array>} 피드백 배열
   */
  async getFeedbacks(projectId) {
    try {
      const response = await GetFeedBack(projectId)
      return response.data?.result?.feedback || []
    } catch (error) {
      console.error('[FeedbackService] Failed to get feedbacks:', error)
      throw error
    }
  }

  /**
   * 피드백 생성
   * @param {Object} feedbackData - 피드백 데이터
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 생성된 피드백
   */
  async createFeedback(feedbackData, projectId) {
    try {
      const response = await CreateFeedback(feedbackData, projectId)
      return response.data?.result
    } catch (error) {
      console.error('[FeedbackService] Failed to create feedback:', error)
      throw error
    }
  }

  /**
   * 피드백 수정
   * @param {string} feedbackId - 피드백 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object>} 수정된 피드백
   */
  async updateFeedback(feedbackId, updateData) {
    try {
      const response = await UpdateFeedback(feedbackId, updateData)
      return response.data?.result
    } catch (error) {
      console.error('[FeedbackService] Failed to update feedback:', error)
      throw error
    }
  }

  /**
   * 피드백 삭제
   * @param {string} feedbackId - 피드백 ID
   * @returns {Promise<void>}
   */
  async deleteFeedback(feedbackId) {
    try {
      await DeleteFeedback(feedbackId)
    } catch (error) {
      console.error('[FeedbackService] Failed to delete feedback:', error)
      throw error
    }
  }

  /**
   * 피드백 반응 업데이트
   * @param {string} feedbackId - 피드백 ID
   * @param {string|null} reaction - 반응 타입 (like, dislike, needExplanation, null)
   * @returns {Promise<Object>} 업데이트된 반응 정보
   */
  async updateReaction(feedbackId, reaction) {
    try {
      const response = await UpdateFeedbackReaction(feedbackId, reaction)
      return response.data?.result
    } catch (error) {
      console.error('[FeedbackService] Failed to update reaction:', error)
      throw error
    }
  }

  /**
   * 피드백 상세 정보 조회
   * @param {string} feedbackId - 피드백 ID
   * @returns {Promise<Object>} 피드백 상세 정보
   */
  async getFeedbackDetail(feedbackId) {
    try {
      const response = await GetFeedbackDetail(feedbackId)
      return response.data?.result
    } catch (error) {
      console.error('[FeedbackService] Failed to get feedback detail:', error)
      throw error
    }
  }

  /**
   * 피드백 일괄 처리
   * @param {Array<string>} feedbackIds - 피드백 ID 배열
   * @param {string} action - 수행할 작업 (delete, complete, pending)
   * @returns {Promise<void>}
   */
  async bulkAction(feedbackIds, action) {
    try {
      const promises = feedbackIds.map(id => {
        switch (action) {
          case 'delete':
            return this.deleteFeedback(id)
          case 'complete':
            return this.updateFeedback(id, { status: 'completed' })
          case 'pending':
            return this.updateFeedback(id, { status: 'pending' })
          default:
            throw new Error(`Unknown bulk action: ${action}`)
        }
      })
      
      await Promise.all(promises)
    } catch (error) {
      console.error('[FeedbackService] Failed to perform bulk action:', error)
      throw error
    }
  }

  /**
   * 피드백 통계 계산
   * @param {Array} feedbacks - 피드백 배열
   * @returns {Object} 통계 정보
   */
  calculateStats(feedbacks) {
    const stats = {
      total: feedbacks.length,
      pending: 0,
      completed: 0,
      withTime: 0,
      anonymous: 0,
      reactions: {
        like: 0,
        dislike: 0,
        needExplanation: 0
      }
    }

    feedbacks.forEach(feedback => {
      // 상태별 카운트
      if (feedback.status === 'completed') {
        stats.completed++
      } else {
        stats.pending++
      }

      // 시간 정보 있는 피드백
      if (feedback.time_at) {
        stats.withTime++
      }

      // 익명 피드백
      if (feedback.secret || !feedback.nickname) {
        stats.anonymous++
      }

      // 반응 카운트
      if (feedback.reaction_counts) {
        stats.reactions.like += feedback.reaction_counts.like || 0
        stats.reactions.dislike += feedback.reaction_counts.dislike || 0
        stats.reactions.needExplanation += feedback.reaction_counts.needExplanation || 0
      }
    })

    return stats
  }
}

export default new FeedbackService()