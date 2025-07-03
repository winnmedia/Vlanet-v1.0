import axios from 'axios';

// 환경에 따라 API URL 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://videoplanet.up.railway.app'
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000');

// API URL 설정
axios.defaults.baseURL = API_BASE_URL;

console.log('[Axios Configuration] API Base URL:', API_BASE_URL);
console.log('[Axios Configuration] Environment:', process.env.NODE_ENV);

// 공통 설정
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// CORS를 위한 기본 헤더 설정
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// 요청 인터셉터
axios.interceptors.request.use(
  (config) => {
    // 토큰 자동 추가
    const token = localStorage.getItem('VGID');
    if (token) {
      // 토큰에서 따옴표 제거
      const cleanToken = token.replace(/"/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // CORS 관련 헤더 확인
    config.headers['Accept'] = 'application/json';
    
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
    
    // 401 에러 처리
    if (error.response?.status === 401) {
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/Login')) {
        localStorage.removeItem('VGID');
        window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/Login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 커스텀 axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 인스턴스에도 동일한 인터셉터 적용
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('VGID');
    if (token) {
      const cleanToken = token.replace(/"/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    config.headers['Accept'] = 'application/json';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/Login')) {
        localStorage.removeItem('VGID');
        window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/Login';
      }
    }
    
    return Promise.reject(error);
  }
);

export { axiosInstance };
export default axios;