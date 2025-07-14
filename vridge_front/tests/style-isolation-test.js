const puppeteer = require('puppeteer');

// API 기본 URL
const BASE_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'http://localhost:3000';

// 스타일 격리 문제 확인
async function checkStyleIsolation() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();

  // 콘솔 메시지 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('콘솔 에러:', msg.text());
    }
  });

  console.log('1. 로그인 페이지로 이동...');
  await page.goto(`${FRONTEND_URL}/Login`, { waitUntil: 'networkidle2' });

  // 로그인
  console.log('2. 로그인 중...');
  await page.type('input[name="email"]', 'winnmedia_dev@naver.com');
  await page.type('input[name="password"]', 'qldrPwjd12!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // 비디오가 없는 프로젝트 테스트
  console.log('\n3. 비디오 없는 프로젝트 테스트...');
  await page.goto(`${FRONTEND_URL}/Feedback/155`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const beforeVideoStyles = await page.evaluate(() => {
    const elements = {
      feedback_page: document.querySelector('.feedback_page'),
      videobox: document.querySelector('.videobox'),
      video_inner: document.querySelector('.video_inner'),
      buttons: document.querySelectorAll('button[style]'),
      feedbackButtons: document.querySelectorAll('.feedback-button-primary, .feedback-button-danger')
    };

    const results = {};
    
    // feedback_page 스타일
    if (elements.feedback_page) {
      const computed = window.getComputedStyle(elements.feedback_page);
      results.feedback_page = {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        padding: computed.padding,
        className: elements.feedback_page.className,
        hasInlineStyle: elements.feedback_page.hasAttribute('style')
      };
    }

    // videobox 스타일
    if (elements.videobox) {
      const computed = window.getComputedStyle(elements.videobox);
      results.videobox = {
        display: computed.display,
        width: computed.width,
        height: computed.height,
        className: elements.videobox.className
      };
    }

    // 인라인 스타일을 가진 버튼들
    results.inlineStyleButtons = Array.from(elements.buttons).map(btn => ({
      text: btn.textContent.trim(),
      hasInlineStyle: true,
      styleAttribute: btn.getAttribute('style')
    }));

    // CSS 클래스를 사용하는 버튼들
    results.cssButtons = Array.from(elements.feedbackButtons).map(btn => ({
      text: btn.textContent.trim(),
      className: btn.className,
      computedBackground: window.getComputedStyle(btn).background
    }));

    // 로드된 스타일시트 확인
    results.stylesheets = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      disabled: sheet.disabled,
      rules: sheet.cssRules ? sheet.cssRules.length : 0
    }));

    return results;
  });

  console.log('\n비디오 없는 상태의 스타일:', JSON.stringify(beforeVideoStyles, null, 2));

  // 비디오가 있는 프로젝트로 이동
  console.log('\n4. 비디오 있는 프로젝트로 이동...');
  await page.goto(`${FRONTEND_URL}/Feedback/153`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(5000);

  const afterVideoStyles = await page.evaluate(() => {
    const elements = {
      feedback_page: document.querySelector('.feedback_page'),
      videobox: document.querySelector('.videobox'),
      video_inner: document.querySelector('.video_inner'),
      videoPlayer: document.querySelector('.video-js-player-wrapper'),
      videoJs: document.querySelector('.video-js'),
      buttons: document.querySelectorAll('button[style]'),
      feedbackButtons: document.querySelectorAll('.feedback-button-primary, .feedback-button-danger')
    };

    const results = {};
    
    // feedback_page 스타일
    if (elements.feedback_page) {
      const computed = window.getComputedStyle(elements.feedback_page);
      results.feedback_page = {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        padding: computed.padding,
        className: elements.feedback_page.className,
        hasInlineStyle: elements.feedback_page.hasAttribute('style')
      };
    }

    // videobox 스타일
    if (elements.videobox) {
      const computed = window.getComputedStyle(elements.videobox);
      results.videobox = {
        display: computed.display,
        width: computed.width,
        height: computed.height,
        className: elements.videobox.className
      };
    }

    // 비디오 플레이어 스타일
    if (elements.videoPlayer) {
      const computed = window.getComputedStyle(elements.videoPlayer);
      results.videoPlayer = {
        position: computed.position,
        width: computed.width,
        background: computed.background,
        className: elements.videoPlayer.className
      };
    }

    // Video.js 스타일
    if (elements.videoJs) {
      results.videoJsClasses = elements.videoJs.className;
    }

    // 인라인 스타일 버튼
    results.inlineStyleButtons = Array.from(elements.buttons).map(btn => ({
      text: btn.textContent.trim(),
      hasInlineStyle: true,
      styleAttribute: btn.getAttribute('style')
    }));

    // CSS 클래스 버튼
    results.cssButtons = Array.from(elements.feedbackButtons).map(btn => ({
      text: btn.textContent.trim(),
      className: btn.className,
      computedBackground: window.getComputedStyle(btn).background
    }));

    // 로드된 스타일시트
    results.stylesheets = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      disabled: sheet.disabled,
      rules: sheet.cssRules ? sheet.cssRules.length : 0
    }));

    // CSS 우선순위 충돌 확인
    const allRules = [];
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.selectorText && 
                (rule.selectorText.includes('.feedback') || 
                 rule.selectorText.includes('.video') ||
                 rule.selectorText.includes('button'))) {
              allRules.push({
                selector: rule.selectorText,
                specificity: calculateSpecificity(rule.selectorText),
                source: sheet.href || 'inline'
              });
            }
          });
        }
      } catch (e) {}
    });

    // 특정성 계산 (간단한 버전)
    function calculateSpecificity(selector) {
      const ids = (selector.match(/#/g) || []).length;
      const classes = (selector.match(/\./g) || []).length;
      const tags = (selector.match(/^[a-z]+|\s[a-z]+/gi) || []).length;
      return ids * 100 + classes * 10 + tags;
    }

    results.cssRules = allRules.sort((a, b) => b.specificity - a.specificity);

    return results;
  });

  console.log('\n비디오 있는 상태의 스타일:', JSON.stringify(afterVideoStyles, null, 2));

  // 스타일 변화 분석
  console.log('\n=== 스타일 변화 분석 ===');
  
  // feedback_page 변화 확인
  if (beforeVideoStyles.feedback_page && afterVideoStyles.feedback_page) {
    const before = beforeVideoStyles.feedback_page;
    const after = afterVideoStyles.feedback_page;
    
    if (before.display !== after.display || 
        before.flexDirection !== after.flexDirection ||
        before.gap !== after.gap) {
      console.log('⚠️  feedback_page 스타일이 변경되었습니다!');
      console.log('  이전:', before);
      console.log('  이후:', after);
    }
  }

  // 스타일시트 변화 확인
  const beforeSheets = beforeVideoStyles.stylesheets.length;
  const afterSheets = afterVideoStyles.stylesheets.length;
  
  if (beforeSheets !== afterSheets) {
    console.log(`\n⚠️  스타일시트 개수 변화: ${beforeSheets} -> ${afterSheets}`);
    console.log('새로 추가된 스타일시트:');
    afterVideoStyles.stylesheets.forEach(sheet => {
      const exists = beforeVideoStyles.stylesheets.find(s => s.href === sheet.href);
      if (!exists && sheet.href) {
        console.log(`  - ${sheet.href}`);
      }
    });
  }

  // CSS 우선순위 문제 확인
  if (afterVideoStyles.cssRules) {
    console.log('\n=== CSS 우선순위 분석 ===');
    const videoRules = afterVideoStyles.cssRules.filter(r => r.selector.includes('video'));
    const feedbackRules = afterVideoStyles.cssRules.filter(r => r.selector.includes('feedback'));
    
    console.log(`비디오 관련 규칙: ${videoRules.length}개`);
    console.log(`피드백 관련 규칙: ${feedbackRules.length}개`);
    
    // 높은 우선순위 규칙 표시
    console.log('\n높은 우선순위 규칙 (상위 5개):');
    afterVideoStyles.cssRules.slice(0, 5).forEach(rule => {
      console.log(`  ${rule.selector} (특정성: ${rule.specificity}, 출처: ${rule.source})`);
    });
  }

  console.log('\n테스트를 완료하려면 브라우저를 닫으세요...');
  // 브라우저를 열어둔 상태로 유지
  await new Promise(() => {});
}

// 테스트 실행
checkStyleIsolation().catch(console.error);