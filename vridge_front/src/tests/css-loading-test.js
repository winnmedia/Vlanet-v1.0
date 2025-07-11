const puppeteer = require('puppeteer');

// API 기본 URL
const BASE_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'http://localhost:3000';

// 피드백 페이지 CSS 로딩 확인
async function checkCSSLoading() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();

  // 네트워크 요청 모니터링
  const cssRequests = [];
  const failedRequests = [];

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('.css') || url.includes('.scss')) {
      cssRequests.push({
        url: url,
        status: response.status(),
        headers: response.headers()
      });
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

  console.log('3. 피드백 페이지로 이동 (비디오 없는 프로젝트)...');
  // 비디오가 없는 프로젝트로 이동
  await page.goto(`${FRONTEND_URL}/Feedback/155`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000);

  console.log('\n--- CSS 로딩 상태 (비디오 없음) ---');
  cssRequests.forEach(req => {
    console.log(`${req.status} - ${req.url}`);
  });

  // 스타일 적용 확인
  const styles1 = await page.evaluate(() => {
    const feedbackElement = document.querySelector('.feedback_page');
    const buttonElement = document.querySelector('.feedback-button-primary');
    const containerElement = document.querySelector('.feedback-container');
    
    const feedbackStyles = feedbackElement ? window.getComputedStyle(feedbackElement) : null;
    const buttonStyles = buttonElement ? window.getComputedStyle(buttonElement) : null;
    const containerStyles = containerElement ? window.getComputedStyle(containerElement) : null;

    return {
      feedback: feedbackStyles ? {
        display: feedbackStyles.display,
        backgroundColor: feedbackStyles.backgroundColor,
        padding: feedbackStyles.padding
      } : null,
      button: buttonStyles ? {
        display: buttonStyles.display,
        backgroundColor: buttonStyles.backgroundColor,
        color: buttonStyles.color
      } : null,
      container: containerStyles ? {
        display: containerStyles.display,
        backgroundColor: containerStyles.backgroundColor
      } : null
    };
  });

  console.log('\n스타일 적용 상태 (비디오 없음):', styles1);

  // CSS 요청 초기화
  cssRequests.length = 0;
  failedRequests.length = 0;

  console.log('\n4. 피드백 페이지로 이동 (비디오 있는 프로젝트)...');
  // 비디오가 있는 프로젝트로 이동
  await page.goto(`${FRONTEND_URL}/Feedback/153`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(5000);

  console.log('\n--- CSS 로딩 상태 (비디오 있음) ---');
  cssRequests.forEach(req => {
    console.log(`${req.status} - ${req.url}`);
  });

  // 스타일 적용 확인
  const styles2 = await page.evaluate(() => {
    const feedbackElement = document.querySelector('.feedback_page');
    const buttonElement = document.querySelector('.feedback-button-primary');
    const containerElement = document.querySelector('.feedback-container');
    const videoPlayerElement = document.querySelector('.video-js-player-wrapper');
    
    const feedbackStyles = feedbackElement ? window.getComputedStyle(feedbackElement) : null;
    const buttonStyles = buttonElement ? window.getComputedStyle(buttonElement) : null;
    const containerStyles = containerElement ? window.getComputedStyle(containerElement) : null;
    const videoStyles = videoPlayerElement ? window.getComputedStyle(videoPlayerElement) : null;

    return {
      feedback: feedbackStyles ? {
        display: feedbackStyles.display,
        backgroundColor: feedbackStyles.backgroundColor,
        padding: feedbackStyles.padding
      } : null,
      button: buttonStyles ? {
        display: buttonStyles.display,
        backgroundColor: buttonStyles.backgroundColor,
        color: buttonStyles.color
      } : null,
      container: containerStyles ? {
        display: containerStyles.display,
        backgroundColor: containerStyles.backgroundColor
      } : null,
      videoPlayer: videoStyles ? {
        display: videoStyles.display,
        position: videoStyles.position,
        width: videoStyles.width
      } : null
    };
  });

  console.log('\n스타일 적용 상태 (비디오 있음):', styles2);

  console.log('\n--- 실패한 요청 ---');
  failedRequests.forEach(req => {
    console.log(`FAILED: ${req.url} - ${req.failure.errorText}`);
  });

  // CSS 충돌 확인
  const conflicts = await page.evaluate(() => {
    const allStyleSheets = Array.from(document.styleSheets);
    const cssRules = [];
    
    allStyleSheets.forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.selectorText && 
                (rule.selectorText.includes('feedback') || 
                 rule.selectorText.includes('video') ||
                 rule.selectorText.includes('button'))) {
              cssRules.push({
                selector: rule.selectorText,
                styles: rule.style.cssText,
                source: sheet.href || 'inline'
              });
            }
          });
        }
      } catch (e) {
        // CORS 에러 무시
      }
    });
    
    return cssRules;
  });

  console.log('\n--- CSS 규칙 분석 ---');
  const feedbackRules = conflicts.filter(r => r.selector.includes('feedback'));
  const videoRules = conflicts.filter(r => r.selector.includes('video'));
  
  console.log(`피드백 관련 규칙: ${feedbackRules.length}개`);
  console.log(`비디오 관련 규칙: ${videoRules.length}개`);

  // 충돌 가능성 있는 규칙 찾기
  const potentialConflicts = conflicts.filter(r => 
    r.selector.includes('feedback') && r.selector.includes('video')
  );
  
  if (potentialConflicts.length > 0) {
    console.log('\n잠재적 충돌 규칙:');
    potentialConflicts.forEach(rule => {
      console.log(`- ${rule.selector} (${rule.source})`);
    });
  }

  console.log('\n테스트를 완료하려면 브라우저를 닫으세요...');
  // 브라우저를 열어둔 상태로 유지
  await new Promise(() => {});
}

// 테스트 실행
checkCSSLoading().catch(console.error);