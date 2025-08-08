/**
 * VideoPlanet Production Deployment Test
 * 프로덕션 배포 후 주요 기능 검증
 */

const https = require('https');

// 테스트 설정
const PROD_URL = 'https://www.vlanet.net';
const API_URL = 'https://videoplanet.up.railway.app';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// HTTPS 요청 함수
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers, 
        data 
      }));
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

// 테스트 실행
async function runTests() {
  console.log(`${colors.cyan}===================================`);
  console.log(`VideoPlanet Production Deployment Test`);
  console.log(`===================================\n${colors.reset}`);
  
  const tests = [];
  
  // 1. 프론트엔드 접근성
  try {
    console.log(`${colors.blue}[1/6] 프론트엔드 접근성 테스트...${colors.reset}`);
    const res = await httpsRequest(PROD_URL);
    if (res.statusCode === 200) {
      console.log(`${colors.green}✅ 프론트엔드 정상 응답 (200 OK)${colors.reset}`);
      tests.push({ name: '프론트엔드 접근성', passed: true });
    } else {
      console.log(`${colors.red}❌ 프론트엔드 응답 오류: ${res.statusCode}${colors.reset}`);
      tests.push({ name: '프론트엔드 접근성', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 프론트엔드 연결 실패: ${error.message}${colors.reset}`);
    tests.push({ name: '프론트엔드 접근성', passed: false });
  }
  
  // 2. 백엔드 API 헬스체크
  try {
    console.log(`${colors.blue}[2/6] 백엔드 API 헬스체크...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/health/`);
    if (res.statusCode === 200) {
      console.log(`${colors.green}✅ 백엔드 API 정상 (200 OK)${colors.reset}`);
      tests.push({ name: '백엔드 API', passed: true });
    } else {
      console.log(`${colors.red}❌ 백엔드 API 응답 오류: ${res.statusCode}${colors.reset}`);
      tests.push({ name: '백엔드 API', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 백엔드 API 연결 실패: ${error.message}${colors.reset}`);
    tests.push({ name: '백엔드 API', passed: false });
  }
  
  // 3. CORS 설정 확인
  try {
    console.log(`${colors.blue}[3/6] CORS 설정 확인...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/health/`, {
      headers: {
        'Origin': 'https://www.vlanet.net'
      }
    });
    if (res.headers['access-control-allow-origin']) {
      console.log(`${colors.green}✅ CORS 설정 정상${colors.reset}`);
      tests.push({ name: 'CORS 설정', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ CORS 헤더 없음${colors.reset}`);
      tests.push({ name: 'CORS 설정', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ CORS 확인 실패: ${error.message}${colors.reset}`);
    tests.push({ name: 'CORS 설정', passed: false });
  }
  
  // 4. 보안 헤더 확인
  try {
    console.log(`${colors.blue}[4/6] 보안 헤더 확인...${colors.reset}`);
    const res = await httpsRequest(PROD_URL);
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options'
    ];
    
    let hasAllHeaders = true;
    for (const header of securityHeaders) {
      if (!res.headers[header]) {
        console.log(`${colors.yellow}⚠️ ${header} 헤더 없음${colors.reset}`);
        hasAllHeaders = false;
      }
    }
    
    if (hasAllHeaders) {
      console.log(`${colors.green}✅ 모든 보안 헤더 설정됨${colors.reset}`);
      tests.push({ name: '보안 헤더', passed: true });
    } else {
      tests.push({ name: '보안 헤더', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 보안 헤더 확인 실패: ${error.message}${colors.reset}`);
    tests.push({ name: '보안 헤더', passed: false });
  }
  
  // 5. 정적 리소스 로딩
  try {
    console.log(`${colors.blue}[5/6] 정적 리소스 로딩 테스트...${colors.reset}`);
    const res = await httpsRequest(PROD_URL);
    if (res.data.includes('/_next/static/')) {
      console.log(`${colors.green}✅ Next.js 정적 리소스 로딩 정상${colors.reset}`);
      tests.push({ name: '정적 리소스', passed: true });
    } else {
      console.log(`${colors.red}❌ 정적 리소스 로딩 실패${colors.reset}`);
      tests.push({ name: '정적 리소스', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 정적 리소스 테스트 실패: ${error.message}${colors.reset}`);
    tests.push({ name: '정적 리소스', passed: false });
  }
  
  // 6. 인증 엔드포인트 접근성
  try {
    console.log(`${colors.blue}[6/6] 인증 엔드포인트 접근성...${colors.reset}`);
    const res = await httpsRequest(`${API_URL}/api/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({})
    });
    // 400 Bad Request는 정상 (엔드포인트가 존재함)
    if (res.statusCode === 400 || res.statusCode === 401) {
      console.log(`${colors.green}✅ 인증 엔드포인트 접근 가능${colors.reset}`);
      tests.push({ name: '인증 엔드포인트', passed: true });
    } else {
      console.log(`${colors.yellow}⚠️ 예상치 못한 응답: ${res.statusCode}${colors.reset}`);
      tests.push({ name: '인증 엔드포인트', passed: false });
    }
  } catch (error) {
    console.log(`${colors.red}❌ 인증 엔드포인트 테스트 실패: ${error.message}${colors.reset}`);
    tests.push({ name: '인증 엔드포인트', passed: false });
  }
  
  // 결과 요약
  console.log(`\n${colors.cyan}===================================`);
  console.log(`테스트 결과 요약`);
  console.log(`===================================${colors.reset}\n`);
  
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;
  const percentage = Math.round((passed / total) * 100);
  
  tests.forEach((test, index) => {
    const status = test.passed ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    console.log(`${index + 1}. ${test.name}: ${status}${colors.reset}`);
  });
  
  console.log(`\n${colors.cyan}===================================`);
  if (percentage === 100) {
    console.log(`${colors.green}🎉 모든 테스트 통과! (${passed}/${total})${colors.reset}`);
  } else if (percentage >= 80) {
    console.log(`${colors.yellow}⚠️ 대부분 테스트 통과 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 테스트 실패 (${passed}/${total}) - ${percentage}%${colors.reset}`);
  }
  console.log(`${colors.cyan}===================================${colors.reset}\n`);
  
  // 배포 상태
  console.log(`${colors.blue}📊 배포 정보:${colors.reset}`);
  console.log(`  - 프론트엔드: ${PROD_URL} (Vercel)`);
  console.log(`  - 백엔드: ${API_URL} (Railway)`);
  console.log(`  - 빌드 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`  - 버전: 1.0.16`);
}

// 테스트 실행
runTests().catch(console.error);