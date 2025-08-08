/**
 * 로그인/회원가입 UI 테스트
 * 실제 사용자 시나리오를 시뮬레이션
 */

const https = require('https');
const http = require('http');

// 설정
const FRONTEND_URL = 'https://www.vlanet.net';
const API_URL = 'https://videoplanet.up.railway.app';
const LOCAL_FRONTEND = 'http://localhost:3000';
const LOCAL_API = 'http://localhost:8000';

// 테스트 모드 (local 또는 production)
const TEST_MODE = process.argv[2] || 'production';
const isLocal = TEST_MODE === 'local';

const BASE_URL = isLocal ? LOCAL_FRONTEND : FRONTEND_URL;
const API_BASE = isLocal ? LOCAL_API : API_URL;

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// HTTP(S) 요청 함수
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Set-Cookie 헤더 파싱
        const cookies = res.headers['set-cookie'] || [];
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers, 
          cookies,
          data 
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (options.data) {
      req.write(options.data);
    }
    req.end();
  });
}

// 테스트 데이터 생성
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test_${timestamp}@videoplanet.test`,
    password: 'Test1234!@',
    nickname: `테스터_${timestamp}`,
    username: `test_${timestamp}@videoplanet.test`
  };
}

// 테스트 실행
async function runTests() {
  console.log(`\n${colors.cyan}===================================`);
  console.log(`VideoPlanet 인증 UI 테스트`);
  console.log(`모드: ${TEST_MODE.toUpperCase()}`);
  console.log(`===================================\n${colors.reset}`);
  
  const testUser = generateTestUser();
  const results = [];
  let authToken = null;
  let refreshToken = null;
  
  // 1. 홈페이지 접근성
  try {
    console.log(`${colors.blue}[1/8] 홈페이지 접근성 테스트...${colors.reset}`);
    const res = await request(BASE_URL);
    if (res.statusCode === 200) {
      const hasLoginButton = res.data.includes('로그인') || res.data.includes('Login');
      if (hasLoginButton) {
        console.log(`${colors.green}✅ 홈페이지 정상, 로그인 버튼 확인${colors.reset}`);
        results.push({ test: '홈페이지 접근성', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 홈페이지는 접근 가능하나 로그인 버튼 미확인${colors.reset}`);
        results.push({ test: '홈페이지 접근성', passed: false });
      }
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ 홈페이지 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: '홈페이지 접근성', passed: false });
  }
  
  // 2. 회원가입 API 테스트
  try {
    console.log(`${colors.blue}[2/8] 회원가입 API 테스트...${colors.reset}`);
    const res = await request(`${API_BASE}/api/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        username: testUser.email,
        email: testUser.email,
        password: testUser.password,
        nickname: testUser.nickname
      })
    });
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log(`${colors.green}✅ 회원가입 성공${colors.reset}`);
      console.log(`   - 이메일: ${testUser.email}`);
      results.push({ test: '회원가입 API', passed: true });
    } else {
      const response = JSON.parse(res.data);
      if (res.statusCode === 409 || (response.username && response.username[0].includes('이미 존재'))) {
        console.log(`${colors.yellow}⚠️ 이미 존재하는 사용자 (정상)${colors.reset}`);
        results.push({ test: '회원가입 API', passed: true });
      } else {
        throw new Error(`Status: ${res.statusCode}, ${res.data}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ 회원가입 실패: ${error.message}${colors.reset}`);
    results.push({ test: '회원가입 API', passed: false });
  }
  
  // 3. 로그인 API 테스트
  try {
    console.log(`${colors.blue}[3/8] 로그인 API 테스트...${colors.reset}`);
    const res = await request(`${API_BASE}/api/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        username: testUser.email,
        password: testUser.password
      })
    });
    
    if (res.statusCode === 200) {
      const response = JSON.parse(res.data);
      authToken = response.access || response.access_token;
      refreshToken = response.refresh || response.refresh_token;
      
      if (authToken) {
        console.log(`${colors.green}✅ 로그인 성공${colors.reset}`);
        console.log(`   - 액세스 토큰: ${authToken.substring(0, 20)}...`);
        console.log(`   - 사용자 ID: ${response.user?.id || 'N/A'}`);
        results.push({ test: '로그인 API', passed: true });
      } else {
        throw new Error('토큰이 응답에 없음');
      }
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ 로그인 실패: ${error.message}${colors.reset}`);
    results.push({ test: '로그인 API', passed: false });
  }
  
  // 4. 토큰 검증 테스트
  if (authToken) {
    try {
      console.log(`${colors.blue}[4/8] JWT 토큰 검증 테스트...${colors.reset}`);
      const res = await request(`${API_BASE}/api/users/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.statusCode === 200) {
        const user = JSON.parse(res.data);
        console.log(`${colors.green}✅ 토큰 검증 성공${colors.reset}`);
        console.log(`   - 사용자: ${user.email || user.username}`);
        results.push({ test: 'JWT 토큰 검증', passed: true });
      } else {
        throw new Error(`Status: ${res.statusCode}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ 토큰 검증 실패: ${error.message}${colors.reset}`);
      results.push({ test: 'JWT 토큰 검증', passed: false });
    }
  } else {
    console.log(`${colors.yellow}⏭️ 토큰이 없어 검증 건너뜀${colors.reset}`);
    results.push({ test: 'JWT 토큰 검증', passed: false });
  }
  
  // 5. 로그인 페이지 UI 확인
  try {
    console.log(`${colors.blue}[5/8] 로그인 페이지 UI 확인...${colors.reset}`);
    const res = await request(`${BASE_URL}/login`);
    if (res.statusCode === 200 || res.statusCode === 404) {
      if (res.statusCode === 200) {
        const hasForm = res.data.includes('password') || res.data.includes('비밀번호');
        if (hasForm) {
          console.log(`${colors.green}✅ 로그인 페이지 UI 정상${colors.reset}`);
          results.push({ test: '로그인 페이지 UI', passed: true });
        } else {
          console.log(`${colors.yellow}⚠️ 로그인 페이지는 있으나 폼 요소 미확인${colors.reset}`);
          results.push({ test: '로그인 페이지 UI', passed: false });
        }
      } else {
        console.log(`${colors.yellow}⚠️ 로그인 페이지 미구현 (404)${colors.reset}`);
        results.push({ test: '로그인 페이지 UI', passed: false });
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ 로그인 페이지 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: '로그인 페이지 UI', passed: false });
  }
  
  // 6. 회원가입 페이지 UI 확인
  try {
    console.log(`${colors.blue}[6/8] 회원가입 페이지 UI 확인...${colors.reset}`);
    const res = await request(`${BASE_URL}/register`);
    if (res.statusCode === 200 || res.statusCode === 404) {
      if (res.statusCode === 200) {
        const hasForm = res.data.includes('email') || res.data.includes('이메일');
        if (hasForm) {
          console.log(`${colors.green}✅ 회원가입 페이지 UI 정상${colors.reset}`);
          results.push({ test: '회원가입 페이지 UI', passed: true });
        } else {
          console.log(`${colors.yellow}⚠️ 회원가입 페이지는 있으나 폼 요소 미확인${colors.reset}`);
          results.push({ test: '회원가입 페이지 UI', passed: false });
        }
      } else {
        console.log(`${colors.yellow}⚠️ 회원가입 페이지 미구현 (404)${colors.reset}`);
        results.push({ test: '회원가입 페이지 UI', passed: false });
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ 회원가입 페이지 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: '회원가입 페이지 UI', passed: false });
  }
  
  // 7. 소셜 로그인 확인
  try {
    console.log(`${colors.blue}[7/8] 소셜 로그인 기능 확인...${colors.reset}`);
    const res = await request(`${API_BASE}/api/users/google/login/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // 302 리다이렉트 또는 400 에러는 엔드포인트가 존재한다는 의미
    if (res.statusCode === 302 || res.statusCode === 400 || res.statusCode === 405) {
      console.log(`${colors.green}✅ 구글 로그인 엔드포인트 확인${colors.reset}`);
      results.push({ test: '소셜 로그인', passed: true });
    } else if (res.statusCode === 404) {
      console.log(`${colors.yellow}⚠️ 소셜 로그인 미구현${colors.reset}`);
      results.push({ test: '소셜 로그인', passed: false });
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ 소셜 로그인 확인 실패: ${error.message}${colors.reset}`);
    results.push({ test: '소셜 로그인', passed: false });
  }
  
  // 8. 로그아웃 테스트
  if (refreshToken) {
    try {
      console.log(`${colors.blue}[8/8] 로그아웃 테스트...${colors.reset}`);
      const res = await request(`${API_BASE}/api/users/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        data: JSON.stringify({
          refresh: refreshToken
        })
      });
      
      if (res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 205) {
        console.log(`${colors.green}✅ 로그아웃 성공${colors.reset}`);
        results.push({ test: '로그아웃', passed: true });
      } else {
        throw new Error(`Status: ${res.statusCode}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️ 로그아웃 실패: ${error.message}${colors.reset}`);
      results.push({ test: '로그아웃', passed: false });
    }
  } else {
    console.log(`${colors.yellow}⏭️ 토큰이 없어 로그아웃 건너뜀${colors.reset}`);
    results.push({ test: '로그아웃', passed: false });
  }
  
  // 결과 요약
  console.log(`\n${colors.cyan}===================================`);
  console.log(`테스트 결과 요약`);
  console.log(`===================================${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach((result, index) => {
    const status = result.passed ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    console.log(`${index + 1}. ${result.test}: ${status}${colors.reset}`);
  });
  
  console.log(`\n${colors.cyan}===================================`);
  
  // UI 개선 제안
  const uiImprovements = [];
  
  if (!results.find(r => r.test === '로그인 페이지 UI')?.passed) {
    uiImprovements.push('로그인 페이지 구현 필요');
  }
  if (!results.find(r => r.test === '회원가입 페이지 UI')?.passed) {
    uiImprovements.push('회원가입 페이지 구현 필요');
  }
  if (!results.find(r => r.test === '소셜 로그인')?.passed) {
    uiImprovements.push('소셜 로그인 버튼 추가 권장');
  }
  
  if (percentage === 100) {
    console.log(`${colors.green}🎉 모든 테스트 통과! (${passed}/${total})${colors.reset}`);
  } else if (percentage >= 70) {
    console.log(`${colors.yellow}⚠️ 일부 개선 필요 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 주요 개선 필요 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  }
  
  if (uiImprovements.length > 0) {
    console.log(`\n${colors.magenta}📝 UI 개선 제안:${colors.reset}`);
    uiImprovements.forEach(improvement => {
      console.log(`   - ${improvement}`);
    });
  }
  
  console.log(`${colors.cyan}===================================${colors.reset}\n`);
  
  // 성능 지표
  console.log(`${colors.blue}📊 인증 시스템 상태:${colors.reset}`);
  console.log(`  - API 안정성: ${results.filter(r => r.test.includes('API')).filter(r => r.passed).length}/${results.filter(r => r.test.includes('API')).length}`);
  console.log(`  - UI 완성도: ${results.filter(r => r.test.includes('UI')).filter(r => r.passed).length}/${results.filter(r => r.test.includes('UI')).length}`);
  console.log(`  - 전체 점수: ${percentage}%`);
  console.log(`  - 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
}

// 테스트 실행
console.log(`${colors.cyan}테스트 모드: ${TEST_MODE}${colors.reset}`);
console.log(`${colors.cyan}사용 방법: node auth-ui-test.js [local|production]${colors.reset}`);

runTests().catch(console.error);