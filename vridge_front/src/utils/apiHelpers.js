import axios from '../config/axios';
import { apiRequest, handleFormValidationError } from './errorHandler';

// API 헬퍼 함수들 - 에러 핸들링이 통합된 버전

/**
 * GET 요청을 위한 헬퍼 함수
 * @param {string} url - 요청 URL
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiGet = async (url, options = {}) => {
  return apiRequest(
    () => axios.get(url, options.config),
    {
      showNotification: options.showError !== false,
      onRetry: options.onRetry,
      ...options.errorHandling
    }
  );
};

/**
 * POST 요청을 위한 헬퍼 함수
 * @param {string} url - 요청 URL
 * @param {object} data - 전송할 데이터
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiPost = async (url, data, options = {}) => {
  return apiRequest(
    () => axios.post(url, data, options.config),
    {
      showNotification: options.showError !== false,
      onRetry: options.onRetry,
      ...options.errorHandling
    }
  );
};

/**
 * PUT 요청을 위한 헬퍼 함수
 * @param {string} url - 요청 URL
 * @param {object} data - 전송할 데이터
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiPut = async (url, data, options = {}) => {
  return apiRequest(
    () => axios.put(url, data, options.config),
    {
      showNotification: options.showError !== false,
      onRetry: options.onRetry,
      ...options.errorHandling
    }
  );
};

/**
 * DELETE 요청을 위한 헬퍼 함수
 * @param {string} url - 요청 URL
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiDelete = async (url, options = {}) => {
  return apiRequest(
    () => axios.delete(url, options.config),
    {
      showNotification: options.showError !== false,
      onRetry: options.onRetry,
      ...options.errorHandling
    }
  );
};

/**
 * 파일 업로드를 위한 헬퍼 함수
 * @param {string} url - 업로드 URL
 * @param {File|FormData} file - 업로드할 파일
 * @param {function} onProgress - 진행 상황 콜백
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiUpload = async (url, file, onProgress, options = {}) => {
  const formData = file instanceof FormData ? file : new FormData();
  if (!(file instanceof FormData)) {
    formData.append('file', file);
  }
  
  return apiRequest(
    () => axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
      ...options.config
    }),
    {
      showNotification: options.showError !== false,
      defaultMessage: '파일 업로드 중 오류가 발생했습니다.',
      ...options.errorHandling
    }
  );
};

/**
 * 폼 제출을 위한 헬퍼 함수 (검증 에러 처리 포함)
 * @param {string} url - 제출 URL
 * @param {object} formData - 폼 데이터
 * @param {React.RefObject} formRef - 폼 참조 (검증 에러 시 포커스용)
 * @param {object} options - 추가 옵션
 * @returns {Promise} API 응답
 */
export const apiSubmitForm = async (url, formData, formRef, options = {}) => {
  try {
    const response = await apiPost(url, formData, {
      ...options,
      showError: false // 폼 에러는 커스텀 처리
    });
    return response;
  } catch (error) {
    // 검증 에러인 경우 특별 처리
    if (error.response?.status === 400 && error.response?.data?.errors) {
      handleFormValidationError(error.response.data.errors, formRef);
      throw error;
    }
    
    // 기타 에러는 일반 처리
    throw error;
  }
};

/**
 * 페이지네이션 데이터 가져오기
 * @param {string} url - 기본 URL
 * @param {object} params - 쿼리 파라미터 (page, limit, search 등)
 * @param {object} options - 추가 옵션
 * @returns {Promise} 페이지네이션 응답
 */
export const apiGetPaginated = async (url, params = {}, options = {}) => {
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...params
  });
  
  return apiGet(`${url}?${queryParams}`, options);
};

/**
 * 무한 스크롤을 위한 데이터 가져오기
 * @param {string} url - 기본 URL
 * @param {string} nextCursor - 다음 페이지 커서
 * @param {object} options - 추가 옵션
 * @returns {Promise} 커서 기반 페이지네이션 응답
 */
export const apiGetInfinite = async (url, nextCursor = null, options = {}) => {
  const queryParams = new URLSearchParams();
  if (nextCursor) {
    queryParams.append('cursor', nextCursor);
  }
  
  const fullUrl = nextCursor ? `${url}?${queryParams}` : url;
  return apiGet(fullUrl, options);
};

/**
 * 재시도 로직이 포함된 API 요청
 * @param {function} requestFn - 요청 함수
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} retryDelay - 재시도 지연 시간 (ms)
 * @returns {Promise} API 응답
 */
export const apiWithRetry = async (requestFn, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // 재시도 불가능한 에러는 바로 throw
      if (error.response?.status < 500) {
        throw error;
      }
      
      // 마지막 시도였다면 에러 throw
      if (i === maxRetries) {
        throw error;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
    }
  }
  
  throw lastError;
};

// 자주 사용되는 API 엔드포인트들
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/users/signin/',
    LOGOUT: '/users/logout/',
    SIGNUP: '/users/signup/',
    RESET_PASSWORD: '/users/reset-password/',
    VERIFY_EMAIL: '/users/verify-email/',
  },
  
  // 사용자
  USER: {
    PROFILE: '/users/profile/',
    UPDATE_PROFILE: '/users/profile/update/',
    CHANGE_PASSWORD: '/users/change-password/',
  },
  
  // 프로젝트
  PROJECT: {
    LIST: '/projects/',
    CREATE: '/projects/create/',
    DETAIL: (id) => `/projects/${id}/`,
    UPDATE: (id) => `/projects/${id}/update/`,
    DELETE: (id) => `/projects/${id}/delete/`,
  },
  
  // 피드백
  FEEDBACK: {
    LIST: (projectId) => `/projects/${projectId}/feedbacks/`,
    CREATE: (projectId) => `/projects/${projectId}/feedbacks/create/`,
    UPDATE: (projectId, feedbackId) => `/projects/${projectId}/feedbacks/${feedbackId}/update/`,
    DELETE: (projectId, feedbackId) => `/projects/${projectId}/feedbacks/${feedbackId}/delete/`,
  },
  
  // 비디오 기획
  VIDEO_PLANNING: {
    GENERATE: '/video-planning/generate/',
    UPDATE: (id) => `/video-planning/${id}/update/`,
    EXPORT_PDF: (id) => `/video-planning/${id}/export-pdf/`,
  }
};

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
  apiSubmitForm,
  apiGetPaginated,
  apiGetInfinite,
  apiWithRetry,
  API_ENDPOINTS
};