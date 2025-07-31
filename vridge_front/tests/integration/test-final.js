const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';

// 테스트 결과 저장용
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  pages: [],
  uiConsistency: {},
  consoleErrors: [],
  summary: ''
};

// 페이지별 테스트 정의
const pagesToTest = [
  { path: '/', name: '홈페이지', expectedStatus: 200 },
  { path: '/login', name: '로그인', expectedStatus: 200 },
  { path: '/signup', name: '회원가입', expectedStatus: 200 },
  { path: '/cms/projects', name: '프로젝트 목록', expectedStatus: 200 },
  { path: '/cms/project-create', name: '프로젝트 생성', expectedStatus: 200 },
  { path: '/video-planning', name: '영상 기획', expectedStatus: 200 },
  { path: '/my-page/profile', name: '마이페이지', expectedStatus: 200 }
];

// UI 일관성 체크 항목
const uiChecks = {
  logo: {
    selector: 'img[src*="logo"]',
    expectedWidth: 120,
    expectedHeight: 45,
    tolerance: 5
  },
  primaryButton: {
    selector: 'button.primary, .btn-primary',
    expectedBgColor: 'rgb(22, 49, 248)',
    expectedTextColor: 'rgb(255, 255, 255)'
  },
  headerHeight: {
    selector: 'header, nav',
    expectedHeight: 64,
    tolerance: 10
  }
};

