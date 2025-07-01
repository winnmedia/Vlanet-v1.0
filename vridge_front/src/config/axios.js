import axios from 'axios';

// 환경에 따라 API URL 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// API URL 설정
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
} else if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서 proxy가 작동하지 않는 경우를 위한 fallback
  axios.defaults.baseURL = 'http://localhost:8000';
}

// 공통 설정
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

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
    
    console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`);
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

export default axios;