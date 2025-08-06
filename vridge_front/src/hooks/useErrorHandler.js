import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { message } from 'antd'

/**
 * API 에러 처리를 위한 커스텀 훅
 */
export const useErrorHandler = () => {
  const router = useRouter()

  /**
   * API 에러 핸들러
   * @param {Error} error - 에러 객체
   * @param {Object} options - 옵션
   * @param {boolean} options.showToast - 토스트 메시지 표시 여부 (기본: true)
   * @param {Function} options.onUnauthorized - 401 에러 시 추가 콜백
   * @param {Function} options.onForbidden - 403 에러 시 추가 콜백
   * @param {Function} options.onNotFound - 404 에러 시 추가 콜백
   * @param {string} options.defaultMessage - 기본 에러 메시지
   */
  const handleApiError = useCallback((error, options = {}) => {
    const {
      showToast = true,
      onUnauthorized,
      onForbidden,
      onNotFound,
      defaultMessage = '오류가 발생했습니다.'
    } = options

    console.error('[API Error]', error)

    // 네트워크 에러
    if (!error.response) {
      if (showToast) {
        toast.error('네트워크 연결을 확인해주세요.')
      }
      return
    }

    const { status, data } = error.response
    const message = data?.message || data?.detail || defaultMessage

    switch (status) {
      case 400:
        // Bad Request
        if (showToast) {
          toast.error(message || '잘못된 요청입니다.')
        }
        break

      case 401:
        // Unauthorized
        if (showToast) {
          toast.error('로그인이 필요합니다.')
        }
        // 로그인 페이지로 리다이렉트
        router.push('/login')
        onUnauthorized?.()
        break

      case 403:
        // Forbidden
        if (showToast) {
          toast.error('권한이 없습니다.')
        }
        onForbidden?.()
        break

      case 404:
        // Not Found
        if (showToast) {
          toast.error('요청한 정보를 찾을 수 없습니다.')
        }
        onNotFound?.()
        break

      case 409:
        // Conflict
        if (showToast) {
          toast.error(message || '중복된 데이터가 있습니다.')
        }
        break

      case 422:
        // Unprocessable Entity
        if (showToast) {
          toast.error(message || '입력 데이터를 확인해주세요.')
        }
        break

      case 429:
        // Too Many Requests
        if (showToast) {
          toast.error('너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.')
        }
        break

      case 500:
      case 502:
      case 503:
      case 504:
        // Server Error
        if (showToast) {
          toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        break

      default:
        if (showToast) {
          toast.error(message)
        }
    }
  }, [router])

  /**
   * 에러 메시지 추출
   * @param {Error} error - 에러 객체
   * @returns {string} 에러 메시지
   */
  const getErrorMessage = useCallback((error) => {
    if (!error.response) {
      return '네트워크 연결을 확인해주세요.'
    }

    const { status, data } = error.response
    const message = data?.message || data?.detail

    if (message) {
      return message
    }

    switch (status) {
      case 400:
        return '잘못된 요청입니다.'
      case 401:
        return '로그인이 필요합니다.'
      case 403:
        return '권한이 없습니다.'
      case 404:
        return '요청한 정보를 찾을 수 없습니다.'
      case 409:
        return '중복된 데이터가 있습니다.'
      case 422:
        return '입력 데이터를 확인해주세요.'
      case 429:
        return '너무 많은 요청을 보냈습니다.'
      case 500:
      case 502:
      case 503:
      case 504:
        return '서버 오류가 발생했습니다.'
      default:
        return '오류가 발생했습니다.'
    }
  }, [])

  /**
   * 에러 타입 확인
   * @param {Error} error - 에러 객체
   * @param {number} statusCode - 확인할 상태 코드
   * @returns {boolean}
   */
  const isErrorType = useCallback((error, statusCode) => {
    return error?.response?.status === statusCode
  }, [])

  return {
    handleApiError,
    getErrorMessage,
    isErrorType,
    isUnauthorized: (error) => isErrorType(error, 401),
    isForbidden: (error) => isErrorType(error, 403),
    isNotFound: (error) => isErrorType(error, 404),
    isConflict: (error) => isErrorType(error, 409),
    isServerError: (error) => error?.response?.status >= 500
  }
}