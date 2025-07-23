const puppeteer = require('puppeteer');
const axios = require('axios');

// chalk 대체 함수들
const chalk = {
  blue: { bold: (str) => `\x1b[34m\x1b[1m${str}\x1b[0m` },
  cyan: { bold: (str) => `\x1b[36m\x1b[1m${str}\x1b[0m` },
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  red: { bold: (str) => `\x1b[31m\x1b[1m${str}\x1b[0m` },
  red: (str) => `\x1b[31m${str}\x1b[0m`,
  yellow: { bold: (str) => `\x1b[33m\x1b[1m${str}\x1b[0m` },
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
  white: (str) => str,
  gray: (str) => `\x1b[90m${str}\x1b[0m`,
  bold: (str) => `\x1b[1m${str}\x1b[0m`
};

// 테스트 설정
const BASE_URL = 'http://localhost:3000';
const API_URL = 'https://api.vlanet.net';
const TEST_USER = {
  email: 'test@vlanet.net',
  password: 'testPassword123!'
};

// 테스트 결과 저장
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

// 헬퍼 함수
function log(category, test, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? chalk.green : status === 'fail' ? chalk.red : chalk.yellow;
  console.log(`${icon} ${color(`[${category}]`)} ${test} ${message ? `- ${message}` : ''}`);
  
  testResults[category].push({ test, status, message });
  testResults.summary.total++;
  if (status === 'pass') testResults.summary.passed++;
  else if (status === 'fail') testResults.summary.failed++;
  else testResults.summary.warnings++;
}

