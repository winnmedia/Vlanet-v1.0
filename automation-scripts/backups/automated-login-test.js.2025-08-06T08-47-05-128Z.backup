const puppeteer = require('puppeteer');

async function automatedLoginTest() {
  console.log('=== 자동화된 로그인 테스트 시작 ===\n');
  
  let browser;
  try {
    // 브라우저 실행
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 콘솔 로그 캡처
    page.on('console', msg => {
      console.log('브라우저 콘솔:', msg.text());
    });
    
    // 네트워크 요청 캡처
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('API 요청:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API 응답:', response.status(), response.url());
      }
    });
    
    // 1. 테스트 로그인 페이지 접속
    console.log('1. 테스트 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/test-login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. API URL 확인
    const apiUrl = await page.$eval('div', div => {
      const text = div.textContent;
      if (text.includes('API URL:')) {
        return text.split('API URL:')[1].trim();
      }
      return 'Not found';
    });
    console.log(`   API URL: ${apiUrl}`);
    
    // 3. 로그인 폼 채우기
    console.log('\n2. 로그인 정보 입력...');
    await page.type('input[type="email"]', 'demo@test.com');
    await page.type('input[type="password"]', 'demo1234');
    console.log('   ✅ 입력 완료');
    
    // 4. 로그인 버튼 클릭
    console.log('\n3. 로그인 시도...');
    await page.click('button');
    
    // 5. 결과 대기 (최대 10초)
    await page.waitForTimeout(3000);
    
    // 6. 결과 확인
    const messageElement = await page.$('div[style*="margin-top: 20px"]');
    if (messageElement) {
      const message = await page.evaluate(el => el.textContent, messageElement);
      console.log(`   결과: ${message}`);
      
      if (message.includes('성공')) {
        console.log('\n✅ 로그인 테스트 성공!');
      } else {
        console.log('\n❌ 로그인 테스트 실패');
      }
    }
    
  } catch (error) {
    console.error('테스트 중 오류:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Puppeteer 없이 기본 테스트
async function basicLoginTest() {
  const axios = require('axios');
  
  console.log('=== 기본 로그인 테스트 ===\n');
  
  // 1. 페이지 접근 가능 확인
  try {
    const pageResponse = await axios.get('http://localhost:3000/test-login', {
      validateStatus: () => true
    });
    console.log('1. 테스트 페이지 상태:', pageResponse.status);
  } catch (e) {
    console.log('1. 테스트 페이지 접근 실패:', e.message);
  }
  
  // 2. API 직접 테스트
  try {
    const apiResponse = await axios.post('http://localhost:8000/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    console.log('2. API 직접 테스트: ✅ 성공');
    console.log('   토큰:', apiResponse.data.vridge_session.substring(0, 50) + '...');
  } catch (e) {
    console.log('2. API 직접 테스트: ❌ 실패', e.response?.data);
  }
  
  // 3. 프록시 테스트
  try {
    const proxyResponse = await axios.post('http://localhost:3000/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    }, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    console.log('3. 프록시 테스트 상태:', proxyResponse.status);
    if (proxyResponse.status === 308) {
      console.log('   리다이렉트 위치:', proxyResponse.headers.location);
    }
  } catch (e) {
    console.log('3. 프록시 테스트 실패:', e.message);
  }
}

// 기본 테스트 실행
basicLoginTest();