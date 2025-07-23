const axios = require('axios');

// 설정
const API_BASE_URL = 'http://localhost:8000/api';
const FRONTEND_URL = 'http://localhost:3000';

// 테스트 결과 저장
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// 헬퍼 함수
const log = (message, type = 'info') => {
  const emoji = {
    info: '📊',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${emoji[type]} ${message}`);
};

const addResult = (category, test, passed, details = '') => {
  testResults.details.push({ category, test, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
};

// 테스트 함수들
async function testServerHealth() {
  log('서버 상태 확인', 'info');
  
  try {
    // 백엔드 헬스체크
    const backendHealth = await axios.get(`${API_BASE_URL}/health/`);
    addResult('Infrastructure', '백엔드 서버 헬스체크', true, backendHealth.data.status);
    
    // 프론트엔드 접속
    const frontendResponse = await axios.get(FRONTEND_URL);
    addResult('Infrastructure', '프론트엔드 서버 접속', true, 'HTTP 200');
  } catch (error) {
    addResult('Infrastructure', '서버 상태', false, error.message);
  }
}

async function testAuthentication() {
  log('인증 시스템 테스트', 'info');
  
  // 회원가입 테스트
  try {
    const signupData = {
      email: `test${Date.now()}@test.com`,
      nickname: `test${Date.now()}`,
      password: 'Test123!@#'
    };
    
    const signupResponse = await axios.post(`${API_BASE_URL}/users/signup/`, signupData);
    addResult('Authentication', '회원가입', true, '새 사용자 생성 성공');
  } catch (error) {
    addResult('Authentication', '회원가입', false, error.response?.data?.message || error.message);
  }
  
  // 로그인 테스트
  try {
    const loginData = {
      email: 'test@test.com',
      password: 'test123'
    };
    
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login/`, loginData);
    addResult('Authentication', '로그인', true, '인증 토큰 발급');
    
    // 토큰 저장
    global.authToken = loginResponse.data.access_token || loginResponse.data.token;
  } catch (error) {
    addResult('Authentication', '로그인', false, error.response?.data?.message || error.message);
  }
}

async function testProjectManagement() {
  log('프로젝트 관리 테스트', 'info');
  
  if (!global.authToken) {
    addResult('Project Management', '프로젝트 관리', false, '인증 토큰 없음');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${global.authToken}`,
    'Content-Type': 'application/json'
  };
  
  // 프로젝트 생성
  try {
    const projectData = {
      project_name: `테스트 프로젝트 ${Date.now()}`,
      brand_name: '테스트 브랜드',
      project_goal: '테스트 목표'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/projects/`, projectData, { headers });
    addResult('Project Management', '프로젝트 생성', true, '새 프로젝트 생성 성공');
    
    global.projectId = createResponse.data.id;
  } catch (error) {
    addResult('Project Management', '프로젝트 생성', false, error.response?.data?.message || error.message);
  }
  
  // 프로젝트 목록 조회
  try {
    const listResponse = await axios.get(`${API_BASE_URL}/projects/`, { headers });
    addResult('Project Management', '프로젝트 목록 조회', true, `${listResponse.data.length}개 프로젝트`);
  } catch (error) {
    addResult('Project Management', '프로젝트 목록 조회', false, error.response?.data?.message || error.message);
  }
}

