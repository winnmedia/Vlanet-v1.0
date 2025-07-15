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
  // 프로덕션 환경에서는 API 서브도메인 사용
  API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.vlanet.net';
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
    return token;
  }
  
  // 하위 호환성을 위해 localStorage도 확인
  try {
    token = localStorage.getItem('VGID');
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
    return typeof parsed === 'string' ? parsed : token;
  } catch {
    // 파싱 실패시 따옴표만 제거
    return token.replace(/^["']|["']$/g, '');
  }
};

// axios 기본 설정
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 60초
axios.defaults.headers.common['Accept'] = 'application/json';

// 요청 인터셉터 (통합)
const requestInterceptor = (config) => {
  // 토큰 자동 추가
  const cleanToken = getCleanToken();
  if (cleanToken) {
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  
  // FormData가 아닌 경우에만 Content-Type 설정
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  // 모바일 헤더 추가
  config = addMobileHeaders(config);
  
  return config;
};

// 응답 인터셉터 (통합)
const responseInterceptor = (response) => {
  return response;
};

const responseErrorInterceptor = async (error) => {
  if (error.response) {
    // HTML 페이지를 받은 경우 (주로 404 또는 서버 에러)
    const contentType = error.response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON:', error.response.status);
      error.response.data = {
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        status: error.response.status
      };
    }
    
    // 401 에러 처리
    if (error.response.status === 401) {
      const isAuthPath = window.location.pathname === '/Login' || 
                        window.location.pathname === '/Signup';
      
      if (!isAuthPath) {
        // 로그인 페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = '/Login';
        }, 100);
      }
    }
  }
  
  return Promise.reject(error);
};

// 기본 axios에 인터셉터 적용
axios.interceptors.request.use(requestInterceptor, error => Promise.reject(error));
axios.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

// 동적 baseURL 변경 함수
export const setApiBaseUrl = (url) => {
  axios.defaults.baseURL = url;
};

export default axios;