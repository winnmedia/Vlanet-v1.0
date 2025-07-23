const axios = require('axios');
const fs = require('fs');

// 테스트 설정
const API_URL = 'https://api.vlanet.net';
const LOCAL_URL = 'http://localhost:3000';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// 테스트 결과
const testResults = {
  pageRouting: [],
  mainFeatures: [],
  uiComponents: [],
  dataFlow: [],
  errorHandling: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// 로그 함수
function log(category, test, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  console.log(`${icon} ${color}[${category}]${colors.reset} ${test} ${message ? `- ${message}` : ''}`);
  
  testResults[category].push({ test, status, message });
  testResults.summary.total++;
  if (status === 'pass') testResults.summary.passed++;
  else if (status === 'fail') testResults.summary.failed++;
  else testResults.summary.warnings++;
}

// API 테스트
async function testAPIs() {
  console.log(`${colors.blue}${colors.bold}\n📋 VideoPlanet 종합 기능 테스트 시작${colors.reset}\n`);

  // 1. API 연결 테스트
  console.log(`${colors.cyan}${colors.bold}1️⃣ API 연결 테스트${colors.reset}`);
  
  try {
    const health = await axios.get(`${API_URL}/api/health/`);
    log('dataFlow', 'API 헬스체크', 'pass', `상태: ${health.data.status}`);
  } catch (error) {
    log('dataFlow', 'API 헬스체크', 'fail', error.message);
  }

  // 2. 페이지 라우팅 테스트 (API 호출로 확인)
  console.log(`\n${colors.cyan}${colors.bold}2️⃣ 페이지 라우팅 테스트${colors.reset}`);
  
  const routes = [
    { path: '/', name: '홈페이지' },
    { path: '/login', name: '로그인' },
    { path: '/signup', name: '회원가입' },
    { path: '/privacy', name: '개인정보처리방침' },
    { path: '/terms', name: '이용약관' }
  ];

  for (const route of routes) {
    try {
      const response = await axios.get(`${LOCAL_URL}${route.path}`, {
        validateStatus: (status) => status < 500
      });
      log('pageRouting', route.name, response.status < 400 ? 'pass' : 'warning', 
        `상태 코드: ${response.status}`);
    } catch (error) {
      log('pageRouting', route.name, 'fail', error.message);
    }
  }

  // 3. 주요 API 엔드포인트 테스트
  console.log(`\n${colors.cyan}${colors.bold}3️⃣ 주요 API 엔드포인트 테스트${colors.reset}`);

  const endpoints = [
    { method: 'GET', path: '/api/auth/check/', name: '인증 체크' },
    { method: 'POST', path: '/api/auth/login/', name: '로그인', requiresBody: true },
    { method: 'POST', path: '/api/auth/register/', name: '회원가입', requiresBody: true },
    { method: 'GET', path: '/api/projects/', name: '프로젝트 목록', requiresAuth: true },
    { method: 'GET', path: '/api/feedbacks/', name: '피드백 목록', requiresAuth: true }
  ];

  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        validateStatus: (status) => true
      };

      if (endpoint.requiresBody) {
        config.data = {};
      }

      const response = await axios(config);
      
      if (endpoint.requiresAuth && response.status === 401) {
        log('mainFeatures', endpoint.name, 'pass', '인증 필요 (정상)');
      } else if (endpoint.requiresBody && response.status === 400) {
        log('mainFeatures', endpoint.name, 'pass', '데이터 검증 작동');
      } else if (response.status < 400) {
        log('mainFeatures', endpoint.name, 'pass', `상태: ${response.status}`);
      } else {
        log('mainFeatures', endpoint.name, 'warning', `상태: ${response.status}`);
      }
    } catch (error) {
      log('mainFeatures', endpoint.name, 'fail', error.message);
    }
  }

  // 4. 에러 처리 테스트
  console.log(`\n${colors.cyan}${colors.bold}4️⃣ 에러 처리 테스트${colors.reset}`);

  // 404 에러
  try {
    await axios.get(`${API_URL}/api/nonexistent-endpoint/`);
    log('errorHandling', '404 에러 처리', 'fail', '존재하지 않는 엔드포인트가 에러를 반환하지 않음');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log('errorHandling', '404 에러 처리', 'pass', '올바른 404 반환');
    } else {
      log('errorHandling', '404 에러 처리', 'fail', error.message);
    }
  }

  // 잘못된 메소드
  try {
    await axios.put(`${API_URL}/api/auth/check/`);
    log('errorHandling', '메소드 에러 처리', 'fail', '잘못된 메소드가 허용됨');
  } catch (error) {
    if (error.response && error.response.status === 405) {
      log('errorHandling', '메소드 에러 처리', 'pass', '올바른 405 반환');
    } else {
      log('errorHandling', '메소드 에러 처리', 'warning', `상태: ${error.response?.status || 'unknown'}`);
    }
  }

  // 5. 프로젝트 구조 확인
  console.log(`\n${colors.cyan}${colors.bold}5️⃣ 프로젝트 구조 확인${colors.reset}`);

  const requiredFiles = [
    { path: 'pages/_app.js', name: 'Next.js App 컴포넌트' },
    { path: 'pages/index.js', name: '홈페이지' },
    { path: 'pages/login.js', name: '로그인 페이지' },
    { path: 'src/util/util.js', name: '유틸리티 함수' },
    { path: 'src/api/project.js', name: '프로젝트 API' },
    { path: 'src/api/feedback.js', name: '피드백 API' }
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file.path)) {
      log('uiComponents', file.name, 'pass', '파일 존재');
    } else {
      log('uiComponents', file.name, 'fail', '파일 없음');
    }
  }

  // 결과 요약
  console.log(`\n${colors.blue}${colors.bold}📊 테스트 결과 요약${colors.reset}\n`);
  console.log(`총 테스트: ${testResults.summary.total}`);
  console.log(`${colors.green}✅ 성공: ${testResults.summary.passed}${colors.reset}`);
  console.log(`${colors.red}❌ 실패: ${testResults.summary.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  경고: ${testResults.summary.warnings}${colors.reset}`);

  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(`\n${colors.bold}성공률: ${successRate}%${colors.reset}`);

  // 주요 문제점 분석
  if (testResults.summary.failed > 0) {
    console.log(`\n${colors.red}${colors.bold}🔍 주요 문제점:${colors.reset}`);
    Object.entries(testResults).forEach(([category, tests]) => {
      if (Array.isArray(tests)) {
        const failures = tests.filter(t => t.status === 'fail');
        if (failures.length > 0) {
          console.log(`\n${colors.red}[${category}]${colors.reset}`);
          failures.forEach(f => console.log(`  - ${f.test}: ${f.message}`));
        }
      }
    });
  }

  // 상세 보고서 저장
  fs.writeFileSync('simple-test-report.json', JSON.stringify(testResults, null, 2));
  console.log(`\n${colors.gray}상세 테스트 보고서가 simple-test-report.json에 저장되었습니다.${colors.reset}`);
}

// 테스트 실행
testAPIs().catch(console.error);