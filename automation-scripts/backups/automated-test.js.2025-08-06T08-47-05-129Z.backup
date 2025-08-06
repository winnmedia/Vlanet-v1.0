/**
 * VideoPlanet 자동화 테스트 스크립트
 * CLAUDE.md 기반 사용자 여정 시나리오 자동 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 환경 설정
const API_URL = 'http://localhost:8001';
const FRONTEND_URL = 'http://localhost:3001';

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
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// 인증 토큰 저장
let authToken = '';
let sessionCookies = '';

// 테스트 데이터
const testData = {
  user: {
    email: 'demo@test.com',
    password: 'demo1234'
  },
  project: {
    name: `자동 테스트 프로젝트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '자동화 테스트를 위한 프로젝트'
  },
  feedback: {
    text: '자동 테스트 피드백: 영상의 00:30 지점에서 전환이 빠릅니다.',
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
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': authToken ? `Bearer ${authToken}` : undefined,
        'Cookie': sessionCookies || undefined
      }
    };
    
    const response = await api[method](url, data, config);
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

// 테스트 시나리오들
const testScenarios = {
  // 1. 서버 상태 확인
  async checkServers() {
    console.log('\n📡 서버 상태 확인');
    
    // 백엔드 헬스체크
    await testEndpoint('백엔드 서버 상태', 'get', '/api/health/');
    
    // 프론트엔드 확인
    const frontendStart = Date.now();
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
      const duration = Date.now() - frontendStart;
      logTest('프론트엔드 서버 상태', true, duration, `Status: ${response.status}`);
    } catch (error) {
      const duration = Date.now() - frontendStart;
      logTest('프론트엔드 서버 상태', false, duration, error.message);
    }
  },

  // 2. 인증 테스트
  async testAuthentication() {
    console.log('\n🔐 인증 시스템 테스트');
    
    // 로그인 테스트
    const loginResult = await testEndpoint(
      '로그인 API',
      'post',
      '/api/users/login/',
      {
        email: testData.user.email,
        password: testData.user.password
      }
    );
    
    if (loginResult.success && loginResult.data) {
      // 토큰 저장
      if (loginResult.data.token) {
        authToken = loginResult.data.token;
      }
      
      // 세션 정보 확인
      await testEndpoint('사용자 정보 조회', 'get', '/api/users/me/');
    }
  },

  // 3. 프로젝트 관리 테스트
  async testProjectManagement() {
    console.log('\n📁 프로젝트 관리 테스트');
    
    // 프로젝트 목록 조회
    await testEndpoint('프로젝트 목록 조회', 'get', '/api/projects/project/');
    
    // 프로젝트 생성
    const createResult = await testEndpoint(
      '프로젝트 생성',
      'post',
      '/api/projects/project/',
      testData.project
    );
    
    if (createResult.success && createResult.data?.result?.id) {
      testData.project.id = createResult.data.result.id;
      
      // 생성된 프로젝트 조회
      await testEndpoint(
        '프로젝트 상세 조회',
        'get',
        `/api/projects/project/${testData.project.id}/`
      );
    }
  },

  // 4. 피드백 시스템 테스트
  async testFeedbackSystem() {
    console.log('\n💬 피드백 시스템 테스트');
    
    if (!testData.project.id) {
      console.log('   ⚠️  프로젝트가 생성되지 않아 피드백 테스트를 건너뜁니다.');
      return;
    }
    
    // 피드백 목록 조회
    await testEndpoint(
      '피드백 목록 조회',
      'get',
      `/api/feedbacks/feedback/${testData.project.id}/`
    );
    
    // 피드백 작성
    const feedbackResult = await testEndpoint(
      '피드백 작성',
      'post',
      `/api/feedbacks/feedback/${testData.project.id}/`,
      testData.feedback
    );
    
    if (feedbackResult.success) {
      // 피드백 목록 재조회 (실시간 반영 확인)
      await testEndpoint(
        '피드백 실시간 반영 확인',
        'get',
        `/api/feedbacks/feedback/${testData.project.id}/`
      );
    }
  },

  // 5. 프론트엔드 페이지 접근성 테스트
  async testFrontendPages() {
    console.log('\n🌐 프론트엔드 페이지 접근성 테스트');
    
    const pages = [
      { name: '홈페이지', path: '/' },
      { name: '로그인 페이지', path: '/login' },
      { name: '프로젝트 목록', path: '/cmshome' },
      { name: '영상 기획', path: '/videoplanning' },
      { name: '마이페이지', path: '/mypage' }
    ];
    
    for (const page of pages) {
      const start = Date.now();
      try {
        const response = await axios.get(`${FRONTEND_URL}${page.path}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        const duration = Date.now() - start;
        logTest(
          `${page.name} 접근`,
          response.status < 400,
          duration,
          `Status: ${response.status}`
        );
      } catch (error) {
        const duration = Date.now() - start;
        logTest(`${page.name} 접근`, false, duration, error.message);
      }
    }
  },

  // 6. 성능 측정
  async testPerformance() {
    console.log('\n⚡ 성능 측정 (1000% 성과 기준)');
    
    const performanceTests = testResults.tests.filter(t => t.duration > 0);
    const avgDuration = performanceTests.reduce((sum, t) => sum + t.duration, 0) / performanceTests.length;
    
    // CLAUDE.md 기준
    const criteria = {
      '페이지 로드 < 1초': performanceTests.filter(t => t.name.includes('페이지')).every(t => t.duration < 1000),
      'API 응답 < 500ms': performanceTests.filter(t => t.name.includes('API')).every(t => t.duration < 500),
      '로그인 < 500ms': testResults.tests.find(t => t.name === '로그인 API')?.duration < 500,
      '프로젝트 생성 < 2초': testResults.tests.find(t => t.name === '프로젝트 생성')?.duration < 2000,
      '피드백 등록 < 1초': testResults.tests.find(t => t.name === '피드백 작성')?.duration < 1000
    };
    
    Object.entries(criteria).forEach(([criterion, met]) => {
      logTest(`성능 기준: ${criterion}`, met, 0);
    });
    
    const achievementRate = Object.values(criteria).filter(v => v).length / Object.keys(criteria).length * 100;
    console.log(`\n🏆 1000% 성과 달성률: ${achievementRate.toFixed(1)}%`);
  }
};

// 메인 테스트 실행
async function runAutomatedTests() {
  console.log('🎯 VideoPlanet 자동화 테스트 시작');
  console.log('='.repeat(60));
  console.log(`백엔드 URL: ${API_URL}`);
  console.log(`프론트엔드 URL: ${FRONTEND_URL}`);
  console.log(`테스트 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log('='.repeat(60));
  
  try {
    // 순차적으로 테스트 실행
    await testScenarios.checkServers();
    await testScenarios.testAuthentication();
    await testScenarios.testProjectManagement();
    await testScenarios.testFeedbackSystem();
    await testScenarios.testFrontendPages();
    await testScenarios.testPerformance();
    
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
  
  // 결과 파일 저장
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 상세 리포트: ${reportPath}`);
  
  console.log('\n✨ 테스트 완료!');
}

// 실행
if (require.main === module) {
  runAutomatedTests().catch(console.error);
}

module.exports = { runAutomatedTests };