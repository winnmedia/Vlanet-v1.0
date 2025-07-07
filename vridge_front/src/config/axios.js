import axios from 'axios';
import { addMobileHeaders, safeStorage } from 'utils/mobile-utils';

// 환경에 따라 API URL 설정
let API_BASE_URL;

// 프로덕션 도메인 체크
const isProduction = window.location.hostname === 'vlanet.net' || 
                     window.location.hostname === 'www.vlanet.net' ||
                     window.location.hostname.includes('vercel.app') ||
                     window.location.hostname.includes('railway.app');

if (isProduction) {
  API_BASE_URL = 'https://videoplanet.up.railway.app';
} else if (process.env.REACT_APP_API_BASE_URL) {
  API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
} else {
  API_BASE_URL = 'http://localhost:8000';
}

// 토큰 정리 헬퍼 함수
const getCleanToken = () => {
  let token = null;
  
  // 모바일 환경을 고려한 안전한 스토리지 접근
  try {
    token = localStorage.getItem('VGID');
  } catch (e) {
    // localStorage 접근 실패 시 safeStorage 사용
    token = safeStorage.getItem('VGID');
  }
  
  if (!token) return null;
  
  // JSON 문자열로 저장된 경우 파싱
  try {
    const parsed = JSON.parse(token);
    return typeof parsed === 'string' ? parsed : token;
  } catch {
    // 파싱 실패시 따옴표만 제거
    return token.replace(/^["']|["']$/g, '');
  }
};

// API URL 설정
axios.defaults.baseURL = API_BASE_URL;

console.log('[Axios Configuration] API Base URL:', API_BASE_URL);
console.log('[Axios Configuration] Environment:', process.env.NODE_ENV);
console.log('[Axios Configuration] Is Production:', isProduction);
console.log('[Axios Configuration] Hostname:', window.location.hostname);

// 공통 설정
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 30초에서 60초로 증가

// CORS를 위한 기본 헤더 설정
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';


// 요청 인터셉터
axios.interceptors.request.use(
  (config) => {
    // 토큰 자동 추가
    const cleanToken = getCleanToken();
    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // CORS 관련 헤더 확인
    config.headers['Accept'] = 'application/json';
    
    // 모바일 헤더 추가 (기존 기능에 영향 없음)
    config = addMobileHeaders(config);
    
    console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`[Axios BaseURL] ${axios.defaults.baseURL}`);
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axios.interceptors.response.use(
  (response) => {
    console.log(`[Axios Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[Axios Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    
    // 응답 데이터 로깅 (디버깅용)
    if (error.response?.data) {
      console.error('[Axios Response Data]', error.response.data);
      
      // HTML 응답인 경우 (백엔드 에러 페이지)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        console.error('[Axios] Received HTML instead of JSON - Backend error page');
        error.response.data = {
          message: 'Server error - received HTML response',
          detail: 'The server returned an error page instead of JSON data'
        };
      }
    }
    
    // 401 에러 처리
    if (error.response?.status === 401) {
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/Login')) {
        try {
          localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/Login';
      }
    }
    
    return Promise.reject(error);
  }
);

// baseURL 변경 함수
export const updateBaseURL = (url) => {
  axios.defaults.baseURL = url;
  axiosInstance.defaults.baseURL = url;
  console.log('[Axios] BaseURL updated to:', url);
};

// 커스텀 axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 30초에서 60초로 증가
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 인스턴스에도 동일한 인터셉터 적용
axiosInstance.interceptors.request.use(
  (config) => {
    const cleanToken = getCleanToken();
    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    config.headers['Accept'] = 'application/json';
    
    // 모바일 헤더 추가 (기존 기능에 영향 없음)
    config = addMobileHeaders(config);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[Axios Instance Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[Axios Instance Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    
    // 응답 데이터 로깅 (디버깅용)
    if (error.response?.data) {
      console.error('[Axios Instance Response Data]', error.response.data);
      
      // HTML 응답인 경우 (백엔드 에러 페이지)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        console.error('[Axios Instance] Received HTML instead of JSON - Backend error page');
        error.response.data = {
          message: 'Server error - received HTML response',
          detail: 'The server returned an error page instead of JSON data'
        };
      }
    }
    
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/Login')) {
        try {
          localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/Login';
      }
    }
    
    return Promise.reject(error);
  }
);

export { axiosInstance };
export default axios;