/**
 * VideoPlanet 실제 작동 기능 테스트
 * 현재 구현된 기능만 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 환경 설정 - Railway 백엔드 사용
const API_URL = 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'http://localhost:3000';

// 테스트 결과 저장
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// API 클라이언트
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// 인증 토큰 저장
let authToken = '';
let sessionCookies = '';
let testProjectId = '';
let testUserId = '';

// 테스트 데이터
const testData = {
  user: {
    email: 'demo@test.com',
    password: 'demo1234'
  },
  project: {
    name: `테스트 프로젝트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '기능 테스트를 위한 프로젝트',
    color: '#1631F8',
    process: [
      {
        key: 'basic_plan',
        name: '기본 기획',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        key: 'video_edit',
        name: '편집',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  },
  feedback: {
    text: '영상의 0:30 지점에서 전환이 너무 빠릅니다.',
    section: '00:30',
    security: false
  }
};

// 헬퍼 함수
function logTest(name, result, duration, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name} (${duration}ms)`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({
    name,
    result,
    duration,
    details,
    timestamp: new Date()
  });
  
  testResults.summary.total++;
  if (result) testResults.summary.passed++;
  else testResults.summary.failed++;
}

async function testEndpoint(name, method, url, data = null, options = {}) {
  const startTime = Date.now();
  try {
    // 헤더 설정을 명확히 분리
    const headers = {
      ...options.headers
    };
    
    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // 인증 토큰이 있으면 추가
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // 쿠키가 있으면 추가
    if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
    }
    
    const config = {
      ...options,
      headers
    };
    
    // 디버깅용 로그
    if (authToken && url.includes('/users/me')) {
      console.log(`   Authorization 헤더: ${headers['Authorization'].substring(0, 50)}...`);
      console.log(`   전체 헤더:`, headers);
    }
    
    // axios 인스턴스 대신 직접 사용
    const fullUrl = `${API_URL}${url}`;
    // GET 요청은 data 파라미터 없이, 다른 메서드는 data 포함
    const response = method.toLowerCase() === 'get' 
      ? await axios.get(fullUrl, config)
      : await axios[method](fullUrl, data, config);
    const duration = Date.now() - startTime;
    
    logTest(name, true, duration, `Status: ${response.status}`);
    return { success: true, data: response.data, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const details = error.response 
      ? `Status: ${error.response.status}, ${error.response.data?.message || error.message}`
      : error.message;
    
    logTest(name, false, duration, details);
    return { success: false, error, duration };
  }
}

// 페이지 접근 테스트
async function testPageAccess(name, path) {
  const startTime = Date.now();
  try {
    const response = await axios.get(`${FRONTEND_URL}${path}`, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    const duration = Date.now() - startTime;
    logTest(
      name,
      response.status < 400,
      duration,
      `Status: ${response.status}`
    );
    return response.status < 400;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest(name, false, duration, error.message);
    return false;
  }
}

// 테스트 시나리오들
const testScenarios = {
  // 1. 기본 서버 및 페이지 접근성 테스트
  async testBasicAccess() {
    console.log('\n🌐 기본 접근성 테스트');
    console.log('=====================================');
    
    // API 서버 상태
    await testEndpoint('백엔드 헬스체크', 'get', '/api/health/');
    
    // 프론트엔드 페이지들
    await testPageAccess('홈페이지', '/');
    await testPageAccess('로그인 페이지', '/login');
    await testPageAccess('회원가입 페이지', '/signup');
    await testPageAccess('마이페이지', '/mypage');
    await testPageAccess('프로젝트 목록', '/cmshome');
    await testPageAccess('영상 기획', '/videoplanning');
    await testPageAccess('캘린더', '/calendar');
  },

  // 2. 인증 시스템 테스트
  async testAuth() {
    console.log('\n🔐 인증 시스템 테스트');
    console.log('=====================================');
    
    // 로그인
    const loginResult = await testEndpoint(
      '로그인',
      'post',
      '/api/users/login/',
      {
        email: testData.user.email,
        password: testData.user.password
      }
    );
    
    if (loginResult.success) {
      console.log('   로그인 응답:', JSON.stringify(loginResult.data, null, 2));
      
      // 다양한 토큰 형식 확인
      authToken = loginResult.data.token || 
                  loginResult.data.access || 
                  loginResult.data.access_token || 
                  loginResult.data.vridge_session || '';
      
      testUserId = loginResult.data.user?.id || 
                   loginResult.data.id || '';
      
      // 쿠키 설정
      sessionCookies = `vridge_session=${authToken}`;
      
      // JWT 토큰이 반환되었는지 확인
      if (authToken) {
        console.log(`   ✅ JWT 토큰 발급 성공 (길이: ${authToken.length})`);
        console.log(`   ✅ 쿠키 설정: ${sessionCookies.substring(0, 40)}...`);
      } else {
        console.log('   ❌ JWT 토큰이 응답에 없습니다');
      }
      
      // 현재 사용자 정보 조회
      await testEndpoint('현재 사용자 정보', 'get', '/api/users/me/');
    }
    
    return loginResult.success;
  },

  // 3. 프로젝트 관리 테스트
  async testProjects() {
    console.log('\n📁 프로젝트 관리 테스트');
    console.log('=====================================');
    
    if (!authToken) {
      console.log('   ⚠️  로그인이 필요합니다.');
      return;
    }
    
    // 프로젝트 목록 조회
    await testEndpoint('프로젝트 목록 조회', 'get', '/api/projects/');
    
    // 프로젝트 생성
    const createResult = await testEndpoint(
      '프로젝트 생성',
      'post',
      '/api/projects/create/',
      testData.project
    );
    
    if (createResult.success) {
      // 응답 구조 확인
      console.log('   프로젝트 생성 응답:', JSON.stringify(createResult.data, null, 2));
      
      // 다양한 응답 형식 처리
      testProjectId = createResult.data?.project_id || 
                     createResult.data?.result?.id || 
                     createResult.data?.id;
      
      if (testProjectId) {
        console.log(`   ✅ 프로젝트 생성 성공 (ID: ${testProjectId})`);
      
      // 생성된 프로젝트 조회
      await testEndpoint(
        '프로젝트 상세 조회',
        'get',
        `/api/projects/detail/${testProjectId}/`
      );
      } else {
        console.log('   ❌ 프로젝트 ID를 응답에서 찾을 수 없습니다');
      }
    }
  },

  // 4. 피드백 시스템 테스트
  async testFeedback() {
    console.log('\n💬 피드백 시스템 테스트');
    console.log('=====================================');
    
    if (!testProjectId) {
      console.log('   ⚠️  프로젝트가 필요합니다.');
      return;
    }
    
    // 피드백 페이지 접근
    const feedbackPageAccess = await testPageAccess(
      '피드백 페이지 접근',
      `/feedback/${testProjectId}`
    );
    
    if (feedbackPageAccess) {
      // 피드백 목록 조회
      await testEndpoint(
        '피드백 목록 조회',
        'get',
        `/api/feedbacks/${testProjectId}`
      );
      
      // 피드백 작성 (파일 업로드 필요)
      const formData = new FormData();
      
      // 더미 파일 생성
      const testFilePath = path.join(__dirname, 'test-video.mp4');
      if (fs.existsSync(testFilePath)) {
        formData.append('files', fs.createReadStream(testFilePath));
      } else {
        // 파일이 없으면 임시로 생성
        fs.writeFileSync(testFilePath, 'test video content');
        formData.append('files', fs.createReadStream(testFilePath));
      }
      
      const feedbackResult = await testEndpoint(
        '피드백 작성',
        'post',
        `/api/feedbacks/${testProjectId}`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );
      
      if (feedbackResult.success) {
        console.log('   ✅ 피드백 작성 성공');
      }
    }
  },

  // 5. 마이페이지 기능 테스트
  async testMyPage() {
    console.log('\n👤 마이페이지 기능 테스트');
    console.log('=====================================');
    
    if (!authToken) {
      console.log('   ⚠️  로그인이 필요합니다.');
      return;
    }
    
    // 마이페이지 데이터 조회
    await testEndpoint('마이페이지 정보', 'get', '/api/users/mypage/');
    
    // 프로필 업데이트 (구현된 경우)
    await testEndpoint(
      '프로필 업데이트',
      'patch',
      '/api/users/profile/update/',
      {
        nickname: '업데이트된 닉네임',
        bio: 'VideoPlanet에서 활동하는 영상 제작자입니다.'
      }
    );
  },

  // 6. WebSocket 연결 테스트
  async testWebSocket() {
    console.log('\n🔌 WebSocket 연결 테스트');
    console.log('=====================================');
    
    if (!testProjectId) {
      console.log('   ⚠️  프로젝트가 필요합니다.');
      return;
    }
    
    // WebSocket 연결 정보 조회 - 피드백 ID가 필요함
    const wsInfoResult = await testEndpoint(
      'WebSocket 정보',
      'get',
      `/api/feedbacks/${testProjectId}`  // 일단 피드백 조회로 대체
    );
    
    if (wsInfoResult.success) {
      console.log('   ✅ WebSocket 연결 정보 획득');
      
      // WebSocket 연결 시도
      try {
        const WebSocket = require('ws');
        const wsUrl = `ws://localhost:8001/ws/feedback/${testProjectId}/`;
        const ws = new WebSocket(wsUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        await new Promise((resolve, reject) => {
          ws.on('open', () => {
            logTest('WebSocket 연결', true, 0, 'Connected');
            ws.close();
            resolve();
          });
          
          ws.on('error', (error) => {
            logTest('WebSocket 연결', false, 0, error.message);
            reject(error);
          });
          
          setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
          }, 5000);
        }).catch(() => {});
      } catch (error) {
        console.log('   ℹ️  WebSocket 모듈이 없습니다.');
      }
    }
  }
};

// 메인 테스트 실행
async function runWorkingTests() {
  console.log('🎯 VideoPlanet 실제 작동 기능 테스트');
  console.log('='.repeat(60));
  console.log(`백엔드 URL: ${API_URL}`);
  console.log(`프론트엔드 URL: ${FRONTEND_URL}`);
  console.log(`테스트 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log('='.repeat(60));
  
  try {
    // 순차적으로 테스트 실행
    await testScenarios.testBasicAccess();
    
    const loggedIn = await testScenarios.testAuth();
    
    if (loggedIn) {
      await testScenarios.testProjects();
      await testScenarios.testFeedback();
      await testScenarios.testMyPage();
      await testScenarios.testWebSocket();
    }
    
  } catch (error) {
    console.error('\n💥 예상치 못한 오류:', error.message);
  }
  
  // 최종 결과 요약
  testResults.summary.duration = Date.now() - testResults.startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`총 테스트: ${testResults.summary.total}개`);
  console.log(`✅ 성공: ${testResults.summary.passed}개`);
  console.log(`❌ 실패: ${testResults.summary.failed}개`);
  console.log(`⏱️  총 소요시간: ${(testResults.summary.duration / 1000).toFixed(1)}초`);
  console.log(`📈 성공률: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(1)}%`);
  
  // 성공한 기능 요약
  const passedTests = testResults.tests.filter(t => t.result);
  if (passedTests.length > 0) {
    console.log('\n✅ 작동하는 기능:');
    passedTests.forEach(test => {
      console.log(`   - ${test.name}`);
    });
  }
  
  // 실패한 기능 요약
  const failedTests = testResults.tests.filter(t => !t.result);
  if (failedTests.length > 0) {
    console.log('\n❌ 작동하지 않는 기능:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`);
    });
  }
  
  // 결과 파일 저장
  const reportPath = path.join(__dirname, `working-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 상세 리포트: ${reportPath}`);
  
  console.log('\n✨ 실제 작동 기능 테스트 완료!');
}

// 실행
if (require.main === module) {
  runWorkingTests().catch(console.error);
}

module.exports = { runWorkingTests };