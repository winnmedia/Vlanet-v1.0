// 404 에러 디버깅 유틸리티

export const debug404 = {
  // 현재 환경 정보 로깅
  logEnvironment: () => {
    console.group('🔍 404 Debug - Environment');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Hash:', window.location.hash);
    console.log('API URL:', process.env.REACT_APP_API_URL);
    console.log('Build Time:', process.env.REACT_APP_BUILD_TIME || 'unknown');
    console.groupEnd();
  },

  // API 요청 디버깅
  logApiRequest: (url, options = {}) => {
    console.group('🔍 404 Debug - API Request');
    console.log('Request URL:', url);
    console.log('Full URL:', url.startsWith('http') ? url : `${process.env.REACT_APP_API_URL}${url}`);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', options.headers);
    console.groupEnd();
  },

  // 라우팅 디버깅
  logRouting: (from, to) => {
    console.group('🔍 404 Debug - Routing');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Router State:', window.history.state);
    console.groupEnd();
  },

  // 에러 응답 상세 분석
  analyzeError: (error) => {
    console.group('🔍 404 Debug - Error Analysis');
    console.log('Error Type:', error.name);
    console.log('Error Message:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Headers:', error.response.headers);
      console.log('Response Data:', error.response.data);
      console.log('Request URL:', error.config?.url);
      console.log('Request Method:', error.config?.method);
    }
    
    if (error.request) {
      console.log('Request Object:', error.request);
      console.log('Ready State:', error.request.readyState);
      console.log('Status:', error.request.status);
      console.log('Response URL:', error.request.responseURL);
    }
    
    console.groupEnd();
  },

  // 초대 링크 디버깅
  debugInvitation: (token, uid = null) => {
    console.group('🔍 404 Debug - Invitation');
    console.log('Token:', token);
    console.log('UID:', uid);
    console.log('Token Length:', token?.length);
    console.log('Token Pattern:', /^[a-zA-Z0-9_-]+$/.test(token) ? 'Valid' : 'Invalid');
    
    // API 엔드포인트 확인
    const apiUrl = uid 
      ? `/api/projects/invite/accept/`
      : `/api/projects/invitations/token/${token}/`;
    
    console.log('Expected API Endpoint:', apiUrl);
    console.log('Full API URL:', `${process.env.REACT_APP_API_URL}${apiUrl}`);
    console.groupEnd();
  }
};

// 전역 객체로 노출 (브라우저 콘솔에서 직접 사용 가능)
if (typeof window !== 'undefined') {
  window.debug404 = debug404;
}