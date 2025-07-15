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
  // 프로덕션 환경에서는 환경변수 사용
  API_BASE_URL = process.env.REACT_APP_API_URL || 'https://videoplanet.up.railway.app';
} else if (process.env.REACT_APP_API_URL) {
  API_BASE_URL = process.env.REACT_APP_API_URL;
} else {
  API_BASE_URL = 'http://localhost:8000';
}

// 쿠키 가져오기 헬퍼 함수
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

// 토큰 정리 헬퍼 함수
const getCleanToken = () => {
  // 먼저 쿠키에서 확인
  let token = getCookie('vridge_session');
  if (token) {
    console.log('[getCleanToken] Token from cookie:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }
  
  // 하위 호환성을 위해 localStorage도 확인
  try {
    token = localStorage.getItem('VGID');
    console.log('[getCleanToken] Raw token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
  } catch (e) {
    // localStorage 접근 실패 시 safeStorage 사용
    console.log('[getCleanToken] localStorage failed, trying safeStorage');
    token = safeStorage.getItem('VGID');
  }
  
  if (!token) {
    console.log('[getCleanToken] No token found in storage');
    return null;
  }
  
  // JSON 문자열로 저장된 경우 파싱
  try {
    const parsed = JSON.parse(token);
    const result = typeof parsed === 'string' ? parsed : token;
    console.log('[getCleanToken] Parsed token:', result ? `${result.substring(0, 20)}...` : 'null');
    return result;
  } catch {
    // 파싱 실패시 따옴표만 제거
    const cleaned = token.replace(/^["']|["']$/g, '');
    console.log('[getCleanToken] Cleaned token:', cleaned ? `${cleaned.substring(0, 20)}...` : 'null');
    return cleaned;
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
// Content-Type은 요청에 따라 자동 설정되도록 비워둠
axios.defaults.headers.common['Accept'] = 'application/json';


// 요청 인터셉터
axios.interceptors.request.use(
  (config) => {
    // 토큰 자동 추가
    const cleanToken = getCleanToken();
    console.log('[Axios Interceptor] Clean token:', cleanToken ? `${cleanToken.substring(0, 20)}...` : 'null');
    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('[Axios Interceptor] Authorization header set');
    } else {
      console.warn('[Axios Interceptor] No token found - request will likely fail with 401');
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
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`[Axios Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    
    // 네트워크 에러 또는 타임아웃 시 재시도
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // 재시도 카운터 초기화
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      // 최대 2번까지 재시도
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;
        console.log(`[Axios] Retrying request (${originalRequest._retryCount}/2)...`);
        
        // 재시도 전 대기 시간 (1초, 2초)
        await new Promise(resolve => setTimeout(resolve, originalRequest._retryCount * 1000));
        
        return axios(originalRequest);
      }
    }
    
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
      console.log('[Axios] 401 Unauthorized - Token invalid or missing');
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/Login') && !window.location.pathname.includes('/login')) {
        try {
          localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        // 에러 응답을 500이 아닌 401로 유지
        error.response.status = 401;
        error.response.data = error.response.data || { message: '인증이 필요합니다.' };
        
        // 약간의 지연 후 리다이렉트
        setTimeout(() => {
          window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          window.location.href = '/Login';
        }, 100);
      }
      // 401 에러를 그대로 반환 (500으로 변환되지 않도록)
      return Promise.reject(error);
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
    'Accept': 'application/json'
  }
});

// 인스턴스에도 동일한 인터셉터 적용
axiosInstance.interceptors.request.use(
  (config) => {
    const cleanToken = getCleanToken();
    console.log('[Axios Instance Interceptor] Clean token:', cleanToken ? `${cleanToken.substring(0, 20)}...` : 'null');
    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('[Axios Instance Interceptor] Authorization header set');
    } else {
      console.warn('[Axios Instance Interceptor] No token found - request will likely fail with 401');
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
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`[Axios Instance Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    
    // 네트워크 에러 또는 타임아웃 시 재시도
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // 재시도 카운터 초기화
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      // 최대 2번까지 재시도
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;
        console.log(`[Axios Instance] Retrying request (${originalRequest._retryCount}/2)...`);
        
        // 재시도 전 대기 시간 (1초, 2초)
        await new Promise(resolve => setTimeout(resolve, originalRequest._retryCount * 1000));
        
        return axiosInstance(originalRequest);
      }
    }
    
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
      console.log('[Axios Instance] 401 Unauthorized - Token invalid or missing');
      if (!window.location.pathname.includes('/Login') && !window.location.pathname.includes('/login')) {
        try {
          localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        // 에러 응답을 500이 아닌 401로 유지
        error.response.status = 401;
        error.response.data = error.response.data || { message: '인증이 필요합니다.' };
        
        // 약간의 지연 후 리다이렉트
        setTimeout(() => {
          window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          window.location.href = '/Login';
        }, 100);
      }
      // 401 에러를 그대로 반환
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export { axiosInstance };
export default axios;