const puppeteer = require('puppeteer');

(async () => {
  console.log('프로젝트 생성 페이지 테스트 시작...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 콘솔 메시지 캡처
    page.on('console', msg => {
      console.log(`브라우저 콘솔 [${msg.type()}]:`, msg.text());
    });
    
    // 페이지 에러 캡처
    page.on('pageerror', error => {
      console.error('페이지 에러:', error.message);
    });
    
    // 요청 실패 캡처
    page.on('requestfailed', request => {
      console.error('요청 실패:', request.url(), request.failure().errorText);
    });
    
    console.log('\n1. 프로젝트 생성 페이지로 이동 중...');
    const response = await page.goto('http://localhost:3000/ProjectCreate', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('   HTTP 상태:', response.status());
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('   페이지 제목:', title);
    
    // 페이지 콘텐츠 확인
    await page.waitForTimeout(2000);
    
    // 메인 컨테이너 확인
    const hasMainContent = await page.evaluate(() => {
      const mainContent = document.querySelector('.cms_wrap.project-create');
      return mainContent !== null;
    });
    
    console.log('   메인 컨테이너 존재:', hasMainContent);
    
    // 프로젝트 제목 확인
    const projectTitle = await page.evaluate(() => {
      const titleElement = document.querySelector('.title');
      return titleElement ? titleElement.textContent : null;
    });
    
    console.log('   프로젝트 페이지 제목:', projectTitle);
    
    // 입력 필드 확인
    const inputFields = await page.evaluate(() => {
      return {
        name: document.querySelector('input[name="name"]') !== null,
        description: document.querySelector('textarea[name="description"]') !== null,
        manager: document.querySelector('input[name="manager"]') !== null,
        consumer: document.querySelector('input[name="consumer"]') !== null
      };
    });
    
    console.log('   입력 필드 존재:', inputFields);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ 
      path: '/tmp/project-create-page.png',
      fullPage: true 
    });
    console.log('   스크린샷 저장: /tmp/project-create-page.png');
    
    // 페이지 HTML 일부 출력
    const bodyHTML = await page.evaluate(() => {
      const body = document.body;
      return body ? body.innerHTML.substring(0, 500) : 'No body content';
    });
    
    console.log('\n페이지 HTML (처음 500자):');
    console.log(bodyHTML);
    
  } catch (error) {
    console.error('테스트 중 오류:', error);
  } finally {
    await browser.close();
    console.log('\n테스트 완료');
  }
})();