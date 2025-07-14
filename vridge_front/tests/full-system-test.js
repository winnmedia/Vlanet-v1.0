const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'https://vlanet.net';

// axios 기본 헤더 설정
axios.defaults.headers.common['Origin'] = FRONTEND_URL;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// 테스트 데이터
const testUser = {
  email: `test${Date.now()}@example.com`,
  nickname: `testuser${Date.now()}`,
  password: 'TestPassword123!'
};

let authToken = null;

// 헬퍼 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer(maxAttempts = 30) {
  console.log(`${colors.cyan}서버 시작 대기중...${colors.reset}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health/`);
      if (response.data.status === 'ok') {
        console.log(`${colors.green}✓ 서버가 시작되었습니다!${colors.reset}\n`);
        return true;
      }
    } catch (error) {
      process.stdout.write('.');
      await delay(2000);
    }
  }
  
  console.log(`\n${colors.red}✗ 서버 시작 시간 초과${colors.reset}`);
  return false;
}

// 1. 서버 상태 확인
async function testServerStatus() {
  console.log(`${colors.blue}=== 1. 서버 상태 확인 ===${colors.reset}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health/`);
    console.log(`✓ 서버 상태: ${colors.green}정상${colors.reset}`);
    console.log(`  - 메시지: ${response.data.message}`);
    console.log(`  - CORS: ${response.data.cors ? '활성화' : '비활성화'}`);
    return true;
  } catch (error) {
    console.log(`✗ 서버 상태: ${colors.red}오류${colors.reset}`);
    return false;
  }
}

// 2. 회원가입 테스트
async function testSignup() {
  console.log(`\n${colors.blue}=== 2. 회원가입 테스트 ===${colors.reset}`);
  
  try {
    // 이메일 중복 확인
    const emailCheck = await axios.post(`${API_BASE_URL}/api/users/check-email/`, {
      email: testUser.email
    });
    console.log(`✓ 이메일 중복 확인: ${colors.green}사용 가능${colors.reset}`);
    
    // 닉네임 중복 확인
    const nicknameCheck = await axios.post(`${API_BASE_URL}/api/users/check-nickname/`, {
      nickname: testUser.nickname
    });
    console.log(`✓ 닉네임 중복 확인: ${colors.green}사용 가능${colors.reset}`);
    
    // 회원가입
    const signup = await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    console.log(`✓ 회원가입: ${colors.green}성공${colors.reset}`);
    
    if (signup.data.vridge_session) {
      authToken = signup.data.vridge_session;
      console.log(`✓ 토큰 발급: ${colors.green}완료${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`✗ 회원가입 실패: ${colors.red}${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

// 3. 로그인 테스트
async function testLogin() {
  console.log(`\n${colors.blue}=== 3. 로그인 테스트 ===${colors.reset}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log(`✓ 로그인: ${colors.green}성공${colors.reset}`);
    
    if (response.data.vridge_session) {
      authToken = response.data.vridge_session;
      console.log(`✓ 토큰 갱신: ${colors.green}완료${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`✗ 로그인 실패: ${colors.red}${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

// 4. 영상 기획 테스트
async function testVideoPlanning() {
  console.log(`\n${colors.blue}=== 4. 영상 기획 기능 테스트 ===${colors.reset}`);
  
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  
  try {
    // 기획 라이브러리 조회
    const library = await axios.get(`${API_BASE_URL}/api/video-planning/library/`, { headers });
    console.log(`✓ 기획 라이브러리 조회: ${colors.green}성공${colors.reset} (${library.data.data.plannings.length}개)`);
    
    // 스토리 생성 테스트
    const storyResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: '신제품 런칭 프로모션 영상을 만들고 싶습니다.' },
      { headers }
    );
    console.log(`✓ 스토리 생성: ${colors.green}성공${colors.reset}`);
    
    return true;
  } catch (error) {
    console.log(`✗ 영상 기획 테스트 실패: ${colors.red}${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

// 5. 프로젝트 관리 테스트
async function testProjects() {
  console.log(`\n${colors.blue}=== 5. 프로젝트 관리 테스트 ===${colors.reset}`);
  
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  
  try {
    // 프로젝트 목록 조회
    const projects = await axios.get(`${API_BASE_URL}/api/projects/`, { headers });
    console.log(`✓ 프로젝트 목록 조회: ${colors.green}성공${colors.reset} (${projects.data.length || 0}개)`);
    
    // 프로젝트 생성 테스트 - FormData 형식으로 create_safe 엔드포인트 사용
    const FormData = require('form-data');
    const formData = new FormData();
    
    const inputs = {
      name: `테스트 프로젝트 ${Date.now()}`,
      manager: '테스트 매니저',
      consumer: '테스트 고객사',
      description: '테스트 프로젝트입니다',
      color: '#1631F8'
    };
    
    const process = [
      { key: 'basic_plan', startDate: '2025-01-07', endDate: '2025-01-08' },
      { key: 'story_board', startDate: '2025-01-09', endDate: '2025-01-10' }
    ];
    
    formData.append('inputs', JSON.stringify(inputs));
    formData.append('process', JSON.stringify(process));
    
    const createProject = await axios.post(
      `${API_BASE_URL}/api/projects/create_safe`,
      formData,
      { 
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      }
    );
    console.log(`✓ 프로젝트 생성: ${colors.green}성공${colors.reset}`);
    
    return true;
  } catch (error) {
    console.log(`✗ 프로젝트 관리 테스트 실패: ${colors.red}${error.response?.data?.message || error.message}${colors.reset}`);
    if (error.response?.data) {
      console.log(`  에러 상세: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 메인 테스트 실행
async function runFullSystemTest() {
  console.log(`${colors.cyan}=== VideoPlanet 전체 시스템 테스트 ===${colors.reset}`);
  console.log(`백엔드: ${API_BASE_URL}`);
  console.log(`프론트엔드: ${FRONTEND_URL}\n`);
  
  // 서버 시작 대기
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log(`\n${colors.red}서버가 시작되지 않았습니다. Railway 로그를 확인하세요.${colors.reset}`);
    return;
  }
  
  const results = [];
  
  // 각 테스트 실행
  results.push({ name: '서버 상태', passed: await testServerStatus() });
  results.push({ name: '회원가입', passed: await testSignup() });
  results.push({ name: '로그인', passed: await testLogin() });
  results.push({ name: '영상 기획', passed: await testVideoPlanning() });
  results.push({ name: '프로젝트 관리', passed: await testProjects() });
  
  // 결과 요약
  console.log(`\n${colors.cyan}=== 테스트 결과 요약 ===${colors.reset}`);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(result => {
    const status = result.passed ? `${colors.green}✓ 성공${colors.reset}` : `${colors.red}✗ 실패${colors.reset}`;
    console.log(`${result.name}: ${status}`);
  });
  
  console.log(`\n전체 성공률: ${percentage === 100 ? colors.green : percentage >= 80 ? colors.yellow : colors.red}${percentage}% (${passed}/${total})${colors.reset}`);
  
  if (percentage === 100) {
    console.log(`\n${colors.green}🎉 축하합니다! 모든 테스트를 통과했습니다!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  일부 테스트가 실패했습니다. 위의 오류 메시지를 확인하세요.${colors.reset}`);
  }
}


// 실행
runFullSystemTest().catch(error => {
  console.error(`${colors.red}테스트 실행 중 오류:${colors.reset}`, error.message);
});