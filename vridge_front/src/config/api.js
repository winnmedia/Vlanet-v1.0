/**
 * API 설정 파일
 * 환경에 따라 API URL을 자동으로 설정
 */

// API URL 결정 로직
const getApiUrl = () => {
  // 1. 환경변수 우선
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. 운영 환경 체크
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'vlanet.net' || hostname === 'www.vlanet.net') {
      return 'https://videoplanet.up.railway.app';
    }
    
    if (hostname === 'videoplanet-seven.vercel.app') {
      return 'https://videoplanet.up.railway.app';
    }
  }
  
  // 3. 기본값 (로컬 개발)
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();
export const API_BASE_URL = API_URL;

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/api/auth/login/',
  SIGNUP: '/api/auth/signup/',
  REFRESH: '/api/auth/refresh/',
  LOGOUT: '/api/auth/logout/',
  
  // 사용자
  USER_PROFILE: '/api/users/profile/',
  USER_UPDATE: '/api/users/update/',
  
  // 프로젝트
  PROJECTS: '/api/projects/',
  PROJECT_DETAIL: (id) => `/api/projects/${id}/`,
  PROJECT_CREATE: '/api/projects/create/',
  
  // 피드백
  FEEDBACKS: '/api/feedbacks/',
  FEEDBACK_DETAIL: (id) => `/api/feedbacks/${id}/`,
  
  // 비디오 기획
  VIDEO_PLANNING: '/api/video-planning/',
  VIDEO_ANALYSIS: '/api/video-analysis/',
};

// 디버그 로깅
if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('🔧 API Configuration:', {
    API_URL,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production',
  });
}

export default API_URL;