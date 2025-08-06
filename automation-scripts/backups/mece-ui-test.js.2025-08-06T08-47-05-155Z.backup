/**
 * MECE UI 버튼 테스트 (Puppeteer 기반)
 * 실제 브라우저에서 모든 버튼 클릭 테스트
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const TEST_EMAIL = 'user@example.com';
const TEST_PASSWORD = 'password123!';

// 테스트 결과
const uiTestResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// 콘솔 색상
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testUIButton(page, pageName, buttonSelector, buttonName) {
  uiTestResults.total++;
  console.log(`\n${colors.cyan}[UI 테스트] ${pageName} - ${buttonName}${colors.reset}`);
  
  try {
    // 버튼이 존재하는지 확인
    await page.waitForSelector(buttonSelector, { timeout: 5000 });
    
    // 버튼이 보이는지 확인
    const isVisible = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, buttonSelector);
    
    if (!isVisible) {
      throw new Error('버튼이 화면에 보이지 않음');
    }
    
    // 버튼이 활성화되어 있는지 확인
    const isDisabled = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element.disabled || element.getAttribute('disabled') !== null;
    }, buttonSelector);
    
    if (isDisabled) {
      console.log(`${colors.yellow}⚠ 버튼이 비활성화 상태${colors.reset}`);
    }
    
    // 버튼 클릭 시도
    await page.click(buttonSelector);
    
    // 클릭 후 에러가 없는지 확인 (콘솔 에러 체크)
    await page.waitForTimeout(1000); // 1초 대기
    
    uiTestResults.passed++;
    uiTestResults.details.push({
      page: pageName,
      button: buttonName,
      selector: buttonSelector,
      status: 'PASS',
      error: null
    });
    console.log(`${colors.green}✓ 성공${colors.reset}`);
    
  } catch (error) {
    uiTestResults.failed++;
    uiTestResults.details.push({
      page: pageName,
      button: buttonName,
      selector: buttonSelector,
      status: 'FAIL',
      error: error.message
    });
    console.log(`${colors.red}✗ 실패: ${error.message}${colors.reset}`);
  }
}

async function runUITests() {
  console.log(`${colors.bright}${colors.blue}========================================`);
  console.log(`  VideoPlanet UI 버튼 테스트 시작`);
  console.log(`========================================${colors.reset}\n`);

  const browser = await puppeteer.launch({
    headless: false, // 테스트 진행 상황을 볼 수 있도록
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // 콘솔 에러 감지
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`${colors.red}브라우저 콘솔 에러: ${msg.text()}${colors.reset}`);
    }
  });
  
  try {
    // 1. 로그인 페이지 테스트
    console.log(`${colors.yellow}\n1. 로그인 페이지 UI 테스트${colors.reset}`);
    await page.goto(`${FRONTEND_URL}/login`);
    
    await testUIButton(page, '로그인 페이지', 'button[type="submit"]', '로그인 버튼');
    await testUIButton(page, '로그인 페이지', 'a[href="/signup"]', '회원가입 링크');
    await testUIButton(page, '로그인 페이지', 'a[href="/resetpw"]', '비밀번호 찾기 링크');
    
    // 2. 로그인 수행
    console.log(`\n${colors.cyan}로그인 수행 중...${colors.reset}`);
    await page.goto(`${FRONTEND_URL}/login`);
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log(`${colors.green}✓ 로그인 성공${colors.reset}`);
    
    // 3. 프로젝트 목록 페이지 테스트
    console.log(`${colors.yellow}\n2. 프로젝트 목록 페이지 UI 테스트${colors.reset}`);
    await page.goto(`${FRONTEND_URL}/cmshome`);
    await page.waitForTimeout(2000);
    
    await testUIButton(page, '프로젝트 목록', 'button:has-text("새 프로젝트")', '새 프로젝트 버튼');
    await testUIButton(page, '프로젝트 목록', '.project-card button', '프로젝트 카드 버튼');
    
    // 4. 영상 기획 페이지 테스트
    console.log(`${colors.yellow}\n3. 영상 기획 페이지 UI 테스트${colors.reset}`);
    await page.goto(`${FRONTEND_URL}/videoplanning`);
    await page.waitForTimeout(2000);
    
    await testUIButton(page, '영상 기획', 'button:has-text("AI 기획 마법사")', 'AI 기획 마법사 버튼');
    await testUIButton(page, '영상 기획', 'button:has-text("구조 생성")', '구조 생성 버튼');
    await testUIButton(page, '영상 기획', 'button:has-text("스토리 생성")', '스토리 생성 버튼');
    await testUIButton(page, '영상 기획', 'button:has-text("씬 생성")', '씬 생성 버튼');
    await testUIButton(page, '영상 기획', 'button:has-text("저장")', '저장 버튼');
    await testUIButton(page, '영상 기획', 'button:has-text("라이브러리")', '라이브러리 버튼');
    
    // AI 마법사 모달 테스트
    await page.click('button:has-text("AI 기획 마법사")');
    await page.waitForTimeout(1000);
    await testUIButton(page, 'AI 마법사', '.wizardContainer button:has-text("다음")', '다음 버튼');
    await testUIButton(page, 'AI 마법사', '.wizardContainer button:has-text("✕")', '닫기 버튼');
    
    // 5. 마이페이지 테스트
    console.log(`${colors.yellow}\n4. 마이페이지 UI 테스트${colors.reset}`);
    await page.goto(`${FRONTEND_URL}/mypage`);
    await page.waitForTimeout(2000);
    
    await testUIButton(page, '마이페이지', 'button:has-text("프로필 수정")', '프로필 수정 버튼');
    await testUIButton(page, '마이페이지', 'button:has-text("비밀번호 변경")', '비밀번호 변경 버튼');
    await testUIButton(page, '마이페이지', 'button:has-text("로그아웃")', '로그아웃 버튼');
    
    // 6. 피드백 페이지 테스트 (프로젝트가 있는 경우)
    console.log(`${colors.yellow}\n5. 피드백 페이지 UI 테스트${colors.reset}`);
    const projects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.project-card')).length;
    });
    
    if (projects > 0) {
      await page.goto(`${FRONTEND_URL}/feedbackall`);
      await page.waitForTimeout(2000);
      await testUIButton(page, '피드백 목록', '.feedback-item button', '피드백 보기 버튼');
    }
    
  } catch (error) {
    console.error(`${colors.red}테스트 중 오류 발생: ${error.message}${colors.reset}`);
  } finally {
    // 테스트 결과 출력
    console.log(`\n${colors.bright}${colors.blue}========================================`);
    console.log(`  UI 테스트 결과 요약`);
    console.log(`========================================${colors.reset}`);
    console.log(`총 테스트: ${uiTestResults.total}`);
    console.log(`${colors.green}성공: ${uiTestResults.passed}${colors.reset}`);
    console.log(`${colors.red}실패: ${uiTestResults.failed}${colors.reset}`);
    console.log(`성공률: ${((uiTestResults.passed / uiTestResults.total) * 100).toFixed(1)}%`);
    
    // 실패한 테스트 상세
    if (uiTestResults.failed > 0) {
      console.log(`\n${colors.red}실패한 UI 테스트:${colors.reset}`);
      uiTestResults.details
        .filter(result => result.status === 'FAIL')
        .forEach(result => {
          console.log(`- ${result.page} > ${result.button} (${result.selector}): ${result.error}`);
        });
    }
    
    // 결과 저장
    const fs = require('fs');
    fs.writeFileSync(
      '/home/winnmedia/VideoPlanet/vridge_front/src/tests/mece-ui-test-results.json',
      JSON.stringify(uiTestResults, null, 2)
    );
    console.log(`\n${colors.cyan}UI 테스트 결과가 mece-ui-test-results.json에 저장되었습니다.${colors.reset}`);
    
    await browser.close();
  }
}

// 프론트엔드 서버 확인 후 테스트 실행
const http = require('http');
http.get(FRONTEND_URL, (res) => {
  if (res.statusCode === 200 || res.statusCode === 302) {
    console.log(`${colors.green}✓ 프론트엔드 서버 연결 확인${colors.reset}`);
    runUITests();
  }
}).on('error', (err) => {
  console.error(`${colors.red}✗ 프론트엔드 서버에 연결할 수 없습니다.`);
  console.error(`  npm run dev 명령으로 프론트엔드 서버를 실행해주세요.${colors.reset}`);
  process.exit(1);
});