async function testFeedbackSystem() {
  log('피드백 시스템 테스트', 'info');
  
  if (!global.authToken || !global.projectId) {
    addResult('Feedback System', '피드백 시스템', false, '필수 정보 없음');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${global.authToken}`,
    'Content-Type': 'application/json'
  };
  
  // 피드백 작성
  try {
    const feedbackData = {
      project_id: global.projectId,
      content: '테스트 피드백 내용',
      feedback_type: 'text'
    };
    
    const feedbackResponse = await axios.post(`${API_BASE_URL}/feedbacks/`, feedbackData, { headers });
    addResult('Feedback System', '피드백 작성', true, '피드백 생성 성공');
  } catch (error) {
    addResult('Feedback System', '피드백 작성', false, error.response?.data?.message || error.message);
  }
  
  // 피드백 조회
  try {
    const feedbackList = await axios.get(`${API_BASE_URL}/feedbacks/?project_id=${global.projectId}`, { headers });
    addResult('Feedback System', '피드백 조회', true, `${feedbackList.data.length}개 피드백`);
  } catch (error) {
    addResult('Feedback System', '피드백 조회', false, error.response?.data?.message || error.message);
  }
}

async function testUIAccess() {
  log('UI 페이지 접근성 테스트', 'info');
  
  const pages = [
    { path: '/', name: '홈페이지' },
    { path: '/login', name: '로그인 페이지' },
    { path: '/signup', name: '회원가입 페이지' },
    { path: '/cms', name: 'CMS 대시보드' },
    { path: '/cms/project-create', name: '프로젝트 생성 페이지' },
    { path: '/mypage', name: '마이페이지' }
  ];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${page.path}`);
      addResult('UI Access', page.name, true, 'HTTP 200');
    } catch (error) {
      addResult('UI Access', page.name, false, error.message);
    }
  }
}

async function testErrorHandling() {
  log('에러 처리 테스트', 'info');
  
  // 잘못된 로그인 시도
  try {
    await axios.post(`${API_BASE_URL}/users/login/`, {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    });
    addResult('Error Handling', '잘못된 로그인 처리', false, '에러가 발생하지 않음');
  } catch (error) {
    if (error.response && error.response.status >= 400) {
      addResult('Error Handling', '잘못된 로그인 처리', true, '적절한 에러 반환');
    } else {
      addResult('Error Handling', '잘못된 로그인 처리', false, '예상치 못한 에러');
    }
  }
  
  // 권한 없는 접근
  try {
    await axios.get(`${API_BASE_URL}/projects/`);
    addResult('Error Handling', '인증 없는 접근 차단', false, '보안 취약');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      addResult('Error Handling', '인증 없는 접근 차단', true, '401 Unauthorized');
    } else {
      addResult('Error Handling', '인증 없는 접근 차단', false, '예상치 못한 응답');
    }
  }
}

// 메인 테스트 실행
async function runMECETest() {
  console.log('🔍 VideoPlanet MECE 테스트 시작');
  console.log('================================\n');
  
  try {
    // 1. 인프라 테스트
    await testServerHealth();
    console.log('');
    
    // 2. 인증 테스트
    await testAuthentication();
    console.log('');
    
    // 3. 프로젝트 관리 테스트
    await testProjectManagement();
    console.log('');
    
    // 4. 피드백 시스템 테스트
    await testFeedbackSystem();
    console.log('');
    
    // 5. UI 접근성 테스트
    await testUIAccess();
    console.log('');
    
    // 6. 에러 처리 테스트
    await testErrorHandling();
    console.log('');
    
  } catch (error) {
    log(`테스트 중 예상치 못한 오류: ${error.message}`, 'error');
  }
  
  // 결과 요약
  console.log('\n================================');
  console.log('📊 MECE 테스트 결과 요약');
  console.log('================================');
  console.log(`✅ 성공: ${testResults.passed}개`);
  console.log(`❌ 실패: ${testResults.failed}개`);
  console.log(`📈 성공률: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  // 상세 결과
  console.log('\n📋 상세 테스트 결과:');
  const categories = {};
  testResults.details.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  Object.keys(categories).forEach(category => {
    console.log(`\n[${category}]`);
    categories[category].forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.test}: ${result.details}`);
    });
  });
  
  // 최종 판정
  console.log('\n================================');
  if (testResults.failed === 0) {
    console.log('🎉 모든 테스트 통과! 시스템이 완벽하게 작동합니다.');
  } else if (testResults.passed / (testResults.passed + testResults.failed) >= 0.8) {
    console.log('✅ 대부분의 기능이 정상 작동합니다. 일부 개선이 필요합니다.');
  } else if (testResults.passed / (testResults.passed + testResults.failed) >= 0.5) {
    console.log('⚠️ 주요 기능에 문제가 있습니다. 점검이 필요합니다.');
  } else {
    console.log('❌ 심각한 문제가 발견되었습니다. 즉시 조치가 필요합니다.');
  }
  console.log('================================\n');
}

// 테스트 실행
runMECETest();