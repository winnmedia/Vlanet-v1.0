import { toast } from 'react-toastify'
import { message } from 'antd'

// API 에러 메시지 매핑
const ERROR_MESSAGES = {
  400: '잘못된 요청입니다. 입력값을 확인해주세요.',
  401: '인증이 필요합니다. 다시 로그인해주세요.',
  403: '권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '중복된 데이터가 있습니다.',
  413: '파일 크기가 너무 큽니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버에 연결할 수 없습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
}

// 네트워크 에러 메시지
const NETWORK_ERROR_MESSAGE = '네트워크 연결을 확인해주세요.'

// API 에러 핸들러
export function handleApiError(error, customMessages = {}) {
  console.error('API Error:', error)
  
  // 네트워크 에러
  if (!error.response) {
    toast.error(NETWORK_ERROR_MESSAGE)
    return { error: NETWORK_ERROR_MESSAGE, originalError: error }
  }
  
  const status = error.response?.status
  const serverMessage = error.response?.data?.message || error.response?.data?.error
  
  // 커스텀 메시지가 있으면 우선 사용
  if (customMessages[status]) {
    toast.error(customMessages[status])
    return { error: customMessages[status], originalError: error }
  }
  
  // 서버에서 전달한 메시지가 있으면 사용
  if (serverMessage) {
    toast.error(serverMessage)
    return { error: serverMessage, originalError: error }
  }
  
  // 기본 에러 메시지 사용
  const defaultMessage = ERROR_MESSAGES[status] || '알 수 없는 오류가 발생했습니다.'
  toast.error(defaultMessage)
  
  return { error: defaultMessage, originalError: error }
}

// 로그인 필요 여부 확인
export function isAuthError(error) {
  return error.response?.status === 401
}

// 권한 오류 확인  
export function isPermissionError(error) {
  return error.response?.status === 403
}

// 중복 오류 확인
export function isDuplicateError(error) {
  return error.response?.status === 409
}

// API 래퍼 함수 - 자동 에러 처리
export async function apiCall(apiFunction, ...args) {
  try {
    const response = await apiFunction(...args)
    return { data: response.data, error: null }
  } catch (error) {
    return { data: null, ...handleApiError(error) }
  }
}

// Promise 체인용 에러 핸들러
export function catchApiError(customMessages = {}) {
  return (error) => {
    handleApiError(error, customMessages)
    throw error // 체인 계속 전파
  }
}