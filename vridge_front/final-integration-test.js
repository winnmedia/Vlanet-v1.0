/**
 * VideoPlanet 최종 통합 테스트
 * 모든 시스템이 정상 작동하는지 확인
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
      },
      timeout: 10000
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// 재시도 로직
async function retryRequest(fn, maxRetries = 3, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`${colors.yellow}재시도 ${i + 1}/${maxRetries}...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 메인 테스트
async function runTests() {
  console.log(`\n${colors.cyan}===================================`);
  console.log(`VideoPlanet 최종 통합 테스트`);
  console.log(`시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`===================================\n${colors.reset}`);

  const results = {
    infrastructure: [],
    frontend: [],
    backend: [],
    integration: []
  };

  // 1. 인프라 테스트
  console.log(`${colors.blue}[인프라 테스트]${colors.reset}`);
  
  // 1.1 프론트엔드 서버
  try {
    console.log(`  프론트엔드 서버 확인...`);
    const res = await retryRequest(() => httpsRequest(FRONTEND_URL));
    if (res.statusCode === 200) {
      console.log(`  ${colors.green}✅ Vercel 프론트엔드 정상${colors.reset}`);
      results.infrastructure.push({ test: 'Vercel 프론트엔드', passed: true });
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Vercel 프론트엔드 오류: ${error.message}${colors.reset}`);
    results.infrastructure.push({ test: 'Vercel 프론트엔드', passed: false });
  }

  // 1.2 백엔드 API 서버
  try {
    console.log(`  백엔드 API 서버 확인...`);
    const res = await retryRequest(() => httpsRequest(`${API_URL}/api/health/`));
    if (res.statusCode === 200) {
      console.log(`  ${colors.green}✅ Railway 백엔드 정상${colors.reset}`);
      results.infrastructure.push({ test: 'Railway 백엔드', passed: true });
    } else if (res.statusCode === 502) {
      console.log(`  ${colors.yellow}⚠️ Railway 재배포 중 (5-10분 소요)${colors.reset}`);
      results.infrastructure.push({ test: 'Railway 백엔드', passed: false, note: '재배포 중' });
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Railway 백엔드 오류: ${error.message}${colors.reset}`);
    results.infrastructure.push({ test: 'Railway 백엔드', passed: false });
  }

  // 2. 프론트엔드 테스트
  console.log(`\n${colors.blue}[프론트엔드 테스트]${colors.reset}`);
  
  // 2.1 정적 리소스
  try {
    console.log(`  정적 리소스 로딩 확인...`);
    const res = await httpsRequest(FRONTEND_URL);
    if (res.data.includes('_next/static')) {
      console.log(`  ${colors.green}✅ Next.js 번들 로딩 정상${colors.reset}`);
      results.frontend.push({ test: 'Next.js 번들', passed: true });
    } else {
      throw new Error('번들 없음');
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Next.js 번들 오류${colors.reset}`);
    results.frontend.push({ test: 'Next.js 번들', passed: false });
  }

  // 2.2 로그인 페이지
  try {
    console.log(`  로그인 페이지 확인...`);
    const res = await httpsRequest(`${FRONTEND_URL}/login`);
    if (res.statusCode === 200) {
      console.log(`  ${colors.green}✅ 로그인 페이지 접근 가능${colors.reset}`);
      results.frontend.push({ test: '로그인 페이지', passed: true });
    } else {
      throw new Error(`Status: ${res.statusCode}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ 로그인 페이지 오류${colors.reset}`);
    results.frontend.push({ test: '로그인 페이지', passed: false });
  }

  // 3. 백엔드 테스트 (API가 정상일 때만)
  const apiHealthy = results.infrastructure.find(r => r.test === 'Railway 백엔드')?.passed;
  
  if (apiHealthy) {
    console.log(`\n${colors.blue}[백엔드 테스트]${colors.reset}`);
    
    // 3.1 인증 엔드포인트 상태
    try {
      console.log(`  인증 엔드포인트 상태 확인...`);
      const res = await httpsRequest(`${API_URL}/api/debug/auth-status/`);
      if (res.statusCode === 200) {
        const data = JSON.parse(res.data);
        console.log(`  ${colors.green}✅ 인증 엔드포인트 등록됨${colors.reset}`);
        console.log(`    - Login: ${data.endpoints?.auth_login?.status || 'unknown'}`);
        console.log(`    - Signup: ${data.endpoints?.auth_signup?.status || 'unknown'}`);
        results.backend.push({ test: '인증 엔드포인트', passed: true });
      } else {
        throw new Error(`Status: ${res.statusCode}`);
      }
    } catch (error) {
      console.log(`  ${colors.yellow}⚠️ 디버그 엔드포인트 미설정${colors.reset}`);
      results.backend.push({ test: '인증 엔드포인트', passed: false });
    }

    // 3.2 CORS 설정
    try {
      console.log(`  CORS 설정 확인...`);
      const res = await httpsRequest(`${API_URL}/api/health/`, {
        headers: { 'Origin': 'https://www.vlanet.net' }
      });
      if (res.headers['access-control-allow-origin']) {
        console.log(`  ${colors.green}✅ CORS 설정 정상${colors.reset}`);
        results.backend.push({ test: 'CORS', passed: true });
      } else {
        throw new Error('CORS 헤더 없음');
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ CORS 설정 오류${colors.reset}`);
      results.backend.push({ test: 'CORS', passed: false });
    }
  } else {
    console.log(`\n${colors.yellow}⏭️ 백엔드가 재배포 중이므로 API 테스트 건너뜀${colors.reset}`);
  }

  // 4. 통합 테스트
  if (apiHealthy) {
    console.log(`\n${colors.blue}[통합 테스트]${colors.reset}`);
    
    // 4.1 로그인 플로우
    try {
      console.log(`  로그인 플로우 테스트...`);
      const res = await httpsRequest(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        body: {
          username: 'test@test.com',
          password: 'test123'
        }
      });
      if (res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401) {
        console.log(`  ${colors.green}✅ 로그인 API 응답${colors.reset}`);
        results.integration.push({ test: '로그인 플로우', passed: true });
      } else if (res.statusCode === 404) {
        console.log(`  ${colors.yellow}⚠️ 로그인 엔드포인트 미등록${colors.reset}`);
        results.integration.push({ test: '로그인 플로우', passed: false });
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ 로그인 플로우 오류${colors.reset}`);
      results.integration.push({ test: '로그인 플로우', passed: false });
    }
  }

  // 결과 요약
  console.log(`\n${colors.cyan}===================================`);
  console.log(`테스트 결과 요약`);
  console.log(`===================================\n${colors.reset}`);

  const allResults = [
    ...results.infrastructure,
    ...results.frontend,
    ...results.backend,
    ...results.integration
  ];

  const passed = allResults.filter(r => r.passed).length;
  const total = allResults.length;
  const percentage = Math.round((passed / total) * 100);

  // 카테고리별 결과
  console.log(`${colors.blue}인프라:${colors.reset}`);
  results.infrastructure.forEach(r => {
    const status = r.passed ? `${colors.green}✅` : `${colors.red}❌`;
    const note = r.note ? ` (${r.note})` : '';
    console.log(`  ${status} ${r.test}${note}${colors.reset}`);
  });

  console.log(`\n${colors.blue}프론트엔드:${colors.reset}`);
  results.frontend.forEach(r => {
    const status = r.passed ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(`  ${status} ${r.test}${colors.reset}`);
  });

  if (results.backend.length > 0) {
    console.log(`\n${colors.blue}백엔드:${colors.reset}`);
    results.backend.forEach(r => {
      const status = r.passed ? `${colors.green}✅` : `${colors.red}❌`;
      console.log(`  ${status} ${r.test}${colors.reset}`);
    });
  }

  if (results.integration.length > 0) {
    console.log(`\n${colors.blue}통합:${colors.reset}`);
    results.integration.forEach(r => {
      const status = r.passed ? `${colors.green}✅` : `${colors.red}❌`;
      console.log(`  ${status} ${r.test}${colors.reset}`);
    });
  }

  // 최종 점수
  console.log(`\n${colors.cyan}===================================`);
  if (percentage === 100) {
    console.log(`${colors.green}🎉 완벽! 모든 시스템 정상 작동! (${passed}/${total})${colors.reset}`);
  } else if (percentage >= 75) {
    console.log(`${colors.green}✅ 우수! 대부분 정상 작동 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else if (percentage >= 50) {
    console.log(`${colors.yellow}⚠️ 부분 작동 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 점검 필요 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  }
  console.log(`${colors.cyan}===================================\n${colors.reset}`);

  // 배포 상태 안내
  if (!apiHealthy) {
    console.log(`${colors.yellow}📝 Railway 재배포 안내:${colors.reset}`);
    console.log(`  - 보통 5-10분 소요됩니다`);
    console.log(`  - 완료 후 다시 테스트: node final-integration-test.js`);
    console.log(`  - 상태 확인: curl ${API_URL}/api/health/`);
  }

  // GitHub Actions 안내
  console.log(`\n${colors.blue}📊 GitHub Actions:${colors.reset}`);
  console.log(`  - 상태 확인: https://github.com/winnmedia/Vlanet-v1.0/actions`);
  console.log(`  - 첫 실행은 Secrets 설정 필요`);
  console.log(`  - 설정 도구: ./scripts/setup-github-secrets.sh`);

  console.log(`\n${colors.cyan}테스트 완료: ${new Date().toLocaleString('ko-KR')}${colors.reset}\n`);
}

// 실행
console.log(`${colors.cyan}VideoPlanet 최종 통합 테스트를 시작합니다...${colors.reset}`);
runTests().catch(error => {
  console.error(`${colors.red}테스트 중 오류 발생:${colors.reset}`, error);
});