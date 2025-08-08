/**
 * 실시간 인증 기능 통합 테스트
 * API 경로 수정 후 실제 동작 확인
 */

const https = require('https');
const http = require('http');

// 설정
const API_URL = 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'https://www.vlanet.net';

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

// HTTPS 요청 헬퍼
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// 테스트 데이터
const testUser = {
  email: `test_${Date.now()}@videoplanet.test`,
  username: `test_${Date.now()}@videoplanet.test`,
  password: 'Test1234!@',
  nickname: `테스터_${Date.now()}`
};

// 실제 테스트 계정 (이미 생성된 계정)
const existingUser = {
  username: 'demo@test.com',
  email: 'demo@test.com',
  password: 'demo1234'
};

async function runTests() {
  console.log(`\n${colors.cyan}===================================`);
  console.log(`VideoPlanet 실시간 인증 테스트`);
  console.log(`시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`===================================\n${colors.reset}`);

  const results = [];
  let accessToken = null;
  let refreshToken = null;

  // 1. API 헬스체크
  try {
    console.log(`${colors.blue}[1/10] API 헬스체크...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/health/`);
    if (res.statusCode === 200) {
      console.log(`${colors.green}✅ API 서버 정상 작동${colors.reset}`);
      results.push({ test: 'API 헬스체크', passed: true });
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ API 서버 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: 'API 헬스체크', passed: false });
  }

  // 2. 새로운 회원가입 테스트 (/api/auth/signup/)
  try {
    console.log(`${colors.blue}[2/10] 새로운 회원가입 테스트...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/auth/signup/`, {
      method: 'POST',
      body: testUser
    });
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log(`${colors.green}✅ 회원가입 성공!${colors.reset}`);
      console.log(`   - 이메일: ${testUser.email}`);
      results.push({ test: '회원가입 (/api/auth/signup/)', passed: true });
    } else if (res.statusCode === 409) {
      console.log(`${colors.yellow}⚠️ 이미 존재하는 사용자 (정상 응답)${colors.reset}`);
      results.push({ test: '회원가입 (/api/auth/signup/)', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ 회원가입 응답: ${res.statusCode}${colors.reset}`);
      console.log(`   응답: ${res.data.substring(0, 200)}`);
      results.push({ test: '회원가입 (/api/auth/signup/)', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 회원가입 실패: ${error.message}${colors.reset}`);
    results.push({ test: '회원가입 (/api/auth/signup/)', passed: false });
  }

  // 3. 로그인 테스트 - 새 계정
  try {
    console.log(`${colors.blue}[3/10] 새 계정 로그인 테스트...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      body: {
        username: testUser.email,
        password: testUser.password
      }
    });
    
    if (res.statusCode === 200) {
      const response = JSON.parse(res.data);
      accessToken = response.access || response.access_token;
      refreshToken = response.refresh || response.refresh_token;
      
      console.log(`${colors.green}✅ 로그인 성공!${colors.reset}`);
      console.log(`   - 액세스 토큰: ${accessToken ? accessToken.substring(0, 30) + '...' : 'N/A'}`);
      results.push({ test: '새 계정 로그인', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ 로그인 응답: ${res.statusCode}${colors.reset}`);
      results.push({ test: '새 계정 로그인', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 로그인 실패: ${error.message}${colors.reset}`);
    results.push({ test: '새 계정 로그인', passed: false });
  }

  // 4. 기존 계정 로그인 테스트
  try {
    console.log(`${colors.blue}[4/10] 기존 계정 로그인 테스트...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      body: {
        username: existingUser.username,
        password: existingUser.password
      }
    });
    
    if (res.statusCode === 200) {
      const response = JSON.parse(res.data);
      if (!accessToken) {
        accessToken = response.access || response.access_token;
        refreshToken = response.refresh || response.refresh_token;
      }
      
      console.log(`${colors.green}✅ 기존 계정 로그인 성공!${colors.reset}`);
      console.log(`   - 사용자: ${existingUser.email}`);
      results.push({ test: '기존 계정 로그인', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ 로그인 응답: ${res.statusCode}${colors.reset}`);
      console.log(`   응답: ${res.data.substring(0, 200)}`);
      results.push({ test: '기존 계정 로그인', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 로그인 실패: ${error.message}${colors.reset}`);
    results.push({ test: '기존 계정 로그인', passed: false });
  }

  // 5. JWT 토큰 검증
  if (accessToken) {
    try {
      console.log(`${colors.blue}[5/10] JWT 토큰 검증...${colors.reset}`);
      const res = await httpsRequest(`${API_URL}/api/users/me/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (res.statusCode === 200) {
        const user = JSON.parse(res.data);
        console.log(`${colors.green}✅ 토큰 검증 성공!${colors.reset}`);
        console.log(`   - 사용자 ID: ${user.id}`);
        console.log(`   - 이메일: ${user.email || user.username}`);
        results.push({ test: 'JWT 토큰 검증', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 토큰 검증 응답: ${res.statusCode}${colors.reset}`);
        results.push({ test: 'JWT 토큰 검증', passed: false });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 토큰 검증 실패: ${error.message}${colors.reset}`);
      results.push({ test: 'JWT 토큰 검증', passed: false });
    }
  } else {
    console.log(`${colors.yellow}⏭️ 토큰이 없어 검증 건너뜀${colors.reset}`);
    results.push({ test: 'JWT 토큰 검증', passed: false });
  }

  // 6. 토큰 갱신 테스트
  if (refreshToken) {
    try {
      console.log(`${colors.blue}[6/10] 토큰 갱신 테스트...${colors.reset}`);
      const res = await httpsRequest(`${API_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        body: {
          refresh: refreshToken
        }
      });
      
      if (res.statusCode === 200) {
        const response = JSON.parse(res.data);
        const newAccessToken = response.access || response.access_token;
        console.log(`${colors.green}✅ 토큰 갱신 성공!${colors.reset}`);
        console.log(`   - 새 액세스 토큰: ${newAccessToken ? newAccessToken.substring(0, 30) + '...' : 'N/A'}`);
        results.push({ test: '토큰 갱신', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 토큰 갱신 응답: ${res.statusCode}${colors.reset}`);
        results.push({ test: '토큰 갱신', passed: false });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 토큰 갱신 실패: ${error.message}${colors.reset}`);
      results.push({ test: '토큰 갱신', passed: false });
    }
  } else {
    console.log(`${colors.yellow}⏭️ 리프레시 토큰이 없어 건너뜀${colors.reset}`);
    results.push({ test: '토큰 갱신', passed: false });
  }

  // 7. 프론트엔드 로그인 페이지 확인
  try {
    console.log(`${colors.blue}[7/10] 프론트엔드 로그인 페이지...${colors.reset}`);
    const res = await httpsRequest(`${FRONTEND_URL}/login`);
    if (res.statusCode === 200) {
      const hasLoginForm = res.data.includes('password') || res.data.includes('비밀번호');
      if (hasLoginForm) {
        console.log(`${colors.green}✅ 로그인 페이지 정상${colors.reset}`);
        results.push({ test: '로그인 페이지', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 로그인 페이지는 있으나 폼 미확인${colors.reset}`);
        results.push({ test: '로그인 페이지', passed: false });
      }
    } else {
      console.log(`${colors.yellow}⚠️ 로그인 페이지 응답: ${res.statusCode}${colors.reset}`);
      results.push({ test: '로그인 페이지', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 로그인 페이지 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: '로그인 페이지', passed: false });
  }

  // 8. 프론트엔드 회원가입 페이지 확인
  try {
    console.log(`${colors.blue}[8/10] 프론트엔드 회원가입 페이지...${colors.reset}`);
    const res = await httpsRequest(`${FRONTEND_URL}/signup`);
    if (res.statusCode === 200) {
      const hasSignupForm = res.data.includes('email') || res.data.includes('이메일');
      if (hasSignupForm) {
        console.log(`${colors.green}✅ 회원가입 페이지 정상${colors.reset}`);
        results.push({ test: '회원가입 페이지', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 회원가입 페이지는 있으나 폼 미확인${colors.reset}`);
        results.push({ test: '회원가입 페이지', passed: false });
      }
    } else {
      console.log(`${colors.yellow}⚠️ 회원가입 페이지 응답: ${res.statusCode}${colors.reset}`);
      results.push({ test: '회원가입 페이지', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 회원가입 페이지 접근 실패: ${error.message}${colors.reset}`);
    results.push({ test: '회원가입 페이지', passed: false });
  }

  // 9. CORS 헤더 확인
  try {
    console.log(`${colors.blue}[9/10] CORS 설정 확인...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/health/`, {
      headers: {
        'Origin': 'https://www.vlanet.net'
      }
    });
    
    const corsHeader = res.headers['access-control-allow-origin'];
    if (corsHeader) {
      console.log(`${colors.green}✅ CORS 설정 정상: ${corsHeader}${colors.reset}`);
      results.push({ test: 'CORS 설정', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ CORS 헤더 없음${colors.reset}`);
      results.push({ test: 'CORS 설정', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ CORS 확인 실패: ${error.message}${colors.reset}`);
    results.push({ test: 'CORS 설정', passed: false });
  }

  // 10. 로그아웃 테스트
  if (refreshToken && accessToken) {
    try {
      console.log(`${colors.blue}[10/10] 로그아웃 테스트...${colors.reset}`);
      const res = await httpsRequest(`${API_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: {
          refresh: refreshToken
        }
      });
      
      if (res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 205) {
        console.log(`${colors.green}✅ 로그아웃 성공${colors.reset}`);
        results.push({ test: '로그아웃', passed: true });
      } else {
        console.log(`${colors.yellow}⚠️ 로그아웃 응답: ${res.statusCode}${colors.reset}`);
        results.push({ test: '로그아웃', passed: false });
      }
    } catch (error) {
      console.log(`${colors.red}❌ 로그아웃 실패: ${error.message}${colors.reset}`);
      results.push({ test: '로그아웃', passed: false });
    }
  } else {
    console.log(`${colors.yellow}⏭️ 토큰이 없어 로그아웃 건너뜀${colors.reset}`);
    results.push({ test: '로그아웃', passed: false });
  }

  // 결과 요약
  console.log(`\n${colors.cyan}===================================`);
  console.log(`테스트 결과 요약`);
  console.log(`===================================\n${colors.reset}`);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  results.forEach((result, index) => {
    const status = result.passed ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    console.log(`${index + 1}. ${result.test}: ${status}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}===================================`);
  
  if (percentage === 100) {
    console.log(`${colors.green}🎉 완벽! 모든 테스트 통과! (${passed}/${total})${colors.reset}`);
  } else if (percentage >= 80) {
    console.log(`${colors.green}✅ 우수! 대부분 테스트 통과 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else if (percentage >= 60) {
    console.log(`${colors.yellow}⚠️ 양호! 일부 개선 필요 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 개선 필요! (${passed}/${total}) - ${percentage}%${colors.reset}`);
  }
  
  console.log(`${colors.cyan}===================================\n${colors.reset}`);

  // 상세 분석
  console.log(`${colors.blue}📊 시스템 상태 분석:${colors.reset}`);
  
  const apiTests = results.filter(r => r.test.includes('API') || r.test.includes('로그인') || r.test.includes('회원가입') || r.test.includes('토큰'));
  const apiPassed = apiTests.filter(r => r.passed).length;
  console.log(`  - API 기능: ${apiPassed}/${apiTests.length} (${Math.round((apiPassed/apiTests.length)*100)}%)`);
  
  const uiTests = results.filter(r => r.test.includes('페이지'));
  const uiPassed = uiTests.filter(r => r.passed).length;
  console.log(`  - UI 페이지: ${uiPassed}/${uiTests.length} (${Math.round((uiPassed/uiTests.length)*100)}%)`);
  
  const securityTests = results.filter(r => r.test.includes('CORS') || r.test.includes('JWT'));
  const securityPassed = securityTests.filter(r => r.passed).length;
  console.log(`  - 보안 설정: ${securityPassed}/${securityTests.length} (${Math.round((securityPassed/securityTests.length)*100)}%)`);

  // 개선 제안
  const improvements = [];
  
  if (!results.find(r => r.test.includes('회원가입') && r.test.includes('/api/auth/signup/'))?.passed) {
    improvements.push('회원가입 API 엔드포인트 점검 필요');
  }
  if (!results.find(r => r.test.includes('JWT'))?.passed) {
    improvements.push('JWT 토큰 검증 시스템 점검 필요');
  }
  if (!results.find(r => r.test.includes('CORS'))?.passed) {
    improvements.push('CORS 설정 확인 필요');
  }

  if (improvements.length > 0) {
    console.log(`\n${colors.magenta}📝 개선 제안:${colors.reset}`);
    improvements.forEach(item => {
      console.log(`   - ${item}`);
    });
  }

  console.log(`\n${colors.cyan}테스트 완료: ${new Date().toLocaleString('ko-KR')}${colors.reset}\n`);
}

// 실행
console.log(`${colors.cyan}VideoPlanet 실시간 인증 시스템 테스트를 시작합니다...${colors.reset}`);
runTests().catch(error => {
  console.error(`${colors.red}테스트 중 오류 발생:${colors.reset}`, error);
});