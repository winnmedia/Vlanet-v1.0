import axios from 'axios';
import { addMobileHeaders, safeStorage } from '../../utils/mobile-utils';

// 환경에 따라 API URL 설정
let API_BASE_URL;

// 프로덕션 도메인 체크
const isProduction = typeof window !== 'undefined' && window.location.hostname === 'vlanet.net' ||
typeof window !== 'undefined' && window.location.hostname === 'www.vlanet.net' ||
typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ||
typeof window !== 'undefined' && window.location.hostname.includes('railway.app');

if (isProduction) {
  // 프로덕션 환경에서는 Railway URL 직접 사용 (임시)
  API_BASE_URL = process.env.REACT_APP_API_URL || 'https://videoplanet.up.railway.app';
} else if (process.env.REACT_APP_API_URL) {
  API_BASE_URL = process.env.REACT_APP_API_URL;
} else {
  API_BASE_URL = 'http://localhost:8000';
}

// 쿠키 가져오기 헬퍼 함수
const getCookie = (name) => {
  const value = `; ${typeof window !== 'undefined' && document.cookie || ''}`;
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

    return token;
  }

  // 하위 호환성을 위해 localStorage도 확인
  try {
    token = typeof window !== 'undefined' && localStorage.getItem('VGID');

  } catch (e) {
    // localStorage 접근 실패 시 safeStorage 사용

    token = safeStorage.getItem('VGID');
  }

  if (!token) {

    return null;
  }

  // JSON 문자열로 저장된 경우 파싱
  try {
    const parsed = JSON.parse(token);
    const result = typeof parsed === 'string' ? parsed : token;

    return result;
  } catch {
    // 파싱 실패시 따옴표만 제거
    const cleaned = token.replace(/^["']|["']$/g, '');

    return cleaned;
  }
};

// API URL 설정
axios.defaults.baseURL = API_BASE_URL;

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

    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;

    } else {}

    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // CORS 관련 헤더 확인
    config.headers['Accept'] = 'application/json';

    // 모바일 헤더 추가 (기존 기능에 영향 없음)
    config = addMobileHeaders(config);

    return config;
  },
  (error) => {
    
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axios.interceptors.response.use(
  (response) => {

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    } ${error.config?.url} - ${error.response?.status || 'Network Error'}`);

    // 네트워크 에러 또는 타임아웃 시 재시도
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // 재시도 카운터 초기화
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // 최대 2번까지 재시도
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;

        // 재시도 전 대기 시간 (1초, 2초)
        await new Promise((resolve) => setTimeout(resolve, originalRequest._retryCount * 1000));

        return axios(originalRequest);
      }
    }

    // 응답 데이터 로깅 (디버깅용)
    if (error.response?.data) {

      // HTML 응답인 경우 (백엔드 에러 페이지)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        
        error.response.data = {
          message: 'Server error - received HTML response',
          detail: 'The server returned an error page instead of JSON data'
        };
      }
    }

    // 401 에러 처리
    if (error.response?.status === 401) {

      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!(typeof window !== 'undefined') || !window.location.pathname.includes('/Login') && !(typeof window !== 'undefined') || !window.location.pathname.includes('/login')) {
        try {
          typeof window !== 'undefined' && localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        // 에러 응답을 500이 아닌 401로 유지
        error.response.status = 401;
        error.response.data = error.response.data || { message: '인증이 필요합니다.' };

        // 약간의 지연 후 리다이렉트
        setTimeout(() => {
          window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          if (typeof window !== 'undefined') {
            window.location.href = '/Login';
          }
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

    if (cleanToken) {
      config.headers.Authorization = `Bearer ${cleanToken}`;

    } else {}

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

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    } ${error.config?.url} - ${error.response?.status || 'Network Error'}`);

    // 네트워크 에러 또는 타임아웃 시 재시도
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // 재시도 카운터 초기화
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // 최대 2번까지 재시도
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;

        // 재시도 전 대기 시간 (1초, 2초)
        await new Promise((resolve) => setTimeout(resolve, originalRequest._retryCount * 1000));

        return axiosInstance(originalRequest);
      }
    }

    // 응답 데이터 로깅 (디버깅용)
    if (error.response?.data) {

      // HTML 응답인 경우 (백엔드 에러 페이지)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        
        error.response.data = {
          message: 'Server error - received HTML response',
          detail: 'The server returned an error page instead of JSON data'
        };
      }
    }

    if (error.response?.status === 401) {

      if (!(typeof window !== 'undefined') || !window.location.pathname.includes('/Login') && !(typeof window !== 'undefined') || !window.location.pathname.includes('/login')) {
        try {
          typeof window !== 'undefined' && localStorage.removeItem('VGID');
        } catch (e) {
          safeStorage.removeItem('VGID');
        }
        // 에러 응답을 500이 아닌 401로 유지
        error.response.status = 401;
        error.response.data = error.response.data || { message: '인증이 필요합니다.' };

        // 약간의 지연 후 리다이렉트
        setTimeout(() => {
          window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          if (typeof window !== 'undefined') {
            window.location.href = '/Login';
          }
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