import axios from 'axios';
import { handleError, ErrorTypes } from '../utils/errorHandler';

// SSR 안전한 환경 설정
const isClient = typeof window !== 'undefined';

// 환경에 따라 API URL 설정
let API_BASE_URL;

// 프로덕션 도메인 체크
const isProduction = isClient && (
  window.location.hostname === 'vlanet.net' || 
  window.location.hostname === 'www.vlanet.net' ||
  window.location.hostname.includes('vercel.app') ||
  window.location.hostname.includes('railway.app')
);

if (isProduction) {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app';
} else if (process.env.NEXT_PUBLIC_API_URL) {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
} else {
  API_BASE_URL = 'http://localhost:8000';
}

// 쿠키 가져오기 헬퍼 함수
const getCookie = (name) => {
  if (!isClient) return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

// CSRF 토큰 관리
let csrfToken = null;
let csrfTokenFetchPromise = null;

// CSRF 토큰 가져오기
const getCSRFToken = async () => {
  // 이미 토큰이 있으면 재사용
  if (csrfToken) {
    return csrfToken;
  }
  
  // 이미 가져오는 중이면 같은 Promise 반환
  if (csrfTokenFetchPromise) {
    return csrfTokenFetchPromise;
  }
  
  // 새로 가져오기
  csrfTokenFetchPromise = axios.get(`${API_BASE_URL}/users/csrf-token/`, {
    withCredentials: true
  })
    .then(response => {
      csrfToken = response.data.csrfToken;
      csrfTokenFetchPromise = null;
      return csrfToken;
    })
    .catch(error => {
      csrfTokenFetchPromise = null;
      throw error;
    });
  
  return csrfTokenFetchPromise;
};

// CSRF 토큰 리셋 (401 에러 시 사용)
const resetCSRFToken = () => {
  csrfToken = null;
  csrfTokenFetchPromise = null;
};

// 토큰 정리 헬퍼 함수
const getCleanToken = () => {
  if (!isClient) return null;
  
  // 먼저 쿠키에서 확인
  let token = getCookie('vridge_session');
  if (token) {
    return token;
  }
  
  // 하위 호환성을 위해 localStorage도 확인
  try {
    token = typeof window !== 'undefined' && localStorage.getItem('VGID');
  } catch (e) {
    // localStorage 접근 실패 시 무시
    return null;
  }
  
  if (!token) {
    return null;
  }
  
  // JSON 문자열로 저장된 경우 파싱
  try {
    const parsed = JSON.parse(token);
    return typeof parsed === 'string' ? parsed : token;
  } catch {
    // 파싱 실패시 따옴표만 제거
    return token.replace(/^["']|["']$/g, '');
  }
};

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Accept': 'application/json'
  }
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config) => {
    // 토큰 자동 추가
    const cleanToken = getCleanToken();
    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    // CSRF 토큰이 필요한 메소드인지 확인 (POST, PUT, PATCH, DELETE)
    const methodsRequiringCSRF = ['post', 'put', 'patch', 'delete'];
    const requiresCSRF = methodsRequiringCSRF.includes(config.method.toLowerCase());
    
    // CSRF 토큰 엔드포인트 자체는 CSRF 토큰이 필요없음
    const isCSRFEndpoint = config.url.includes('/csrf-token/');
    
    if (requiresCSRF && !isCSRFEndpoint && isClient) {
      try {
        const token = await getCSRFToken();
        if (token) {
          config.headers['X-CSRFToken'] = token;
        }
      } catch (error) {
        // CSRF 토큰 가져오기 실패해도 요청은 계속 진행
        // 백엔드에서 처리하도록 함
      }
    }
    
    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // 보안: 민감한 데이터를 로깅하지 않음
    if (process.env.NODE_ENV === 'development') {
      // 헤더와 데이터는 로깅하지 않음 (토큰, 비밀번호 등이 포함될 수 있음)
      // 
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    // 보안: 응답 데이터를 로깅하지 않음
    if (process.env.NODE_ENV === 'development') {
      // 응답 데이터는 로깅하지 않음 (개인정보가 포함될 수 있음)
      // 
    }
    return response;
  },
  (error) => {
    // 401 인증 오류 특별 처리
    if (error.response?.status === 401 && isClient) {
      // CSRF 토큰 리셋
      resetCSRFToken();
      
      // 로그인 페이지가 아니고, 이미 리다이렉트 중이 아닌 경우에만 처리
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/Login') && !window._redirecting) {
        // 중복 리다이렉트 방지 플래그
        window._redirecting = true;
        
        try {
          localStorage.removeItem('VGID');
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          document.cookie = 'vridge_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } catch (e) { /* 에러 무시 */ }
        
        // 전역 에러 핸들러 사용
        handleError(error, {
          defaultMessage: '로그인이 필요합니다.',
          duration: 3000
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        
        return Promise.reject(error);
      }
    }
    
    // CSRF 토큰 오류 처리 (403 Forbidden)
    if (error.response?.status === 403 && error.response?.data?.detail?.includes('CSRF')) {
      // CSRF 토큰 리셋하고 재시도
      resetCSRFToken();
      
      // 원래 요청 재시도 (1회만)
      if (!error.config._retry) {
        error.config._retry = true;
        return axiosInstance(error.config);
      }
    }
    
    // 기타 모든 에러는 전역 에러 핸들러로 처리
    // 단, 호출자가 직접 처리하고 싶은 경우를 위해 skipGlobalErrorHandler 옵션 제공
    if (!error.config?.skipGlobalErrorHandler) {
      handleError(error, {
        showNotification: true,
        logError: true
      });
    }
    
    return Promise.reject(error);
  }
);

// CSRF 토큰 관련 함수도 export (필요시 사용)
export { getCSRFToken, resetCSRFToken };

export default axiosInstance;