import axios from 'axios';

// 환경에 따라 API URL 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// 개발 환경에서는 proxy를 사용하므로 baseURL을 설정하지 않음
if (process.env.NODE_ENV === 'production' && API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// 공통 설정
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// 요청 인터셉터
axios.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error);
  }
);

export default axios;