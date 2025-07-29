const { chromium } = require('playwright');

async function captureScreenshots() {
  console.log('📸 현재 UI 상태 캡처 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  // 애니메이션 비활성화
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  const screenshots = [];
  
  try {
    // 1. 홈페이지
    console.log('1. 홈페이지 캡처 중...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'screenshots/homepage-current.png',
      fullPage: true 
    });
    screenshots.push('homepage-current.png');
    
    // 2. 로그인 페이지
    console.log('2. 로그인 페이지 캡처 중...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'screenshots/login-current.png',
      fullPage: true 
    });
    screenshots.push('login-current.png');
    
    // 3. 버튼 스타일 확인을 위한 특정 요소 캡처
    console.log('3. 버튼 스타일 캡처 중...');
    
    // 로그인 페이지의 버튼들
    const loginButton = await page.$('.btn-primary, button[type="submit"]');
    if (loginButton) {
      await loginButton.screenshot({ 
        path: 'screenshots/button-primary-current.png' 
      });
      
      // Computed 스타일 확인
      const styles = await loginButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          fontSize: computed.fontSize,
          height: computed.height,
          width: computed.width,
          color: computed.color,
          boxShadow: computed.boxShadow
        };
      });
      
      console.log('\n📊 Primary Button Computed Styles:');
      console.log(JSON.stringify(styles, null, 2));
    }
    
    // 4. CMS 페이지 (로그인 필요한 경우 스킵)
    try {
      console.log('\n4. CMS 페이지 시도 중...');
      await page.goto('http://localhost:3000/cms', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // 로그인 리다이렉트 확인
      if (page.url().includes('login')) {
        console.log('   ⚠️  CMS 접근 시 로그인 필요');
      } else {
        await page.screenshot({ 
          path: 'screenshots/cms-current.png',
          fullPage: true 
        });
        screenshots.push('cms-current.png');
      }
    } catch (e) {
      console.log('   ⚠️  CMS 페이지 접근 실패');
    }
    
    console.log('\n✅ 스크린샷 캡처 완료!');
    console.log('   저장 위치: ./screenshots/');
    console.log('   캡처된 파일:', screenshots.join(', '));
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
  }
  
  // UI 일관성 체크 포인트
  console.log('\n🔍 UI 검증 체크리스트:');
  console.log('1. 버튼 그라데이션이 정상적으로 표시되는가?');
  console.log('2. 간격(padding/margin)이 이전과 동일한가?');
  console.log('3. 테두리 둥글기(border-radius)가 유지되는가?');
  console.log('4. 색상이 정확히 일치하는가?');
  console.log('5. 호버/액티브 상태가 정상 작동하는가?');
}

// 스크린샷 디렉토리 생성
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// 실행
captureScreenshots().catch(console.error);