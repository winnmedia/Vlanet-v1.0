const axios = require('axios');

const API_URL = process.env.API_URL || 'https://videoplanet.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPublicPages() {
  log('\n========== 공개 페이지 접근 테스트 ==========', 'cyan');
  
  const publicPages = [
    '/',
    '/login',
    '/signup',
    '/terms',
    '/privacy'
  ];
  
  for (const page of publicPages) {
    try {
      const url = `${FRONTEND_URL}${page}`;
      log(`\n테스트: ${page}`, 'blue');
      
      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        log(`✅ ${page} - 정상 접근 가능 (200 OK)`, 'green');
      } else if (response.status === 301 || response.status === 302) {
        log(`⚠️  ${page} - 리다이렉트 발생 (${response.status})`, 'yellow');
        log(`   리다이렉트 대상: ${response.headers.location}`, 'yellow');
      } else {
        log(`❌ ${page} - 접근 오류 (${response.status})`, 'red');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`❌ 프론트엔드 서버가 실행 중이지 않습니다.`, 'red');
        log(`   다음 명령어로 서버를 시작하세요: npm run dev`, 'yellow');
        process.exit(1);
      } else {
        log(`❌ ${page} - 오류 발생: ${error.message}`, 'red');
      }
    }
  }
}

async function testProtectedPages() {
  log('\n========== 보호된 페이지 접근 테스트 ==========', 'cyan');
  
  const protectedPages = [
    '/cmshome',
    '/calendar',
    '/mypage',
    '/project/create',
    '/videoplanning'
  ];
  
  for (const page of protectedPages) {
    try {
      const url = `${FRONTEND_URL}${page}`;
      log(`\n테스트: ${page}`, 'blue');
      
      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 301 || response.status === 302 || response.status === 307) {
        const location = response.headers.location;
        if (location && location.includes('/login')) {
          log(`✅ ${page} - 정상적으로 로그인 페이지로 리다이렉트`, 'green');
        } else {
          log(`⚠️  ${page} - 다른 페이지로 리다이렉트: ${location}`, 'yellow');
        }
      } else if (response.status === 200) {
        log(`⚠️  ${page} - 인증 없이 접근 가능 (보안 문제)`, 'yellow');
      } else {
        log(`❌ ${page} - 예상치 못한 상태 (${response.status})`, 'red');
      }
    } catch (error) {
      log(`❌ ${page} - 오류 발생: ${error.message}`, 'red');
    }
  }
}

async function testAPIEndpoints() {
  log('\n========== API 엔드포인트 테스트 ==========', 'cyan');
  
  // 공개 API 테스트
  log('\n[공개 API]', 'blue');
  try {
    const healthResponse = await axios.get(`${API_URL}/api/health/`);
    if (healthResponse.status === 200) {
      log('✅ /api/health/ - 정상 접근 가능', 'green');
    }
  } catch (error) {
    log(`⚠️  /api/health/ - ${error.response?.status || error.message}`, 'yellow');
  }
  
  // 보호된 API 테스트 (인증 없이)
  log('\n[보호된 API - 인증 없이]', 'blue');
  const protectedAPIs = [
    '/api/projects/',
    '/api/users/me/',
    '/api/feedbacks/'
  ];
  
  for (const api of protectedAPIs) {
    try {
      const response = await axios.get(`${API_URL}${api}`, {
        validateStatus: (status) => true
      });
      
      if (response.status === 401) {
        log(`✅ ${api} - 정상적으로 401 반환`, 'green');
      } else if (response.status === 200) {
        log(`❌ ${api} - 인증 없이 접근 가능 (보안 문제)`, 'red');
      } else {
        log(`⚠️  ${api} - 예상치 못한 상태 (${response.status})`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${api} - 오류 발생: ${error.message}`, 'red');
    }
  }
}

async function testLoginFlow() {
  log('\n========== 로그인 플로우 테스트 ==========', 'cyan');
  
  try {
    // 로그인 시도
    log('\n로그인 시도...', 'blue');
    const loginResponse = await axios.post(`${API_URL}/users/login/`, {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, {
      validateStatus: (status) => true
    });
    
    if (loginResponse.status === 401) {
      log('✅ 잘못된 인증 정보로 401 반환', 'green');
    } else if (loginResponse.status === 200) {
      log('⚠️  테스트 계정으로 로그인 성공', 'yellow');
      
      // 토큰으로 보호된 API 접근 테스트
      const token = loginResponse.data.vridge_session || loginResponse.data.access;
      if (token) {
        const meResponse = await axios.get(`${API_URL}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (meResponse.status === 200) {
          log('✅ 토큰으로 사용자 정보 조회 성공', 'green');
        }
      }
    } else {
      log(`⚠️  예상치 못한 상태 (${loginResponse.status})`, 'yellow');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ 잘못된 인증 정보로 401 반환', 'green');
    } else {
      log(`⚠️  로그인 테스트 중 오류: ${error.message}`, 'yellow');
    }
  }
}

async function runAllTests() {
  log('\n🔍 VideoPlanet 인증 시스템 테스트 시작', 'cyan');
  log('='repeat(50), 'cyan');
  
  try {
    await testPublicPages();
    await testProtectedPages();
    await testAPIEndpoints();
    await testLoginFlow();
    
    log('\n' + '='repeat(50), 'cyan');
    log('✅ 모든 테스트 완료', 'green');
    log('\n요약:', 'cyan');
    log('1. 공개 페이지는 인증 없이 접근 가능해야 함', 'blue');
    log('2. 보호된 페이지는 로그인 페이지로 리다이렉트되어야 함', 'blue');
    log('3. API는 적절한 인증 상태 코드를 반환해야 함', 'blue');
    log('4. 로그인 후 토큰으로 보호된 리소스에 접근 가능해야 함', 'blue');
  } catch (error) {
    log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 테스트 실행
runAllTests();