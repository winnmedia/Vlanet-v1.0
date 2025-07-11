#!/usr/bin/env node

/**
 * VideoPlanet 종합 UI 테스트
 * 모든 페이지의 버튼, 입력 필드, 링크 등을 체계적으로 테스트
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';

// 테스트 계정
const TEST_EMAIL = 'uitest@example.com';
const TEST_PASSWORD = 'UITest123!';
const TEST_NICKNAME = 'UI테스터';

// 색상 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// 테스트 결과
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalPages: 0,
    testedPages: 0,
    totalElements: 0,
    interactiveElements: 0,
    nonInteractiveElements: 0,
    errors: []
  },
  pages: {},
  screenshots: []
};

/**
 * 스크린샷 저장
 */
async function takeScreenshot(page, name) {
  const filename = `screenshot-${name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
  const filepath = path.join(__dirname, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.screenshots.push({ name, filename });
  return filename;
}

/**
 * 회원가입
 */
async function signup(page) {
  console.log(`\n${colors.magenta}👤 테스트 계정 생성 중...${colors.reset}`);
  
  await page.goto(`${FRONTEND_URL}/Signup`, { waitUntil: 'networkidle2' });
  
  // 이메일 중복 확인
  await page.type('input[type="email"]', TEST_EMAIL);
  const checkButton = await page.$('button:has-text("중복확인")');
  if (checkButton) {
    await checkButton.click();
    await page.waitForTimeout(1000);
  }
  
  // 나머지 정보 입력
  await page.type('input[placeholder*="비밀번호"]', TEST_PASSWORD);
  const confirmPwInput = await page.$('input[placeholder*="비밀번호 확인"]');
  if (confirmPwInput) {
    await confirmPwInput.type(TEST_PASSWORD);
  }
  await page.type('input[placeholder*="닉네임"]', TEST_NICKNAME);
  
  // 회원가입 버튼 클릭
  const signupButton = await page.$('button[type="submit"]');
  if (signupButton) {
    await signupButton.click();
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
      console.log(`${colors.green}✅ 회원가입 성공${colors.reset}`);
    } catch (e) {
      console.log(`${colors.yellow}⚠️  회원가입 시도 (이미 가입된 계정일 수 있음)${colors.reset}`);
    }
  }
}

/**
 * 로그인
 */
async function login(page) {
  console.log(`\n${colors.cyan}🔐 로그인 중...${colors.reset}`);
  
  await page.goto(`${FRONTEND_URL}/Login`, { waitUntil: 'networkidle2' });
  
  // 로그인 폼 입력
  await page.type('input[type="email"]', TEST_EMAIL);
  await page.type('input[type="password"]', TEST_PASSWORD);
  
  // 로그인 버튼 클릭
  const loginButton = await page.$('button[type="submit"]');
  if (loginButton) {
    await loginButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`${colors.green}✅ 로그인 성공${colors.reset}`);
  }
}

/**
 * 페이지의 모든 인터랙티브 요소 분석
 */
async function analyzePageElements(page, pageName) {
  console.log(`\n${colors.cyan}📄 [${pageName}] 페이지 분석${colors.reset}`);
  
  const pageResults = {
    url: page.url(),
    title: await page.title(),
    elements: {
      buttons: [],
      links: [],
      inputs: [],
      textareas: [],
      selects: []
    },
    summary: {
      total: 0,
      interactive: 0,
      nonInteractive: 0
    }
  };
  
  // 1. 버튼 분석
  const buttons = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, [role="button"], .btn, .button');
    return Array.from(elements).map(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const isInteractive = rect.width > 0 && 
                           rect.height > 0 && 
                           style.display !== 'none' && 
                           style.visibility !== 'hidden' &&
                           style.pointerEvents !== 'none' &&
                           !el.disabled;
      
      // 클릭 가능 여부를 실제로 테스트
      let clickable = false;
      try {
        el.click();
        clickable = true;
      } catch (e) {
        clickable = false;
      }
      
      return {
        text: el.textContent?.trim() || '',
        type: el.type || 'button',
        className: el.className,
        id: el.id,
        disabled: el.disabled,
        visible: isInteractive,
        clickable: clickable,
        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    });
  });
  
  pageResults.elements.buttons = buttons;
  console.log(`  - 버튼: ${buttons.length}개 (활성: ${buttons.filter(b => b.clickable).length}개)`);
  
  // 2. 링크 분석
  const links = await page.evaluate(() => {
    const elements = document.querySelectorAll('a[href]');
    return Array.from(elements).map(el => {
      const style = window.getComputedStyle(el);
      const isInteractive = style.pointerEvents !== 'none' && 
                           style.display !== 'none' &&
                           style.visibility !== 'hidden';
      return {
        text: el.textContent?.trim() || '',
        href: el.href,
        target: el.target,
        interactive: isInteractive
      };
    });
  });
  
  pageResults.elements.links = links;
  console.log(`  - 링크: ${links.length}개 (활성: ${links.filter(l => l.interactive).length}개)`);
  
  // 3. 입력 필드 분석
  const inputs = await page.evaluate(() => {
    const elements = document.querySelectorAll('input:not([type="hidden"])');
    return Array.from(elements).map(el => {
      const isInteractive = !el.disabled && !el.readOnly;
      
      // 실제 포커스 가능 여부 테스트
      el.focus();
      const focusable = document.activeElement === el;
      el.blur();
      
      return {
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        value: el.value,
        disabled: el.disabled,
        readOnly: el.readOnly,
        required: el.required,
        interactive: isInteractive,
        focusable: focusable
      };
    });
  });
  
  pageResults.elements.inputs = inputs;
  console.log(`  - 입력필드: ${inputs.length}개 (활성: ${inputs.filter(i => i.interactive && i.focusable).length}개)`);
  
  // 4. 텍스트영역 분석
  const textareas = await page.evaluate(() => {
    const elements = document.querySelectorAll('textarea');
    return Array.from(elements).map(el => {
      const isInteractive = !el.disabled && !el.readOnly;
      el.focus();
      const focusable = document.activeElement === el;
      el.blur();
      
      return {
        name: el.name,
        placeholder: el.placeholder,
        disabled: el.disabled,
        readOnly: el.readOnly,
        required: el.required,
        interactive: isInteractive,
        focusable: focusable
      };
    });
  });
  
  pageResults.elements.textareas = textareas;
  console.log(`  - 텍스트영역: ${textareas.length}개 (활성: ${textareas.filter(t => t.interactive && t.focusable).length}개)`);
  
  // 5. 선택 상자 분석
  const selects = await page.evaluate(() => {
    const elements = document.querySelectorAll('select');
    return Array.from(elements).map(el => {
      const isInteractive = !el.disabled;
      return {
        name: el.name,
        options: el.options.length,
        disabled: el.disabled,
        required: el.required,
        interactive: isInteractive
      };
    });
  });
  
  pageResults.elements.selects = selects;
  console.log(`  - 선택상자: ${selects.length}개 (활성: ${selects.filter(s => s.interactive).length}개)`);
  
  // 요약 계산
  pageResults.summary.total = buttons.length + links.length + inputs.length + textareas.length + selects.length;
  pageResults.summary.interactive = 
    buttons.filter(b => b.clickable).length +
    links.filter(l => l.interactive).length +
    inputs.filter(i => i.interactive && i.focusable).length +
    textareas.filter(t => t.interactive && t.focusable).length +
    selects.filter(s => s.interactive).length;
  pageResults.summary.nonInteractive = pageResults.summary.total - pageResults.summary.interactive;
  
  // 전체 통계 업데이트
  results.summary.totalElements += pageResults.summary.total;
  results.summary.interactiveElements += pageResults.summary.interactive;
  results.summary.nonInteractiveElements += pageResults.summary.nonInteractive;
  
  return pageResults;
}

/**
 * 페이지 테스트
 */
async function testPage(page, path, name, needsAuth = false) {
  try {
    console.log(`\n${colors.magenta}🔍 ${name} 테스트 시작${colors.reset}`);
    
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 로그인이 필요한 경우 체크
    if (needsAuth && page.url().includes('/Login')) {
      await login(page);
      await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'networkidle2' });
    }
    
    // 페이지 로드 대기
    await page.waitForTimeout(2000);
    
    // 요소 분석
    const pageResults = await analyzePageElements(page, name);
    results.pages[name] = pageResults;
    
    // 스크린샷 저장
    const screenshot = await takeScreenshot(page, name);
    pageResults.screenshot = screenshot;
    
    results.summary.testedPages++;
    
    // 문제가 있는 요소 리포트
    const nonInteractive = pageResults.summary.nonInteractive;
    if (nonInteractive > 0) {
      console.log(`  ${colors.yellow}⚠️  ${nonInteractive}개의 비활성 요소 발견${colors.reset}`);
      
      // 비활성 버튼 상세 정보
      const disabledButtons = pageResults.elements.buttons.filter(b => !b.clickable);
      if (disabledButtons.length > 0) {
        console.log(`    비활성 버튼:`);
        disabledButtons.forEach(btn => {
          console.log(`      - "${btn.text}" ${btn.disabled ? '(disabled)' : '(클릭 불가)'}`);
        });
      }
    }
    
  } catch (error) {
    console.log(`  ${colors.red}❌ 테스트 실패: ${error.message}${colors.reset}`);
    results.summary.errors.push({ page: name, error: error.message });
  }
}

/**
 * 메인 테스트 실행
 */
async function runComprehensiveUITest() {
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}🚀 VideoPlanet 종합 UI 테스트${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`📅 테스트 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🔗 테스트 URL: ${FRONTEND_URL}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 콘솔 에러 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.summary.errors.push({
          type: 'console',
          message: msg.text()
        });
      }
    });
    
    // 페이지 에러 캡처
    page.on('pageerror', error => {
      results.summary.errors.push({
        type: 'page',
        message: error.message
      });
    });
    
    // 테스트할 페이지 목록
    const pagesToTest = [
      // 공개 페이지
      { path: '/', name: '홈페이지', needsAuth: false },
      { path: '/Login', name: '로그인', needsAuth: false },
      { path: '/Signup', name: '회원가입', needsAuth: false },
      { path: '/ResetPw', name: '비밀번호 재설정', needsAuth: false },
      { path: '/privacy', name: '개인정보처리방침', needsAuth: false },
      { path: '/terms', name: '이용약관', needsAuth: false },
      
      // 인증 필요 페이지
      { path: '/CmsHome', name: 'CMS 홈', needsAuth: true },
      { path: '/MyPage', name: '마이페이지', needsAuth: true },
      { path: '/ProjectCreate', name: '프로젝트 생성', needsAuth: true },
      { path: '/VideoPlanning', name: '영상 기획', needsAuth: true },
      { path: '/Calendar', name: '전체 일정', needsAuth: true },
      { path: '/FeedbackAll', name: '전체 피드백', needsAuth: true }
    ];
    
    results.summary.totalPages = pagesToTest.length;
    
    // 1. 회원가입 시도
    await signup(page);
    
    // 2. 각 페이지 테스트
    for (const pageInfo of pagesToTest) {
      await testPage(page, pageInfo.path, pageInfo.name, pageInfo.needsAuth);
    }
    
    // 3. 프로젝트 생성 후 피드백 페이지 테스트
    try {
      console.log(`\n${colors.magenta}🎬 프로젝트 관련 페이지 테스트${colors.reset}`);
      
      // 프로젝트 생성
      await page.goto(`${FRONTEND_URL}/ProjectCreate`, { waitUntil: 'networkidle2' });
      
      // 프로젝트 정보 입력
      await page.type('input[name="name"]', `UI테스트 프로젝트 ${Date.now()}`);
      await page.type('input[name="manager"]', '테스트 매니저');
      await page.type('input[name="consumer"]', '테스트 고객사');
      
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // 생성된 프로젝트 ID 추출
        const currentUrl = page.url();
        const projectIdMatch = currentUrl.match(/\/(\d+)/);
        
        if (projectIdMatch) {
          const projectId = projectIdMatch[1];
          
          // 프로젝트 뷰 페이지 테스트
          await testPage(page, `/ProjectView/${projectId}`, '프로젝트 상세', true);
          
          // 프로젝트 편집 페이지 테스트
          await testPage(page, `/ProjectEdit/${projectId}`, '프로젝트 편집', true);
          
          // 피드백 페이지 테스트
          await testPage(page, `/Feedback/${projectId}`, '피드백', true);
        }
      }
    } catch (e) {
      console.log(`  ${colors.yellow}⚠️  프로젝트 관련 페이지 테스트 스킵: ${e.message}${colors.reset}`);
    }
    
  } finally {
    await browser.close();
  }
  
  // 최종 결과 출력
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}📊 테스트 결과 요약${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  
  console.log(`\n📈 전체 통계:`);
  console.log(`  - 총 페이지: ${results.summary.totalPages}개`);
  console.log(`  - 테스트 완료: ${results.summary.testedPages}개`);
  console.log(`  - 총 UI 요소: ${results.summary.totalElements}개`);
  console.log(`  ${colors.green}- 활성 요소: ${results.summary.interactiveElements}개${colors.reset}`);
  console.log(`  ${colors.red}- 비활성 요소: ${results.summary.nonInteractiveElements}개${colors.reset}`);
  
  const interactivityRate = (results.summary.interactiveElements / results.summary.totalElements * 100).toFixed(1);
  console.log(`  - 활성화율: ${interactivityRate}%`);
  
  // 페이지별 상세 결과
  console.log(`\n📋 페이지별 결과:`);
  Object.entries(results.pages).forEach(([pageName, data]) => {
    const rate = (data.summary.interactive / data.summary.total * 100).toFixed(1);
    const status = rate >= 95 ? colors.green : rate >= 80 ? colors.yellow : colors.red;
    console.log(`\n  [${pageName}]`);
    console.log(`  - URL: ${data.url}`);
    console.log(`  - 총 요소: ${data.summary.total}개`);
    console.log(`  ${status}- 활성화율: ${rate}%${colors.reset}`);
    
    if (data.summary.nonInteractive > 0) {
      console.log(`  - 비활성 요소:`);
      const nonInteractiveButtons = data.elements.buttons.filter(b => !b.clickable);
      const nonInteractiveInputs = data.elements.inputs.filter(i => !i.interactive || !i.focusable);
      
      if (nonInteractiveButtons.length > 0) {
        console.log(`    • 버튼: ${nonInteractiveButtons.map(b => `"${b.text}"`).join(', ')}`);
      }
      if (nonInteractiveInputs.length > 0) {
        console.log(`    • 입력필드: ${nonInteractiveInputs.map(i => i.type).join(', ')}`);
      }
    }
  });
  
  // 에러 리포트
  if (results.summary.errors.length > 0) {
    console.log(`\n${colors.red}⚠️  발견된 에러 (${results.summary.errors.length}개):${colors.reset}`);
    results.summary.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.type || err.page}] ${err.error || err.message}`);
    });
  }
  
  // 스크린샷 정보
  console.log(`\n📸 스크린샷 저장됨: ${results.screenshots.length}개`);
  
  // 보고서 저장
  const reportFilename = `ui-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(results, null, 2));
  console.log(`\n📄 상세 보고서: ${reportFilename}`);
  
  // 최종 평가
  console.log(`\n🎯 종합 평가:`);
  const overallRate = parseFloat(interactivityRate);
  if (overallRate >= 95) {
    console.log(`${colors.green}✅ 모든 UI 요소가 정상적으로 작동합니다!${colors.reset}`);
  } else if (overallRate >= 80) {
    console.log(`${colors.yellow}⚠️  대부분의 UI 요소가 작동하지만 ${results.summary.nonInteractiveElements}개의 요소가 비활성화되어 있습니다.${colors.reset}`);
    console.log(`${colors.yellow}   CSS pointer-events나 z-index 문제를 확인해주세요.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ UI 요소의 ${(100 - overallRate).toFixed(1)}%가 작동하지 않습니다!${colors.reset}`);
    console.log(`${colors.red}   즉시 수정이 필요합니다. InputActivationFix.scss를 확인하세요.${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}테스트 완료: ${new Date().toLocaleString('ko-KR')}${colors.reset}`);
}

// 테스트 실행
runComprehensiveUITest().catch(console.error);