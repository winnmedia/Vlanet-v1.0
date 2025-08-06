import { axiosCredentials } from 'util/util'
import { handleApiError } from '../utils/errorHandler'
import { message } from 'antd'

/**
 * 새로운 백엔드 API와 통합된 피드백 서비스
 * 2025-08-06 작성
 */

class FeedbackAPIService {
  /**
   * 프로젝트별 피드백 목록 조회
   * GET /api/projects/{project_id}/feedbacks/
   */
  async getFeedbackList(projectId) {
    try {
      const response = await axiosCredentials(
        'get',
        `/api/projects/${projectId}/feedbacks/`
      )
      
      // 응답 데이터 정규화
      const feedbacks = response?.data?.results || response?.data || []
      return {
        success: true,
        data: feedbacks,
        count: feedbacks.length
      }
    } catch (error) {
      console.error('피드백 목록 조회 실패:', error)
      handleApiError(error, {
        404: '프로젝트를 찾을 수 없습니다.',
        403: '프로젝트에 접근 권한이 없습니다.',
        500: '서버 오류가 발생했습니다.'
      })
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  /**
   * 피드백 생성
   * POST /api/projects/{project_id}/feedbacks/
   */
  async createFeedback(projectId, feedbackData) {
    try {
      // 백엔드 API 형식에 맞게 데이터 변환
      const requestData = {
        title: feedbackData.title || '피드백',
        video_url: feedbackData.video_url || '',
        video_file: feedbackData.video_file || null,
        status: feedbackData.status || 'pending',
        description: feedbackData.description || '',
        metadata: {
          timestamp: feedbackData.timestamp || 0,
          type: feedbackData.type || 'general',
          priority: feedbackData.priority || 'normal'
        }
      }

      const response = await axiosCredentials(
        'post',
        `/api/projects/${projectId}/feedbacks/`,
        requestData
      )

      return {
        success: true,
        data: response.data,
        message: '피드백이 생성되었습니다.'
      }
    } catch (error) {
      console.error('피드백 생성 실패:', error)
      handleApiError(error, {
        400: '필수 필드가 누락되었습니다.',
        403: '피드백을 생성할 권한이 없습니다.',
        404: '프로젝트를 찾을 수 없습니다.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 피드백 상세 조회
   * GET /api/feedbacks/{feedback_id}/
   */
  async getFeedbackDetail(feedbackId) {
    try {
      const response = await axiosCredentials(
        'get',
        `/api/feedbacks/${feedbackId}/`
      )

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('피드백 상세 조회 실패:', error)
      handleApiError(error, {
        404: '피드백을 찾을 수 없습니다.',
        403: '피드백에 접근 권한이 없습니다.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 피드백 수정
   * PUT /api/feedbacks/{feedback_id}/
   */
  async updateFeedback(feedbackId, updateData) {
    try {
      const response = await axiosCredentials(
        'put',
        `/api/feedbacks/${feedbackId}/`,
        updateData
      )

      return {
        success: true,
        data: response.data,
        message: '피드백이 수정되었습니다.'
      }
    } catch (error) {
      console.error('피드백 수정 실패:', error)
      handleApiError(error, {
        404: '수정할 피드백을 찾을 수 없습니다.',
        403: '자신의 피드백만 수정할 수 있습니다.',
        400: '잘못된 요청입니다.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 피드백 삭제
   * DELETE /api/feedbacks/{feedback_id}/
   */
  async deleteFeedback(feedbackId) {
    try {
      await axiosCredentials(
        'delete',
        `/api/feedbacks/${feedbackId}/`
      )

      return {
        success: true,
        message: '피드백이 삭제되었습니다.'
      }
    } catch (error) {
      console.error('피드백 삭제 실패:', error)
      handleApiError(error, {
        404: '삭제할 피드백을 찾을 수 없습니다.',
        403: '자신의 피드백만 삭제할 수 있습니다.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 피드백에 메시지 추가
   * POST /api/feedbacks/{feedback_id}/messages/
   */
  async addMessage(feedbackId, messageData) {
    try {
      const requestData = {
        content: messageData.content || '',
        timestamp: messageData.timestamp || 0,
        type: messageData.type || 'comment',
        metadata: messageData.metadata || {}
      }

      const response = await axiosCredentials(
        'post',
        `/api/feedbacks/${feedbackId}/messages/`,
        requestData
      )

      return {
        success: true,
        data: response.data,
        message: '메시지가 추가되었습니다.'
      }
    } catch (error) {
      console.error('메시지 추가 실패:', error)
      handleApiError(error, {
        404: '피드백을 찾을 수 없습니다.',
        403: '메시지를 추가할 권한이 없습니다.',
        400: '메시지 내용을 입력해주세요.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 피드백 타입별 필터링
   */
  filterByType(feedbacks, type) {
    if (!type || type === 'all') return feedbacks
    return feedbacks.filter(fb => fb.metadata?.type === type)
  }

  /**
   * 피드백 정렬
   */
  sortFeedbacks(feedbacks, sortBy = 'created_at', order = 'desc') {
    const sorted = [...feedbacks].sort((a, b) => {
      const aValue = a[sortBy] || a.created_at
      const bValue = b[sortBy] || b.created_at
      
      if (order === 'desc') {
        return new Date(bValue) - new Date(aValue)
      } else {
        return new Date(aValue) - new Date(bValue)
      }
    })
    return sorted
  }

  /**
   * 타임스탬프별 피드백 그룹화
   */
  groupByTimestamp(feedbacks) {
    const grouped = {}
    
    feedbacks.forEach(feedback => {
      const messages = feedback.messages || []
      messages.forEach(msg => {
        const timestamp = Math.floor(msg.timestamp || 0)
        if (!grouped[timestamp]) {
          grouped[timestamp] = []
        }
        grouped[timestamp].push({
          ...msg,
          feedbackId: feedback.id,
          feedbackTitle: feedback.title
        })
      })
    })
    
    return grouped
  }

  /**
   * 비디오 파일 업로드
   */
  async uploadVideo(projectId, file, onProgress) {
    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('project_id', projectId)

      const response = await axiosCredentials(
        'post',
        `/api/projects/${projectId}/upload-video/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            if (onProgress) {
              onProgress(percentCompleted)
            }
          }
        }
      )

      return {
        success: true,
        data: response.data,
        message: '비디오가 업로드되었습니다.'
      }
    } catch (error) {
      console.error('비디오 업로드 실패:', error)
      handleApiError(error, {
        413: '파일 크기가 너무 큽니다. 600MB 이하의 파일만 업로드 가능합니다.',
        400: '지원하지 않는 파일 형식입니다.',
        401: '인증이 필요합니다. 다시 로그인해주세요.',
        500: '파일 업로드 중 오류가 발생했습니다.'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 싱글톤 인스턴스 생성
const feedbackAPIService = new FeedbackAPIService()
export default feedbackAPIService