async function runTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('🚀 Next.js 애플리케이션 최종 테스트 시작...\n');

    // 1. 페이지별 접근성 테스트
    console.log('📄 페이지 접근성 테스트');
    console.log('=' .repeat(50));
    
    for (const pageTest of pagesToTest) {
      const page = await browser.newPage();
      const pageResult = {
        name: pageTest.name,
        path: pageTest.path,
        status: null,
        loadTime: null,
        consoleErrors: [],
        networkErrors: [],
        passed: true
      };

      // 콘솔 에러 캡처
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageResult.consoleErrors.push(msg.text());
          testResults.consoleErrors.push({
            page: pageTest.path,
            error: msg.text()
          });
        }
      });

      // 네트워크 에러 캡처
      page.on('requestfailed', request => {
        pageResult.networkErrors.push({
          url: request.url(),
          error: request.failure().errorText
        });
      });

      try {
        const startTime = Date.now();
        const response = await page.goto(BASE_URL + pageTest.path, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        pageResult.loadTime = Date.now() - startTime;
        pageResult.status = response.status();
        
        if (response.status() !== pageTest.expectedStatus) {
          pageResult.passed = false;
        }

        // 페이지 스크린샷 저장
        await page.screenshot({ 
          path: `screenshot-${pageTest.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
          fullPage: true 
        });

        console.log(`✅ ${pageTest.name}: ${response.status()} (${pageResult.loadTime}ms)`);
        
        if (pageResult.consoleErrors.length > 0) {
          console.log(`   ⚠️  콘솔 에러: ${pageResult.consoleErrors.length}개`);
          pageResult.passed = false;
        }

      } catch (error) {
        pageResult.passed = false;
        pageResult.error = error.message;
        console.log(`❌ ${pageTest.name}: ${error.message}`);
      }

      testResults.pages.push(pageResult);
      testResults.totalTests++;
      if (pageResult.passed) testResults.passed++;
      else testResults.failed++;

      await page.close();
    }

    // 2. UI 일관성 테스트
    console.log('\n🎨 UI 일관성 테스트');
    console.log('=' .repeat(50));

    const uiPage = await browser.newPage();
    await uiPage.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // 로고 크기 확인
    try {
      const logo = await uiPage.$(uiChecks.logo.selector);
      if (logo) {
        const box = await logo.boundingBox();
        const widthOk = Math.abs(box.width - uiChecks.logo.expectedWidth) <= uiChecks.logo.tolerance;
        const heightOk = Math.abs(box.height - uiChecks.logo.expectedHeight) <= uiChecks.logo.tolerance;
        
        testResults.uiConsistency.logo = {
          found: true,
          width: box.width,
          height: box.height,
          widthOk,
          heightOk,
          passed: widthOk && heightOk
        };
        
        console.log(`✅ 로고: ${box.width}x${box.height}px (기대값: ${uiChecks.logo.expectedWidth}x${uiChecks.logo.expectedHeight}px)`);
      } else {
        testResults.uiConsistency.logo = { found: false, passed: false };
        console.log('❌ 로고를 찾을 수 없습니다');
      }
    } catch (error) {
      testResults.uiConsistency.logo = { error: error.message, passed: false };
      console.log(`❌ 로고 테스트 실패: ${error.message}`);
    }

    // 버튼 스타일 확인
    try {
      const buttons = await uiPage.$$(uiChecks.primaryButton.selector);
      if (buttons.length > 0) {
        const buttonStyles = await uiPage.evaluate((selector) => {
          const btn = document.querySelector(selector);
          if (!btn) return null;
          const styles = window.getComputedStyle(btn);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            padding: styles.padding,
            borderRadius: styles.borderRadius
          };
        }, uiChecks.primaryButton.selector);

        testResults.uiConsistency.primaryButton = {
          found: true,
          count: buttons.length,
          styles: buttonStyles,
          passed: buttonStyles && 
                  buttonStyles.backgroundColor === uiChecks.primaryButton.expectedBgColor &&
                  buttonStyles.color === uiChecks.primaryButton.expectedTextColor
        };
        
        console.log(`✅ 주요 버튼: ${buttons.length}개 발견`);
        if (buttonStyles) {
          console.log(`   배경색: ${buttonStyles.backgroundColor}`);
          console.log(`   글자색: ${buttonStyles.color}`);
        }
      } else {
        testResults.uiConsistency.primaryButton = { found: false, passed: false };
        console.log('❌ 주요 버튼을 찾을 수 없습니다');
      }
    } catch (error) {
      testResults.uiConsistency.primaryButton = { error: error.message, passed: false };
      console.log(`❌ 버튼 테스트 실패: ${error.message}`);
    }

    // 헤더 높이 확인
    try {
      const header = await uiPage.$(uiChecks.headerHeight.selector);
      if (header) {
        const box = await header.boundingBox();
        const heightOk = Math.abs(box.height - uiChecks.headerHeight.expectedHeight) <= uiChecks.headerHeight.tolerance;
        
        testResults.uiConsistency.header = {
          found: true,
          height: box.height,
          heightOk,
          passed: heightOk
        };
        
        console.log(`✅ 헤더: ${box.height}px (기대값: ${uiChecks.headerHeight.expectedHeight}px)`);
      } else {
        testResults.uiConsistency.header = { found: false, passed: false };
        console.log('❌ 헤더를 찾을 수 없습니다');
      }
    } catch (error) {
      testResults.uiConsistency.header = { error: error.message, passed: false };
      console.log(`❌ 헤더 테스트 실패: ${error.message}`);
    }

    await uiPage.close();

    // 3. 반응형 디자인 테스트
    console.log('\n📱 반응형 디자인 테스트');
    console.log('=' .repeat(50));

    const viewports = [
      { name: '모바일', width: 375, height: 667 },
      { name: '태블릿', width: 768, height: 1024 },
      { name: '데스크톱', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      const responsivePage = await browser.newPage();
      await responsivePage.setViewport({ width: viewport.width, height: viewport.height });
      await responsivePage.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      await responsivePage.screenshot({ 
        path: `screenshot-${viewport.name}.png`,
        fullPage: false 
      });
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height})`);
      await responsivePage.close();
    }

    // 4. 성능 메트릭 수집
    console.log('\n⚡ 성능 메트릭');
    console.log('=' .repeat(50));

    const perfPage = await browser.newPage();
    await perfPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    const metrics = await perfPage.metrics();
    const performanceTiming = await perfPage.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        totalTime: timing.loadEventEnd - timing.fetchStart
      };
    });

    console.log(`DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`Page Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`Total Load Time: ${performanceTiming.totalTime}ms`);
    console.log(`JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);

    await perfPage.close();

    // 최종 요약
    console.log('\n📊 테스트 결과 요약');
    console.log('=' .repeat(50));
    console.log(`총 테스트: ${testResults.totalTests}`);
    console.log(`성공: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)`);
    console.log(`실패: ${testResults.failed}`);
    console.log(`콘솔 에러: ${testResults.consoleErrors.length}개`);
    
    if (testResults.failed === 0 && testResults.consoleErrors.length === 0) {
      console.log('\n✅ 모든 테스트가 성공적으로 완료되었습니다!');
      testResults.summary = 'All tests passed successfully';
    } else {
      console.log('\n⚠️  일부 테스트가 실패했거나 에러가 발견되었습니다.');
      testResults.summary = `${testResults.failed} tests failed, ${testResults.consoleErrors.length} console errors found`;
    }

    // 결과를 JSON 파일로 저장
    await fs.writeFile('test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n📁 상세 결과가 test-results.json에 저장되었습니다.');

  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
runTest().catch(console.error);