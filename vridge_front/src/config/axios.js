import axios from 'axios';

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
    
    // 보안: 민감한 데이터를 로깅하지 않음
    if (process.env.NODE_ENV === 'development') {
      // 헤더와 데이터는 로깅하지 않음 (토큰, 비밀번호 등이 포함될 수 있음)
      // console.log('API Request:', config.method, config.url);
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
      // console.log('API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    // 보안: 에러 로깅 시 민감한 데이터 제외
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
        // data는 로깅하지 않음 (민감한 정보가 포함될 수 있음)
      });
    }
    
    if (error.response?.status === 401 && isClient) {
      // 로그인 페이지가 아니고, 이미 리다이렉트 중이 아닌 경우에만 처리
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/Login') && !window._redirecting) {
        // 중복 리다이렉트 방지 플래그
        window._redirecting = true;
        
        try {
          localStorage.removeItem('VGID');
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          document.cookie = 'vridge_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } catch (e) {
          console.error('Failed to clear auth data:', e);
        }
        
        // 경고 메시지 한 번만 표시하고 즉시 리다이렉트
        window.alert('로그인이 필요합니다.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;