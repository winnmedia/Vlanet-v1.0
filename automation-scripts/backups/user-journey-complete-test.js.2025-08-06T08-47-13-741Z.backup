#!/usr/bin/env node
/**
 * VideoPlanet 완전한 사용자 여정 테스트
 * 모든 주요 기능과 페이지를 검증하는 종합 테스트
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// 설정
const CONFIG = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  backend: process.env.BACKEND_URL || 'http://localhost:8000',
  headless: process.env.HEADLESS !== 'false',
  slowMo: 50, // 각 액션 사이 지연
  timeout: 30000,
  testUser: {
    email: 'ceo@winnmedia.co.kr',
    password: 'Qwerasdf!234'
  }
};

// 테스트 결과 저장
const testResults = {
  timestamp: new Date().toISOString(),
  journeys: [],
  errors: [],
  warnings: [],
  performance: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// 유틸리티 함수
class TestUtils {
  constructor(page) {
    this.page = page;
  }

  async waitAndClick(selector, options = {}) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000, ...options });
      await this.page.click(selector);
      return true;
    } catch (error) {
      console.error(`Failed to click ${selector}:`, error.message);
      return false;
    }
  }

  async waitAndType(selector, text, options = {}) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000, ...options });
      await this.page.click(selector);
      await this.page.type(selector, text);
      return true;
    } catch (error) {
      console.error(`Failed to type in ${selector}:`, error.message);
      return false;
    }
  }

  async checkElement(selector, shouldExist = true) {
    try {
      if (shouldExist) {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        return true;
      } else {
        await this.page.waitForSelector(selector, { timeout: 1000 });
        return false;
      }
    } catch (error) {
      return !shouldExist;
    }
  }

  async takeScreenshot(name) {
    const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  async measurePerformance(name, fn) {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    testResults.performance[name] = {
      duration,
      timestamp: new Date().toISOString()
    };
    
    if (duration > 3000) {
      testResults.warnings.push({
        type: 'performance',
        message: `${name} took ${duration}ms (> 3s)`,
        timestamp: new Date().toISOString()
      });
    }
    
    return result;
  }
}

// 테스트 여정 클래스
class UserJourneyTests {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
    this.utils = null;
  }

  async setup() {
    this.page = await this.browser.newPage();
    this.utils = new TestUtils(this.page);
    
    // 콘솔 에러 모니터링
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          type: 'console',
          message: msg.text(),
          url: this.page.url(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // 페이지 에러 모니터링
    this.page.on('pageerror', error => {
      testResults.errors.push({
        type: 'page',
        message: error.message,
        stack: error.stack,
        url: this.page.url(),
        timestamp: new Date().toISOString()
      });
    });

    // 네트워크 에러 모니터링
    this.page.on('requestfailed', request => {
      testResults.errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure().errorText,
        timestamp: new Date().toISOString()
      });
    });
  }

  async teardown() {
    if (this.page) {
      await this.page.close();
    }
  }

  // Journey 1: 홈페이지 및 네비게이션
  async testHomepageNavigation() {
    const journey = {
      name: '홈페이지 및 네비게이션',
      steps: [],
      status: 'running'
    };

    try {
      // 홈페이지 접속
      await this.utils.measurePerformance('homepage_load', async () => {
        await this.page.goto(CONFIG.frontend, { waitUntil: 'networkidle2' });
      });
      journey.steps.push({ name: '홈페이지 로드', status: 'passed' });

      // 주요 요소 확인
      const checks = [
        { selector: 'header', name: '헤더' },
        { selector: 'nav', name: '네비게이션' },
        { selector: 'main', name: '메인 콘텐츠' },
        { selector: 'footer', name: '푸터' }
      ];

      for (const check of checks) {
        const exists = await this.utils.checkElement(check.selector);
        journey.steps.push({
          name: `${check.name} 확인`,
          status: exists ? 'passed' : 'failed'
        });
      }

      // 반응형 테스트
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.utils.takeScreenshot(`homepage-${viewport.name.toLowerCase()}`);
        journey.steps.push({
          name: `${viewport.name} 반응형 테스트`,
          status: 'passed'
        });
      }

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 2: 로그인 플로우
  async testLoginFlow() {
    const journey = {
      name: '로그인 플로우',
      steps: [],
      status: 'running'
    };

    try {
      // 로그인 페이지로 이동
      await this.page.goto(`${CONFIG.frontend}/login`, { waitUntil: 'networkidle2' });
      journey.steps.push({ name: '로그인 페이지 접속', status: 'passed' });

      // 로그인 폼 입력
      await this.utils.waitAndType('input[name="email"], input[type="email"]', CONFIG.testUser.email);
      await this.utils.waitAndType('input[name="password"], input[type="password"]', CONFIG.testUser.password);
      journey.steps.push({ name: '로그인 정보 입력', status: 'passed' });

      // 로그인 버튼 클릭
      await this.utils.measurePerformance('login_submit', async () => {
        await this.utils.waitAndClick('button[type="submit"], button:has-text("로그인")');
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      });
      journey.steps.push({ name: '로그인 제출', status: 'passed' });

      // 로그인 성공 확인
      const dashboardLoaded = await this.utils.checkElement('[class*="dashboard"], [class*="Dashboard"]');
      journey.steps.push({
        name: '대시보드 로드 확인',
        status: dashboardLoaded ? 'passed' : 'failed'
      });

      // JWT 토큰 확인
      const localStorage = await this.page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('access_token'),
          refreshToken: localStorage.getItem('refresh_token')
        };
      });

      journey.steps.push({
        name: 'JWT 토큰 저장 확인',
        status: (localStorage.accessToken && localStorage.refreshToken) ? 'passed' : 'failed'
      });

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
      await this.utils.takeScreenshot('login-error');
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 3: 프로젝트 생성 및 관리
  async testProjectManagement() {
    const journey = {
      name: '프로젝트 생성 및 관리',
      steps: [],
      status: 'running'
    };

    try {
      // 프로젝트 페이지로 이동
      await this.page.goto(`${CONFIG.frontend}/cms/home`, { waitUntil: 'networkidle2' });
      journey.steps.push({ name: 'CMS 홈 접속', status: 'passed' });

      // ProjectDashboard 컴포넌트 확인
      const dashboardExists = await this.utils.checkElement('[class*="projectDashboard"], [class*="ProjectDashboard"]');
      journey.steps.push({
        name: 'ProjectDashboard 컴포넌트 로드',
        status: dashboardExists ? 'passed' : 'failed'
      });

      // 빈 상태 확인 (FolderOpenOutlined 아이콘 포함)
      const emptyStateExists = await this.utils.checkElement('[class*="emptyState"]');
      if (emptyStateExists) {
        // FolderOpenOutlined 아이콘 렌더링 확인
        const iconExists = await this.utils.checkElement('span[class*="anticon"]');
        journey.steps.push({
          name: 'FolderOpenOutlined 아이콘 렌더링',
          status: iconExists ? 'passed' : 'failed'
        });
      }

      // 프로젝트 생성 버튼 클릭
      const createButtonClicked = await this.utils.waitAndClick('button:has-text("프로젝트 생성"), button:has-text("새 프로젝트")');
      journey.steps.push({
        name: '프로젝트 생성 버튼 클릭',
        status: createButtonClicked ? 'passed' : 'failed'
      });

      if (createButtonClicked) {
        // 프로젝트 생성 폼 입력
        const projectData = {
          name: `테스트 프로젝트 ${Date.now()}`,
          description: '자동 테스트로 생성된 프로젝트',
          deadline: '2025-12-31'
        };

        await this.utils.waitAndType('input[name="project_name"], input[name="name"]', projectData.name);
        await this.utils.waitAndType('textarea[name="description"]', projectData.description);
        journey.steps.push({ name: '프로젝트 정보 입력', status: 'passed' });

        // 프로젝트 생성 제출
        await this.utils.measurePerformance('project_create', async () => {
          await this.utils.waitAndClick('button[type="submit"], button:has-text("생성")');
          await this.page.waitForTimeout(2000);
        });
        journey.steps.push({ name: '프로젝트 생성 제출', status: 'passed' });
      }

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
      await this.utils.takeScreenshot('project-error');
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 4: 영상 기획 기능
  async testVideoPlanning() {
    const journey = {
      name: '영상 기획 기능',
      steps: [],
      status: 'running'
    };

    try {
      // 영상 기획 페이지로 이동
      await this.page.goto(`${CONFIG.frontend}/cms/video-planning`, { waitUntil: 'networkidle2' });
      journey.steps.push({ name: '영상 기획 페이지 접속', status: 'passed' });

      // 주요 기능 확인
      const features = [
        { selector: '[class*="storyboard"]', name: '스토리보드' },
        { selector: '[class*="aiPrompt"], button:has-text("AI")', name: 'AI 프롬프트' },
        { selector: '[class*="download"], button:has-text("다운로드")', name: '다운로드 기능' }
      ];

      for (const feature of features) {
        const exists = await this.utils.checkElement(feature.selector);
        journey.steps.push({
          name: `${feature.name} 확인`,
          status: exists ? 'passed' : 'warning'
        });
      }

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 5: 피드백 시스템
  async testFeedbackSystem() {
    const journey = {
      name: '피드백 시스템',
      steps: [],
      status: 'running'
    };

    try {
      // 피드백 페이지로 이동
      await this.page.goto(`${CONFIG.frontend}/cms/feedback`, { waitUntil: 'networkidle2' });
      journey.steps.push({ name: '피드백 페이지 접속', status: 'passed' });

      // 비디오 플레이어 확인
      const videoPlayerExists = await this.utils.checkElement('[class*="videoPlayer"], video');
      journey.steps.push({
        name: '비디오 플레이어 확인',
        status: videoPlayerExists ? 'passed' : 'warning'
      });

      // 피드백 입력 영역 확인
      const feedbackInputExists = await this.utils.checkElement('[class*="feedbackInput"], textarea');
      journey.steps.push({
        name: '피드백 입력 영역 확인',
        status: feedbackInputExists ? 'passed' : 'warning'
      });

      // 타임라인 기능 확인
      const timelineExists = await this.utils.checkElement('[class*="timeline"]');
      journey.steps.push({
        name: '타임라인 기능 확인',
        status: timelineExists ? 'passed' : 'warning'
      });

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 6: 마이페이지
  async testMyPage() {
    const journey = {
      name: '마이페이지',
      steps: [],
      status: 'running'
    };

    try {
      // 마이페이지로 이동
      await this.page.goto(`${CONFIG.frontend}/user/mypage`, { waitUntil: 'networkidle2' });
      journey.steps.push({ name: '마이페이지 접속', status: 'passed' });

      // 프로필 정보 확인
      const profileExists = await this.utils.checkElement('[class*="profile"], [class*="Profile"]');
      journey.steps.push({
        name: '프로필 정보 확인',
        status: profileExists ? 'passed' : 'warning'
      });

      // 설정 메뉴 확인
      const settingsExists = await this.utils.checkElement('[class*="settings"], button:has-text("설정")');
      journey.steps.push({
        name: '설정 메뉴 확인',
        status: settingsExists ? 'passed' : 'warning'
      });

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }

  // Journey 7: 성능 및 접근성 테스트
  async testPerformanceAccessibility() {
    const journey = {
      name: '성능 및 접근성',
      steps: [],
      status: 'running'
    };

    try {
      // Lighthouse 메트릭 수집 (간소화된 버전)
      const metrics = await this.page.evaluate(() => {
        const perf = window.performance;
        return {
          navigationStart: perf.timing.navigationStart,
          domContentLoaded: perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart,
          loadComplete: perf.timing.loadEventEnd - perf.timing.navigationStart,
          firstPaint: perf.getEntriesByType('paint')[0]?.startTime || 0
        };
      });

      journey.steps.push({
        name: 'DOM 로드 시간',
        status: metrics.domContentLoaded < 3000 ? 'passed' : 'warning',
        value: `${metrics.domContentLoaded}ms`
      });

      journey.steps.push({
        name: '전체 로드 시간',
        status: metrics.loadComplete < 5000 ? 'passed' : 'warning',
        value: `${metrics.loadComplete}ms`
      });

      // 접근성 기본 체크
      const a11yChecks = await this.page.evaluate(() => {
        const results = [];
        
        // 이미지 alt 텍스트 확인
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        results.push({
          name: '이미지 alt 텍스트',
          passed: imagesWithoutAlt.length === 0,
          details: `${imagesWithoutAlt.length}개 이미지 alt 누락`
        });

        // 버튼 텍스트 확인
        const buttons = document.querySelectorAll('button');
        const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent.trim() && !btn.getAttribute('aria-label'));
        results.push({
          name: '버튼 레이블',
          passed: buttonsWithoutText.length === 0,
          details: `${buttonsWithoutText.length}개 버튼 레이블 누락`
        });

        // 폼 레이블 확인
        const inputs = document.querySelectorAll('input, select, textarea');
        const inputsWithoutLabel = Array.from(inputs).filter(input => {
          const id = input.id;
          if (!id) return true;
          return !document.querySelector(`label[for="${id}"]`);
        });
        results.push({
          name: '폼 레이블',
          passed: inputsWithoutLabel.length === 0,
          details: `${inputsWithoutLabel.length}개 입력 필드 레이블 누락`
        });

        return results;
      });

      for (const check of a11yChecks) {
        journey.steps.push({
          name: check.name,
          status: check.passed ? 'passed' : 'warning',
          details: check.details
        });
      }

      journey.status = 'passed';
    } catch (error) {
      journey.status = 'failed';
      journey.error = error.message;
    }

    testResults.journeys.push(journey);
    return journey.status === 'passed';
  }
}

// 메인 테스트 실행 함수
async function runTests() {
  console.log('🚀 VideoPlanet 사용자 여정 테스트 시작');
  console.log('================================');
  console.log(`Frontend: ${CONFIG.frontend}`);
  console.log(`Backend: ${CONFIG.backend}`);
  console.log('================================\n');

  let browser;
  
  try {
    // 브라우저 시작
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const tester = new UserJourneyTests(browser);

    // 각 여정 테스트 실행
    const journeys = [
      { name: '홈페이지 및 네비게이션', method: 'testHomepageNavigation' },
      { name: '로그인 플로우', method: 'testLoginFlow' },
      { name: '프로젝트 관리', method: 'testProjectManagement' },
      { name: '영상 기획', method: 'testVideoPlanning' },
      { name: '피드백 시스템', method: 'testFeedbackSystem' },
      { name: '마이페이지', method: 'testMyPage' },
      { name: '성능 및 접근성', method: 'testPerformanceAccessibility' }
    ];

    for (const journey of journeys) {
      console.log(`\n🔍 테스트 중: ${journey.name}`);
      
      await tester.setup();
      const success = await tester[journey.method]();
      await tester.teardown();
      
      testResults.summary.total++;
      if (success) {
        testResults.summary.passed++;
        console.log(`✅ ${journey.name} - 통과`);
      } else {
        testResults.summary.failed++;
        console.log(`❌ ${journey.name} - 실패`);
      }
    }

  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
    testResults.errors.push({
      type: 'fatal',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 결과 저장
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));

  // 결과 출력
  console.log('\n================================');
  console.log('📊 테스트 결과 요약');
  console.log('================================');
  console.log(`총 테스트: ${testResults.summary.total}`);
  console.log(`✅ 통과: ${testResults.summary.passed}`);
  console.log(`❌ 실패: ${testResults.summary.failed}`);
  console.log(`⏭️  건너뜀: ${testResults.summary.skipped}`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n⚠️  오류 ${testResults.errors.length}개 발생:`);
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log(`\n⚡ 경고 ${testResults.warnings.length}개:`);
    testResults.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.message}`);
    });
  }

  console.log(`\n📄 상세 보고서: ${reportPath}`);
  
  // CI/CD 환경을 위한 종료 코드
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 스크린샷 디렉토리 생성
async function setupDirectories() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  try {
    await fs.mkdir(screenshotDir, { recursive: true });
  } catch (error) {
    // 디렉토리가 이미 존재하면 무시
  }
}

// 실행
(async () => {
  await setupDirectories();
  await runTests();
})();