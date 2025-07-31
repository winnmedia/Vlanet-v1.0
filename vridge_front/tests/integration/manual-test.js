/**
 * VideoPlanet 사용자 여정 기반 수동 테스트 스크립트
 * 
 * 이 스크립트는 실제 사용자의 관점에서 웹서비스의 모든 핵심 기능을
 * MECE 방식으로 테스트하여 근본적인 오류를 찾아냅니다.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 테스트 설정
const CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'https://videoplanet.up.railway.app',
  timeout: 30000,
  headless: true, // 브라우저 UI 표시 안함 (headless mode)
  slowMo: 100, // 테스트 속도 조절
  testUser: {
    email: 'test_' + Date.now() + '@example.com',
    password: 'TestPass123!',
    name: '테스트 사용자'
  }
};

// 테스트 결과 저장
const testResults = {
  timestamp: new Date().toISOString(),
  journeys: {},
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errorPatterns: {}
  }
};

// 오류 패턴 분석기
class ErrorAnalyzer {
  constructor() {
    this.patterns = {
      rendering: [],
      api: [],
      navigation: [],
      validation: [],
      state: []
    };
  }

  analyze(error, context) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // 오류 패턴 분류
    if (error.message.includes('JSX') || error.message.includes('render')) {
      this.patterns.rendering.push(errorInfo);
    } else if (error.message.includes('404') || error.message.includes('500') || error.message.includes('API')) {
      this.patterns.api.push(errorInfo);
    } else if (error.message.includes('navigation') || error.message.includes('route')) {
      this.patterns.navigation.push(errorInfo);
    } else if (error.message.includes('validation') || error.message.includes('required')) {
      this.patterns.validation.push(errorInfo);
    } else {
      this.patterns.state.push(errorInfo);
    }

    return errorInfo;
  }

  getRootCause() {
    // 가장 많이 발생한 패턴 찾기
    const patternCounts = Object.entries(this.patterns).map(([type, errors]) => ({
      type,
      count: errors.length,
      errors
    })).sort((a, b) => b.count - a.count);

    return patternCounts[0];
  }
}

const errorAnalyzer = new ErrorAnalyzer();

// 테스트 유틸리티 함수
async function testStep(name, fn, context = {}) {
  console.log(`\n📍 테스트 중: ${name}`);
  testResults.summary.total++;
  
  try {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    console.log(`✅ 성공 (${duration}ms)`);
    testResults.summary.passed++;
    
    return { success: true, result, duration };
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
    testResults.summary.failed++;
    
    const errorInfo = errorAnalyzer.analyze(error, { step: name, ...context });
    testResults.errors.push(errorInfo);
    
    return { success: false, error: errorInfo };
  }
}

// Journey 1: 회원가입 및 온보딩
async function testSignupJourney(page) {
  console.log('\n🚀 Journey 1: 회원가입 및 온보딩 테스트 시작');
  const journey = { name: 'signup', steps: {} };

  // 홈페이지 접근
  journey.steps.homepage = await testStep('홈페이지 로딩', async () => {
    await page.goto(CONFIG.baseURL);
    await page.waitForSelector('body', { timeout: CONFIG.timeout });
    const title = await page.title();
    return { title };
  });

  // 회원가입 버튼 클릭
  journey.steps.signupButton = await testStep('회원가입 버튼 찾기', async () => {
    // 다양한 선택자 시도
    const selectors = [
      'a[href="/signup"]',
      'button:text("회원가입")',
      'button:text("Sign up")',
      'button:text("가입하기")',
      '.signup-button',
      '[data-testid="signup-button"]'
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        return { selector, url: page.url() };
      }
    }
    
    throw new Error('회원가입 버튼을 찾을 수 없습니다');
  });

  // 회원가입 폼 작성
  journey.steps.signupForm = await testStep('회원가입 폼 작성', async () => {
    // 이메일 입력
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    if (!emailInput) throw new Error('이메일 입력 필드를 찾을 수 없습니다');
    await emailInput.fill(CONFIG.testUser.email);

    // 비밀번호 입력
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');
    if (!passwordInput) throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
    await passwordInput.fill(CONFIG.testUser.password);

    // 비밀번호 확인
    const confirmInput = await page.$('input[name="confirmPassword"], input[name="passwordConfirm"], #confirmPassword');
    if (confirmInput) {
      await confirmInput.fill(CONFIG.testUser.password);
    }

    // 이름 입력
    const nameInput = await page.$('input[name="name"], input[name="username"], #name');
    if (nameInput) {
      await nameInput.fill(CONFIG.testUser.name);
    }

    return { formFilled: true };
  });

  // 회원가입 제출
  journey.steps.submit = await testStep('회원가입 제출', async () => {
    const submitButton = await page.$('button[type="submit"], button:text("가입하기"), button:text("회원가입")');
    if (!submitButton) throw new Error('제출 버튼을 찾을 수 없습니다');
    
    await submitButton.click();
    
    // 응답 대기 (성공 또는 오류)
    await page.waitForTimeout(3000);
    
    // 오류 메시지 확인
    const errorMessage = await page.$('.error-message, .alert-danger, [role="alert"]');
    if (errorMessage) {
      const text = await errorMessage.textContent();
      throw new Error(`회원가입 실패: ${text}`);
    }
    
    return { submitted: true, url: page.url() };
  });

  testResults.journeys.signup = journey;
  return journey;
}

// Journey 2: 로그인 및 프로젝트 관리
async function testProjectJourney(page) {
  console.log('\n🚀 Journey 2: 로그인 및 프로젝트 관리 테스트 시작');
  const journey = { name: 'project', steps: {} };

  // 로그인 페이지로 이동
  journey.steps.loginPage = await testStep('로그인 페이지 이동', async () => {
    await page.goto(CONFIG.baseURL + '/login');
    await page.waitForLoadState('networkidle');
    return { url: page.url() };
  });

  // 로그인 시도
  journey.steps.login = await testStep('로그인 시도', async () => {
    // 테스트 계정으로 로그인
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (!emailInput || !passwordInput) {
      throw new Error('로그인 폼 요소를 찾을 수 없습니다');
    }

    await emailInput.fill('test@example.com'); // 기존 테스트 계정
    await passwordInput.fill('Test123!');
    
    const submitButton = await page.$('button[type="submit"], button:text("로그인")');
    await submitButton.click();
    
    // 로그인 후 리다이렉션 대기
    await page.waitForTimeout(3000);
    
    return { loggedIn: true, url: page.url() };
  });

  // 프로젝트 생성 테스트
  journey.steps.createProject = await testStep('프로젝트 생성', async () => {
    // 프로젝트 생성 버튼 찾기
    const createButton = await page.$('a[href*="create"], button:text("프로젝트 생성"), button:text("새 프로젝트")');
    if (!createButton) {
      throw new Error('프로젝트 생성 버튼을 찾을 수 없습니다');
    }

    await createButton.click();
    await page.waitForLoadState('networkidle');

    // 프로젝트 정보 입력
    const projectName = await page.$('input[name="name"], input[name="projectName"], #projectName');
    if (projectName) {
      await projectName.fill('테스트 프로젝트 ' + Date.now());
    }

    const description = await page.$('textarea[name="description"], #description');
    if (description) {
      await description.fill('자동 테스트로 생성된 프로젝트입니다.');
    }

    return { formReady: true };
  });

  testResults.journeys.project = journey;
  return journey;
}

// Journey 3: 피드백 시스템
async function testFeedbackJourney(page) {
  console.log('\n🚀 Journey 3: 피드백 시스템 테스트 시작');
  const journey = { name: 'feedback', steps: {} };

  journey.steps.feedbackPage = await testStep('피드백 페이지 접근', async () => {
    // 프로젝트 목록에서 첫 번째 프로젝트 선택
    await page.goto(CONFIG.baseURL + '/cmshome');
    await page.waitForLoadState('networkidle');

    const projectLink = await page.$('.project-item a, [data-testid="project-link"]');
    if (projectLink) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
    }

    return { url: page.url() };
  });

  journey.steps.feedbackCreate = await testStep('피드백 작성', async () => {
    const feedbackButton = await page.$('button:text("피드백"), a[href*="feedback"]');
    if (feedbackButton) {
      await feedbackButton.click();
      await page.waitForTimeout(2000);
    }

    const feedbackInput = await page.$('textarea[name="feedback"], #feedback-input');
    if (feedbackInput) {
      await feedbackInput.fill('테스트 피드백입니다.');
    }

    return { feedbackReady: true };
  });

  testResults.journeys.feedback = journey;
  return journey;
}

// 모든 버튼과 링크 검사
async function testAllButtons(page) {
  console.log('\n🔍 모든 버튼과 링크 MECE 분석');
  
  const buttons = await page.$$('button, a[href], input[type="submit"]');
  console.log(`총 ${buttons.length}개의 인터랙티브 요소 발견`);

  const buttonAnalysis = {
    total: buttons.length,
    working: 0,
    broken: 0,
    details: []
  };

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    try {
      const text = await button.textContent();
      const href = await button.getAttribute('href');
      const type = await button.evaluate(el => el.tagName);
      
      // 클릭 가능 여부 확인
      const isClickable = await button.isEnabled();
      
      buttonAnalysis.details.push({
        index: i,
        type,
        text: text?.trim(),
        href,
        clickable: isClickable
      });

      if (isClickable) {
        buttonAnalysis.working++;
      } else {
        buttonAnalysis.broken++;
      }
    } catch (error) {
      buttonAnalysis.broken++;
    }
  }

  return buttonAnalysis;
}

// 메인 테스트 실행
async function runTests() {
  console.log('🏁 VideoPlanet 사용자 여정 테스트 시작');
  console.log(`설정: ${JSON.stringify(CONFIG, null, 2)}`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // 콘솔 메시지 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errorAnalyzer.analyze(new Error(msg.text()), { type: 'console' });
    }
  });

  // 페이지 오류 수집
  page.on('pageerror', error => {
    errorAnalyzer.analyze(error, { type: 'page' });
  });

  try {
    // Journey 테스트 실행
    await testSignupJourney(page);
    await testProjectJourney(page);
    await testFeedbackJourney(page);

    // 모든 버튼 분석
    await page.goto(CONFIG.baseURL);
    const buttonAnalysis = await testAllButtons(page);
    testResults.buttonAnalysis = buttonAnalysis;

  } catch (error) {
    console.error('테스트 중 치명적 오류:', error);
    testResults.fatalError = error.message;
  } finally {
    await browser.close();
  }

  // 근본 원인 분석
  const rootCause = errorAnalyzer.getRootCause();
  testResults.rootCause = rootCause;

  // 결과 저장
  const resultsPath = path.join(__dirname, 'manual-test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));

  // 요약 출력
  console.log('\n📊 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`총 테스트: ${testResults.summary.total}`);
  console.log(`성공: ${testResults.summary.passed}`);
  console.log(`실패: ${testResults.summary.failed}`);
  console.log(`성공률: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(2)}%`);
  
  if (rootCause && rootCause.count > 0) {
    console.log(`\n🔴 주요 오류 패턴: ${rootCause.type} (${rootCause.count}건)`);
    console.log('근본 원인 후보:');
    rootCause.errors.slice(0, 3).forEach(error => {
      console.log(`- ${error.context.step}: ${error.message}`);
    });
  }

  console.log(`\n💾 상세 결과는 ${resultsPath}에 저장되었습니다.`);
}

// 테스트 실행
runTests().catch(console.error);