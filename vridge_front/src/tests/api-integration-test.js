const axios = require('axios');

// 테스트 설정
const API_BASE_URL = 'https://videoplanet.up.railway.app';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}=== VideoPlanet API 통합 테스트 ===${colors.reset}\n`);

// 1. 헬스체크
async function testHealthCheck() {
  console.log(`${colors.yellow}1. 서버 헬스체크${colors.reset}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health/`);
    console.log(`  상태: ${colors.green}✓ 성공${colors.reset}`);
    console.log(`  응답:`, response.data);
  } catch (error) {
    console.log(`  상태: ${colors.red}✗ 실패${colors.reset}`);
    console.log(`  에러:`, error.response?.status || error.message);
  }
  console.log();
}

// 2. CORS 테스트
async function testCORS() {
  console.log(`${colors.yellow}2. CORS 설정 테스트${colors.reset}`);
  
  try {
    const response = await axios.options(`${API_BASE_URL}/api/video-planning/library/`, {
      headers: {
        'Origin': 'https://vlanet.net',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    
    const corsHeaders = response.headers;
    console.log(`  상태: ${colors.green}✓ 성공${colors.reset}`);
    console.log(`  CORS 헤더:`);
    console.log(`    - Allow-Origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`);
    console.log(`    - Allow-Methods: ${corsHeaders['access-control-allow-methods'] || 'Not set'}`);
    console.log(`    - Allow-Headers: ${corsHeaders['access-control-allow-headers'] || 'Not set'}`);
  } catch (error) {
    console.log(`  상태: ${colors.red}✗ 실패${colors.reset}`);
    console.log(`  에러:`, error.response?.status || error.message);
  }
  console.log();
}

// 3. API 엔드포인트 테스트 (인증 없이)
async function testAPIEndpoints() {
  console.log(`${colors.yellow}3. API 엔드포인트 테스트 (인증 없이)${colors.reset}`);
  
  const endpoints = [
    { method: 'GET', url: '/api/video-planning/library/' },
    { method: 'POST', url: '/api/video-planning/generate/story/' },
    { method: 'POST', url: '/api/video-planning/generate/scenes/' },
    { method: 'POST', url: '/api/video-planning/generate/shots/' },
    { method: 'POST', url: '/api/video-planning/generate/storyboards/' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.url}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.method === 'POST') {
        config.data = { test: true };
      }
      
      const response = await axios(config);
      console.log(`  ${endpoint.method} ${endpoint.url}: ${colors.green}✓ 접근 가능${colors.reset}`);
    } catch (error) {
      const status = error.response?.status;
      let statusText = `${status || 'Network Error'}`;
      if (status === 403) statusText += ' (인증 필요)';
      if (status === 400) statusText += ' (잘못된 요청)';
      if (status === 404) statusText += ' (엔드포인트 없음)';
      
      console.log(`  ${endpoint.method} ${endpoint.url}: ${colors.red}✗ ${statusText}${colors.reset}`);
    }
  }
  console.log();
}

// 4. 로그인 테스트
async function testLogin() {
  console.log(`${colors.yellow}4. 로그인 테스트${colors.reset}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login/`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    console.log(`  상태: ${colors.green}✓ 로그인 엔드포인트 작동${colors.reset}`);
    console.log(`  응답 키:`, Object.keys(response.data));
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) {
      console.log(`  상태: ${colors.yellow}⚠ 로그인 실패 (잘못된 자격증명)${colors.reset}`);
    } else {
      console.log(`  상태: ${colors.red}✗ 에러 (${status || error.message})${colors.reset}`);
    }
  }
  console.log();
}

// 5. 요약
async function summary() {
  console.log(`${colors.blue}=== 테스트 요약 ===${colors.reset}`);
  console.log(`\n현재 상태:`);
  console.log(`- 서버가 ${API_BASE_URL}에서 실행 중`);
  console.log(`- CORS 설정이 적용됨`);
  console.log(`- 일부 API 엔드포인트는 인증이 필요함`);
  console.log(`\n권장사항:`);
  console.log(`1. 프론트엔드에서 올바른 토큰 사용 확인 (localStorage의 'VGID')`);
  console.log(`2. 백엔드 로그에서 인증 디버깅 메시지 확인`);
  console.log(`3. 필요시 임시로 권한을 AllowAny로 설정하여 테스트`);
}

// 테스트 실행
async function runTests() {
  try {
    await testHealthCheck();
    await testCORS();
    await testAPIEndpoints();
    await testLogin();
    await summary();
  } catch (error) {
    console.error(`${colors.red}테스트 실행 중 오류:${colors.reset}`, error.message);
  }
}

// 시작
runTests();