// 브라우저 테스트
async function runBrowserTests() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 콘솔 에러 캐치
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(chalk.blue.bold('\n📋 VideoPlanet 종합 기능 테스트 시작\n'));

    // 1. 페이지 라우팅 테스트
    console.log(chalk.cyan.bold('1️⃣ 페이지 라우팅 테스트'));
    
    const routes = [
      { path: '/', name: '홈페이지' },
      { path: '/login', name: '로그인' },
      { path: '/signup', name: '회원가입' },
      { path: '/cmshome', name: 'CMS 홈', auth: true },
      { path: '/project/create', name: '프로젝트 생성', auth: true },
      { path: '/calendar', name: '캘린더', auth: true },
      { path: '/videoplanning', name: '영상 기획', auth: true },
      { path: '/mypage', name: '마이페이지', auth: true },
      { path: '/feedbackall', name: '피드백 관리', auth: true },
      { path: '/privacy', name: '개인정보처리방침' },
      { path: '/terms', name: '이용약관' },
      { path: '/nonexistent', name: '404 페이지', expect404: true }
    ];

    for (const route of routes) {
      try {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        if (route.expect404) {
          const is404 = response.status() === 404 || (await page.title()).includes('404');
          log('pageRouting', route.name, is404 ? 'pass' : 'fail', 
            is404 ? '404 페이지 정상 표시' : '404 페이지 표시 실패');
        } else if (route.auth && !await page.$('#login-form')) {
          // 인증이 필요한 페이지인데 로그인 폼이 없으면 리다이렉트 확인
          const currentUrl = page.url();
          const isRedirected = currentUrl.includes('/login');
          log('pageRouting', route.name, isRedirected ? 'pass' : 'fail',
            isRedirected ? '로그인 페이지로 리다이렉트' : '인증 체크 실패');
        } else {
          log('pageRouting', route.name, response.status() === 200 ? 'pass' : 'fail',
            `상태 코드: ${response.status()}`);
        }
      } catch (error) {
        log('pageRouting', route.name, 'fail', error.message);
      }
    }

    // 2. 주요 기능 테스트
    console.log(chalk.cyan.bold('\n2️⃣ 주요 기능 테스트'));

    // 로그인 프로세스
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    // 로그인 폼 존재 확인
    const loginForm = await page.$('#login-form');
    log('mainFeatures', '로그인 폼 렌더링', loginForm ? 'pass' : 'fail');

    if (loginForm) {
      // 로그인 입력 필드 확인
      const emailInput = await page.$('input[name="email"], input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"], button.login-button');

      log('mainFeatures', '로그인 입력 필드', 
        emailInput && passwordInput ? 'pass' : 'fail',
        '이메일/비밀번호 입력 필드 확인');

      log('mainFeatures', '로그인 버튼', 
        submitButton ? 'pass' : 'fail',
        '로그인 제출 버튼 확인');
    }

    // 3. UI 컴포넌트 체크
    console.log(chalk.cyan.bold('\n3️⃣ UI 컴포넌트 체크'));

    // 홈페이지 UI 컴포넌트
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // 헤더/네비게이션
    const header = await page.$('header, nav, .header, .navigation');
    log('uiComponents', '헤더/네비게이션', header ? 'pass' : 'fail');

    // 로고
    const logo = await page.$('img[alt*="logo"], .logo, a[href="/"] img');
    log('uiComponents', '로고', logo ? 'pass' : 'fail');

    // 버튼 스타일 확인
    const buttons = await page.$$('button, .button, .btn');
    log('uiComponents', '버튼 컴포넌트', buttons.length > 0 ? 'pass' : 'fail',
      `${buttons.length}개 버튼 발견`);

    // 반응형 디자인 체크
    await page.setViewport({ width: 375, height: 667 }); // 모바일
    await page.reload({ waitUntil: 'networkidle0' });
    const mobileLayout = await page.$('.mobile-menu, .hamburger, [class*="mobile"]');
    log('uiComponents', '모바일 반응형', mobileLayout ? 'pass' : 'warning',
      mobileLayout ? '모바일 레이아웃 확인' : '모바일 최적화 필요');

    // 4. 데이터 흐름 (API 테스트)
    console.log(chalk.cyan.bold('\n4️⃣ 데이터 흐름 테스트'));

    // API 헬스체크
    try {
      const healthCheck = await axios.get(`${API_URL}/api/health/`);
      log('dataFlow', 'API 헬스체크', healthCheck.status === 200 ? 'pass' : 'fail',
        `상태: ${healthCheck.data.status || 'unknown'}`);
    } catch (error) {
      log('dataFlow', 'API 헬스체크', 'fail', error.message);
    }

    // Redux 상태 관리 확인
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    const hasRedux = await page.evaluate(() => {
      return window.__REDUX_DEVTOOLS_EXTENSION__ !== undefined || 
             window.store !== undefined;
    });
    log('dataFlow', 'Redux 상태 관리', hasRedux ? 'pass' : 'warning',
      hasRedux ? 'Redux 설정 확인' : 'Redux DevTools 미확인');

    // 5. 에러 처리
    console.log(chalk.cyan.bold('\n5️⃣ 에러 처리 테스트'));

    // 404 에러 처리
    await page.goto(`${BASE_URL}/nonexistent-page-12345`, { waitUntil: 'networkidle0' });
    const has404Page = await page.$('.not-found, .error-404, h1:contains("404")') ||
                       (await page.title()).includes('404');
    log('errorHandling', '404 에러 페이지', has404Page ? 'pass' : 'fail');

    // 잘못된 API 요청 처리
    try {
      await axios.get(`${API_URL}/api/invalid-endpoint/`);
      log('errorHandling', 'API 에러 처리', 'fail', '잘못된 엔드포인트가 에러를 반환하지 않음');
    } catch (error) {
      log('errorHandling', 'API 에러 처리', 'pass', 
        `올바른 에러 반환 (${error.response?.status || 'network error'})`);
    }

    // 콘솔 에러 체크
    log('errorHandling', '콘솔 에러', consoleErrors.length === 0 ? 'pass' : 'warning',
      consoleErrors.length > 0 ? `${consoleErrors.length}개 에러 발견` : '콘솔 에러 없음');

    if (consoleErrors.length > 0) {
      console.log(chalk.yellow('콘솔 에러 상세:'));
      consoleErrors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
    }

  } catch (error) {
    console.error(chalk.red('테스트 실행 중 오류:'), error);
  } finally {
    await browser.close();
  }

  // 테스트 결과 요약
  console.log(chalk.blue.bold('\n📊 테스트 결과 요약\n'));
  console.log(chalk.white(`총 테스트: ${testResults.summary.total}`));
  console.log(chalk.green(`✅ 성공: ${testResults.summary.passed}`));
  console.log(chalk.red(`❌ 실패: ${testResults.summary.failed}`));
  console.log(chalk.yellow(`⚠️  경고: ${testResults.summary.warnings}`));

  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(chalk.bold(`\n성공률: ${successRate}%`));

  // 주요 문제점 분석
  if (testResults.summary.failed > 0) {
    console.log(chalk.red.bold('\n🔍 주요 문제점:'));
    Object.entries(testResults).forEach(([category, tests]) => {
      if (Array.isArray(tests)) {
        const failures = tests.filter(t => t.status === 'fail');
        if (failures.length > 0) {
          console.log(chalk.red(`\n[${category}]`));
          failures.forEach(f => console.log(`  - ${f.test}: ${f.message}`));
        }
      }
    });
  }

  // 개선 권장사항
  if (testResults.summary.warnings > 0) {
    console.log(chalk.yellow.bold('\n💡 개선 권장사항:'));
    Object.entries(testResults).forEach(([category, tests]) => {
      if (Array.isArray(tests)) {
        const warnings = tests.filter(t => t.status === 'warning');
        if (warnings.length > 0) {
          console.log(chalk.yellow(`\n[${category}]`));
          warnings.forEach(w => console.log(`  - ${w.test}: ${w.message}`));
        }
      }
    });
  }

  // 상세 보고서 저장
  const fs = require('fs');
  fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(testResults, null, 2));
  console.log(chalk.gray('\n상세 테스트 보고서가 comprehensive-test-report.json에 저장되었습니다.'));
}

// 테스트 실행
runBrowserTests().catch(console.error);