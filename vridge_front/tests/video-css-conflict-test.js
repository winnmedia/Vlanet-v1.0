const puppeteer = require('puppeteer');

// API 기본 URL
const BASE_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'http://localhost:3000';

// Video.js CSS 충돌 테스트
async function checkVideoCSSConflict() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();

  console.log('1. 로그인 페이지로 이동...');
  await page.goto(`${FRONTEND_URL}/Login`, { waitUntil: 'networkidle2' });

  // 로그인
  console.log('2. 로그인 중...');
  await page.type('input[name="email"]', 'winnmedia_dev@naver.com');
  await page.type('input[name="password"]', 'qldrPwjd12!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // 비디오가 있는 프로젝트로 바로 이동
  console.log('\n3. 비디오 있는 프로젝트로 이동...');
  await page.goto(`${FRONTEND_URL}/Feedback/153`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000);

  // Video.js가 주입하는 글로벌 스타일 확인
  const globalStyles = await page.evaluate(() => {
    const results = {
      videoJsStyles: [],
      conflictingStyles: [],
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className
    };

    // 모든 스타일시트 순회
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        const isVideoJs = sheet.href && (
          sheet.href.includes('video-js') || 
          sheet.href.includes('videojs') ||
          sheet.href.includes('@videojs')
        );

        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.selectorText) {
              // Video.js 스타일 수집
              if (isVideoJs) {
                results.videoJsStyles.push({
                  selector: rule.selectorText,
                  styles: rule.style.cssText.substring(0, 100) + '...',
                  source: sheet.href || 'inline'
                });
              }

              // 글로벌 영향을 줄 수 있는 스타일 찾기
              const globalSelectors = ['body', 'html', '*', 'button', 'div', '.feedback'];
              if (globalSelectors.some(sel => rule.selectorText.includes(sel))) {
                if (!rule.selectorText.includes('.video-js')) {
                  results.conflictingStyles.push({
                    selector: rule.selectorText,
                    source: sheet.href || 'inline',
                    isVideoJs: isVideoJs
                  });
                }
              }
            }
          });
        }
      } catch (e) {
        // CORS 에러 무시
      }
    });

    // 특정 요소들의 계산된 스타일 확인
    const elements = {
      feedbackPage: document.querySelector('.feedback_page'),
      feedbackButton: document.querySelector('[style*="background: linear-gradient"]'),
      videoContainer: document.querySelector('.video-js-player-wrapper'),
      body: document.body
    };

    results.computedStyles = {};
    Object.entries(elements).forEach(([key, elem]) => {
      if (elem) {
        const computed = window.getComputedStyle(elem);
        results.computedStyles[key] = {
          display: computed.display,
          flexDirection: computed.flexDirection,
          background: computed.background,
          margin: computed.margin,
          padding: computed.padding,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          color: computed.color
        };
      }
    });

    return results;
  });

  console.log('\n=== Video.js 스타일 분석 ===');
  console.log(`Video.js 스타일 규칙 수: ${globalStyles.videoJsStyles.length}`);
  
  console.log('\n잠재적 충돌 스타일:');
  const conflicts = globalStyles.conflictingStyles.filter(s => s.isVideoJs);
  conflicts.forEach(style => {
    console.log(`- ${style.selector} (Video.js)`);
  });

  console.log('\n=== 계산된 스타일 ===');
  console.log('Body 클래스:', globalStyles.bodyClasses);
  console.log('HTML 클래스:', globalStyles.htmlClasses);
  console.log('\n요소별 스타일:', JSON.stringify(globalStyles.computedStyles, null, 2));

  // CSS 특정성 문제 확인
  const specificityIssues = await page.evaluate(() => {
    const feedbackButtons = document.querySelectorAll('button[style]');
    const issues = [];

    feedbackButtons.forEach(button => {
      const inlineStyle = button.getAttribute('style');
      const computed = window.getComputedStyle(button);
      
      // 인라인 스타일이 적용되지 않는 경우 찾기
      if (inlineStyle && inlineStyle.includes('background')) {
        const expectedBg = inlineStyle.match(/background:\s*([^;]+)/)?.[1];
        const actualBg = computed.background;
        
        if (expectedBg && !actualBg.includes('linear-gradient')) {
          issues.push({
            element: button.textContent.trim(),
            expected: expectedBg,
            actual: actualBg,
            inlineStyle: inlineStyle
          });
        }
      }
    });

    return issues;
  });

  if (specificityIssues.length > 0) {
    console.log('\n⚠️  CSS 특정성 문제 발견:');
    specificityIssues.forEach(issue => {
      console.log(`\n버튼: "${issue.element}"`);
      console.log(`기대값: ${issue.expected}`);
      console.log(`실제값: ${issue.actual}`);
    });
  }

  // CSS 로딩 순서 확인
  const cssLoadOrder = await page.evaluate(() => {
    return Array.from(document.styleSheets).map((sheet, index) => ({
      order: index,
      href: sheet.href,
      rules: sheet.cssRules ? sheet.cssRules.length : 0,
      media: sheet.media.mediaText
    }));
  });

  console.log('\n=== CSS 로딩 순서 ===');
  cssLoadOrder.forEach(sheet => {
    if (sheet.href) {
      const filename = sheet.href.split('/').pop();
      console.log(`${sheet.order}: ${filename} (${sheet.rules} rules)`);
    }
  });

  // 해결 방안 제시
  console.log('\n=== 권장 해결 방안 ===');
  console.log('1. Video.js CSS를 스코프 제한:');
  console.log('   - .video-js-player-wrapper 내부에만 적용되도록 수정');
  console.log('2. 인라인 스타일 대신 CSS 클래스 사용:');
  console.log('   - 더 높은 특정성을 가진 클래스 정의');
  console.log('3. CSS 모듈 또는 styled-components 사용 고려');
  console.log('4. !important 플래그 사용 (최후의 수단)');

  console.log('\n테스트를 완료하려면 브라우저를 닫으세요...');
  await new Promise(() => {});
}

// 테스트 실행
checkVideoCSSConflict().catch(console.error);