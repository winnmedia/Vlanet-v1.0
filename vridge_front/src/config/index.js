/**
 * 중앙 집중식 환경 설정 관리
 * 모든 환경변수는 이 파일을 통해 접근
 */

const config = {
  // API 설정
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://videoplanet.up.railway.app',
    timeout: 30000,
  },
  
  // 앱 정보
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'VideoPlanet',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.16',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production',
    siteUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.vlanet.net',
  },
  
  // OAuth 설정
  oauth: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },
    kakao: {
      clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
    },
  },
  
  // 기능 플래그
  features: {
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    featureFlags: process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED === 'true',
  },
  
  // 개발 도구
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// 환경별 API URL 자동 설정
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 로컬 개발 환경
    config.api.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    config.api.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  } else if (hostname.includes('vercel.app')) {
    // Vercel 프리뷰 환경
    config.api.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app';
    config.api.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://videoplanet.up.railway.app';
  }
}

// 설정 검증
const validateConfig = () => {
  const errors = [];
  
  if (!config.api.baseUrl) {
    errors.push('API URL이 설정되지 않았습니다.');
  }
  
  if (config.isProduction && !config.api.baseUrl.startsWith('https')) {
    errors.push('프로덕션 환경에서는 HTTPS를 사용해야 합니다.');
  }
  
  if (errors.length > 0) {
    console.error('설정 오류:', errors);
  }
  
  return errors.length === 0;
};

// 개발 환경에서만 설정 검증
if (config.isDevelopment) {
  validateConfig();
}

// 설정 로그 (디버그 모드에서만)
if (config.features.debug) {
  console.log('앱 설정:', {
    environment: config.app.environment,
    apiUrl: config.api.baseUrl,
    version: config.app.version,
  });
}

export default config;