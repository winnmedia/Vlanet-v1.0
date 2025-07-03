const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testAPIPaths() {
  console.log('=== API 경로 테스트 ===\n');
  
  const paths = [
    // 인증 관련
    { method: 'POST', path: '/api/users/check-email/', data: { email: 'test@test.com' } },
    { method: 'POST', path: '/api/users/check-nickname/', data: { nickname: 'test' } },
    { method: 'POST', path: '/api/users/login/', data: { email: 'test@test.com', password: 'test' } },
    { method: 'POST', path: '/api/users/signup/', data: {} },
    
    // users/ 경로도 테스트 (기존 호환성)
    { method: 'POST', path: '/users/check-email/', data: { email: 'test@test.com' } },
    { method: 'POST', path: '/users/login/', data: { email: 'test@test.com', password: 'test' } },
    
    // 프로젝트 관련  
    { method: 'GET', path: '/api/projects/' },
    { method: 'GET', path: '/api/projects/project_list/' },
    { method: 'POST', path: '/api/projects/create/', data: {} },
    
    // 영상 기획
    { method: 'GET', path: '/api/video-planning/library/' },
    { method: 'POST', path: '/api/video-planning/generate/story/', data: { planning_text: 'test' } },
  ];
  
  for (const test of paths) {
    try {
      const config = {
        method: test.method,
        url: `${API_BASE_URL}${test.path}`,
        data: test.data,
        validateStatus: () => true // 모든 상태 코드 허용
      };
      
      const response = await axios(config);
      const statusText = response.status >= 200 && response.status < 300 ? '✓' : 
                        response.status === 401 ? '⚠ (인증필요)' :
                        response.status === 400 ? '⚠ (잘못된요청)' :
                        response.status === 403 ? '⚠ (권한없음)' :
                        response.status === 404 ? '✗ (없음)' :
                        response.status === 405 ? '✗ (메소드불가)' :
                        `✗ (${response.status})`;
      
      console.log(`${test.method} ${test.path}: ${statusText}`);
    } catch (error) {
      console.log(`${test.method} ${test.path}: ✗ (네트워크 에러)`);
    }
  }
}

testAPIPaths();