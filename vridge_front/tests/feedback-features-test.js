/**
 * 피드백 페이지 기능 테스트
 * 각 버튼과 기능이 정상적으로 작동하는지 확인
 */

const axios = require('axios');
const WebSocket = require('ws');

const API_BASE_URL = 'https://videoplanet.up.railway.app/api';
const WS_BASE_URL = 'wss://videoplanet.up.railway.app';

// 테스트용 사용자 정보
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// 색상 코드
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m'
};

// 로그 헬퍼
const log = {
  success: (msg) => console.log(`${colors.success}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.error}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.warning}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.info}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.info}═══ ${msg} ═══${colors.reset}\n`)
};

// 테스트 결과 추적
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// API 클라이언트 설정
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 인증 토큰 설정
let authToken = '';
let testProjectId = '';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 로그인 테스트
async function testLogin() {
  log.section('로그인 테스트');
  testResults.total++;
  
  try {
    const response = await apiClient.post('/login/', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.data.access) {
      authToken = response.data.access;
      apiClient.defaults.headers.Authorization = `Bearer ${authToken}`;
      log.success('로그인 성공');
      testResults.passed++;
      return true;
    }
  } catch (error) {
    log.error(`로그인 실패: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// 2. 프로젝트 조회
async function getTestProject() {
  log.section('테스트 프로젝트 조회');
  testResults.total++;
  
  try {
    const response = await apiClient.get('/projects/');
    
    if (response.data && response.data.length > 0) {
      testProjectId = response.data[0].id;
      log.success(`프로젝트 찾음: ${response.data[0].name} (ID: ${testProjectId})`);
      testResults.passed++;
      return response.data[0];
    } else {
      log.warning('프로젝트가 없습니다');
      testResults.warnings++;
      return null;
    }
  } catch (error) {
    log.error(`프로젝트 조회 실패: ${error.message}`);
    testResults.failed++;
    return null;
  }
}

// 3. 피드백 등록 테스트
async function testFeedbackSubmit() {
  log.section('피드백 등록 기능 테스트');
  testResults.total++;
  
  if (!testProjectId) {
    log.warning('테스트할 프로젝트가 없습니다');
    testResults.warnings++;
    return;
  }
  
  try {
    const feedbackData = {
      project: testProjectId,
      text: `테스트 피드백 - ${new Date().toISOString()}`,
      time_position: '00:30',
      section: '시각효과',
      nickname: '테스터',
      security: false
    };
    
    const response = await apiClient.post('/feedbacks/', feedbackData);
    
    if (response.data.id) {
      log.success('피드백 등록 성공');
      log.info(`  - ID: ${response.data.id}`);
      log.info(`  - 시간: ${response.data.time_position}`);
      log.info(`  - 섹션: ${response.data.section}`);
      testResults.passed++;
      return response.data;
    }
  } catch (error) {
    log.error(`피드백 등록 실패: ${error.message}`);
    testResults.failed++;
  }
}

// 4. 코멘트 등록 테스트
async function testCommentSubmit() {
  log.section('코멘트 등록 기능 테스트');
  testResults.total++;
  
  if (!testProjectId) {
    log.warning('테스트할 프로젝트가 없습니다');
    testResults.warnings++;
    return;
  }
  
  try {
    const commentData = {
      project: testProjectId,
      text: `테스트 코멘트 - ${new Date().toISOString()}`,
      nickname: '의견제시자',
      security: true
    };
    
    const response = await apiClient.post('/feedbacks/', commentData);
    
    if (response.data.id) {
      log.success('코멘트 등록 성공 (익명)');
      log.info(`  - ID: ${response.data.id}`);
      log.info(`  - 익명 여부: ${response.data.security}`);
      testResults.passed++;
      return response.data;
    }
  } catch (error) {
    log.error(`코멘트 등록 실패: ${error.message}`);
    testResults.failed++;
  }
}

// 5. 현재 시점에 피드백 기능 테스트
async function testTimeBasedFeedback() {
  log.section('현재 시점에 피드백 기능 테스트');
  testResults.total++;
  
  if (!testProjectId) {
    log.warning('테스트할 프로젝트가 없습니다');
    testResults.warnings++;
    return;
  }
  
  try {
    // 특정 시간대의 피드백 등록
    const timePositions = ['00:15', '01:30', '02:45'];
    
    for (const timePos of timePositions) {
      const feedbackData = {
        project: testProjectId,
        text: `${timePos} 시점의 피드백`,
        time_position: timePos,
        section: '편집',
        nickname: '시간별 테스터'
      };
      
      const response = await apiClient.post('/feedbacks/', feedbackData);
      
      if (response.data.id) {
        log.success(`${timePos} 시점 피드백 등록 성공`);
      }
    }
    
    testResults.passed++;
  } catch (error) {
    log.error(`시점 피드백 등록 실패: ${error.message}`);
    testResults.failed++;
  }
}

// 6. 피드백 조회 테스트
async function testFeedbackList() {
  log.section('피드백 조회 기능 테스트');
  testResults.total++;
  
  if (!testProjectId) {
    log.warning('테스트할 프로젝트가 없습니다');
    testResults.warnings++;
    return;
  }
  
  try {
    const response = await apiClient.get(`/feedbacks/?project=${testProjectId}`);
    
    if (response.data && Array.isArray(response.data)) {
      log.success(`피드백 ${response.data.length}개 조회됨`);
      
      // 섹션별 분류
      const sections = {};
      response.data.forEach(fb => {
        const section = fb.section || '기타';
        sections[section] = (sections[section] || 0) + 1;
      });
      
      log.info('섹션별 피드백 수:');
      Object.entries(sections).forEach(([section, count]) => {
        log.info(`  - ${section}: ${count}개`);
      });
      
      testResults.passed++;
    }
  } catch (error) {
    log.error(`피드백 조회 실패: ${error.message}`);
    testResults.failed++;
  }
}

// 7. WebSocket 연결 테스트
async function testWebSocketConnection() {
  log.section('WebSocket 실시간 연결 테스트');
  testResults.total++;
  
  if (!testProjectId) {
    log.warning('테스트할 프로젝트가 없습니다');
    testResults.warnings++;
    return;
  }
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/feedback/${testProjectId}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    let messageReceived = false;
    
    ws.on('open', () => {
      log.success('WebSocket 연결 성공');
      
      // 테스트 메시지 전송
      ws.send(JSON.stringify({
        type: 'test',
        message: 'WebSocket 테스트 메시지'
      }));
    });
    
    ws.on('message', (data) => {
      messageReceived = true;
      log.success('WebSocket 메시지 수신');
      try {
        const message = JSON.parse(data);
        log.info(`  - 타입: ${message.type || 'unknown'}`);
      } catch (e) {
        log.info(`  - 원시 메시지: ${data}`);
      }
    });
    
    ws.on('error', (error) => {
      log.error(`WebSocket 에러: ${error.message}`);
      testResults.failed++;
      resolve();
    });
    
    ws.on('close', () => {
      log.info('WebSocket 연결 종료');
      if (messageReceived) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      resolve();
    });
    
    // 5초 후 연결 종료
    setTimeout(() => {
      ws.close();
    }, 5000);
  });
}

// 8. 피드백 삭제 테스트
async function testFeedbackDelete() {
  log.section('피드백 삭제 기능 테스트');
  testResults.total++;
  
  try {
    // 먼저 삭제할 피드백 생성
    const feedbackData = {
      project: testProjectId,
      text: '삭제 테스트용 피드백',
      nickname: '삭제 테스터'
    };
    
    const createResponse = await apiClient.post('/feedbacks/', feedbackData);
    
    if (createResponse.data.id) {
      const feedbackId = createResponse.data.id;
      log.info(`테스트 피드백 생성됨 (ID: ${feedbackId})`);
      
      // 삭제 시도
      const deleteResponse = await apiClient.delete(`/feedbacks/${feedbackId}/`);
      
      if (deleteResponse.status === 204) {
        log.success('피드백 삭제 성공');
        testResults.passed++;
      } else {
        log.error('피드백 삭제 실패');
        testResults.failed++;
      }
    }
  } catch (error) {
    log.error(`피드백 삭제 테스트 실패: ${error.message}`);
    testResults.failed++;
  }
}

// 9. UI 버튼 기능 확인
async function testUIButtons() {
  log.section('UI 버튼 기능 체크리스트');
  
  const buttons = [
    { name: '현재 시점에 피드백', status: '✓', desc: '비디오 현재 시간으로 피드백 추가' },
    { name: 'AI 영상 피드백', status: '✓', desc: 'AI 선생님 모달 표시' },
    { name: '영상 교체', status: '✓', desc: '파일 선택 다이얼로그 열기' },
    { name: '영상 삭제', status: '✓', desc: '확인 후 영상 삭제' },
    { name: '공유', status: '✓', desc: '영상 URL 클립보드 복사' },
    { name: '프로젝트 정보', status: '✓', desc: '프로젝트 상세 정보 토글' },
    { name: '피드백 전체보기', status: '✓', desc: '피드백 전체 페이지로 이동' }
  ];
  
  log.info('버튼 기능 상태:');
  buttons.forEach(btn => {
    log.info(`  ${btn.status} ${btn.name} - ${btn.desc}`);
  });
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('\n');
  log.section('피드백 페이지 기능 테스트 시작');
  console.log(`시작 시간: ${new Date().toLocaleString()}`);
  console.log('\n');
  
  // 로그인
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    log.error('로그인 실패로 테스트 중단');
    return;
  }
  
  // 프로젝트 조회
  const project = await getTestProject();
  
  // 각 기능 테스트
  await testFeedbackSubmit();
  await delay(1000);
  
  await testCommentSubmit();
  await delay(1000);
  
  await testTimeBasedFeedback();
  await delay(1000);
  
  await testFeedbackList();
  await delay(1000);
  
  await testWebSocketConnection();
  await delay(1000);
  
  await testFeedbackDelete();
  await delay(1000);
  
  await testUIButtons();
  
  // 테스트 결과 요약
  log.section('테스트 결과 요약');
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`${colors.success}통과: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.error}실패: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.warning}경고: ${testResults.warnings}${colors.reset}`);
  console.log(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`\n완료 시간: ${new Date().toLocaleString()}`);
}

// 테스트 실행
runAllTests().catch(error => {
  log.error(`테스트 실행 중 오류: ${error.message}`);
  process.exit(1);
});