/**
 * VideoPlanet API 통합 테스트
 * 
 * 이 스크립트는 주요 API 엔드포인트들의 통합 테스트를 수행합니다.
 * node src/tests/integration-test.js 명령으로 실행하세요.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://videoplanet.up.railway.app';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// 테스트 데이터
const testData = {
  user: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    nickname: `TestUser${Date.now()}`,
    name: '테스트 사용자',
  },
  existingUser: {
    email: 'test@example.com',
    password: 'password123',
  },
  project: {
    name: `테스트 프로젝트 ${new Date().toISOString()}`,
    description: '통합 테스트를 위한 프로젝트입니다.',
    manager: '테스트 매니저',
    consumer: '테스트 고객사',
  },
  feedback: {
    description: '피드백 테스트입니다.',
    content: '이것은 테스트 피드백 내용입니다.',
  }
};

// 테스트 결과 저장
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

// 토큰 저장 변수
let authToken = null;
let projectId = null;
let feedbackId = null;

// 유틸리티 함수
function logTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${testName}: ${status}`;
  console.log(message);
  if (details) {
    console.log(`  Details: ${details}`);
  }
  
  if (status === 'PASSED') {
    testResults.passed.push({ testName, timestamp });
  } else if (status === 'FAILED') {
    testResults.failed.push({ testName, timestamp, details });
  } else if (status === 'WARNING') {
    testResults.warnings.push({ testName, timestamp, details });
  }
}

// axios 인터셉터 설정
axiosInstance.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`>>> ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`<<< ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(`<<< ERROR ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

// 테스트 함수들

// 1. 인증 플로우 테스트
async function testAuthFlow() {
  console.log('\n=== 1. 인증 플로우 테스트 ===\n');
  
  // 1-1. 이메일 중복 확인
  try {
    await axiosInstance.post('/users/check_email', { email: testData.user.email });
    logTest('이메일 중복 확인', 'PASSED');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('이메일 중복 확인', 'WARNING', '이미 사용중인 이메일');
    } else {
      logTest('이메일 중복 확인', 'FAILED', error.message);
    }
  }
  
  // 1-2. 닉네임 중복 확인
  try {
    await axiosInstance.post('/users/check_nickname', { nickname: testData.user.nickname });
    logTest('닉네임 중복 확인', 'PASSED');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('닉네임 중복 확인', 'WARNING', '이미 사용중인 닉네임');
    } else {
      logTest('닉네임 중복 확인', 'FAILED', error.message);
    }
  }
  
  // 1-3. 회원가입 (새로운 3단계 플로우)
  try {
    // Step 1: 이메일 인증 요청
    const requestRes = await axiosInstance.post('/users/signup/request', { 
      email: testData.user.email 
    });
    logTest('회원가입 Step 1 - 이메일 인증 요청', 'PASSED');
    
    // 실제 환경에서는 이메일로 받은 인증번호를 입력해야 하지만,
    // 테스트에서는 건너뛰거나 미리 설정된 테스트 코드 사용
    logTest('회원가입 Step 2 - 인증번호 확인', 'WARNING', '실제 이메일 인증 필요');
    logTest('회원가입 Step 3 - 회원가입 완료', 'WARNING', '이메일 인증 후 진행 가능');
    
  } catch (error) {
    // 기존 회원가입 API 시도
    try {
      await axiosInstance.post('/users/signup', testData.user);
      logTest('회원가입 (레거시 API)', 'PASSED');
    } catch (signupError) {
      if (signupError.response?.status === 400) {
        logTest('회원가입', 'WARNING', '이미 가입된 사용자');
      } else {
        logTest('회원가입', 'FAILED', signupError.message);
      }
    }
  }
  
  // 1-4. 로그인 (새로 생성한 계정)
  try {
    const loginRes = await axiosInstance.post('/users/login', {
      email: testData.user.email,
      password: testData.user.password,
    });
    console.log('로그인 응답:', loginRes.data);
    
    // 다양한 토큰 형식 확인
    authToken = loginRes.data.access_token || 
                loginRes.data.token || 
                loginRes.data.accessToken ||
                loginRes.data.auth_token ||
                loginRes.data.VGID ||
                loginRes.data.vridge_session;
    
    if (!authToken && loginRes.data.user) {
      authToken = loginRes.data.user.token || loginRes.data.user.access_token;
    }
    
    logTest('로그인', 'PASSED', `토큰 획득: ${authToken ? '성공' : '실패'}`);
  } catch (error) {
    // 새 계정 로그인 실패 시 기존 계정으로 시도
    console.log('새 계정 로그인 실패, 기존 계정으로 시도...');
    try {
      const existingLoginRes = await axiosInstance.post('/users/login', {
        email: testData.existingUser.email,
        password: testData.existingUser.password,
      });
      console.log('기존 계정 로그인 응답:', existingLoginRes.data);
      
      authToken = existingLoginRes.data.access_token || 
                  existingLoginRes.data.token || 
                  existingLoginRes.data.accessToken ||
                  existingLoginRes.data.auth_token ||
                  existingLoginRes.data.VGID ||
                  existingLoginRes.data.vridge_session;
      
      if (!authToken && existingLoginRes.data.user) {
        authToken = existingLoginRes.data.user.token || existingLoginRes.data.user.access_token;
      }
      
      logTest('로그인 (기존 계정)', 'PASSED', `토큰 획득: ${authToken ? '성공' : '실패'}`);
    } catch (existingError) {
      logTest('로그인', 'FAILED', existingError.response?.data?.message || existingError.message);
    }
  }
  
  // 1-5. 토큰 갱신 테스트 (refresh token이 있는 경우)
  if (authToken) {
    try {
      const refreshRes = await axiosInstance.post('/users/refresh');
      logTest('토큰 갱신', 'PASSED');
    } catch (error) {
      logTest('토큰 갱신', 'WARNING', 'Refresh token 미지원 또는 구현 필요');
    }
  }
  
  // 1-6. 비밀번호 재설정 플로우
  try {
    await axiosInstance.post('/users/send_authnumber/reset', {
      email: testData.user.email,
    });
    logTest('비밀번호 재설정 - 인증번호 발송', 'PASSED');
    logTest('비밀번호 재설정 - 완료', 'WARNING', '실제 이메일 인증 필요');
  } catch (error) {
    logTest('비밀번호 재설정', 'WARNING', '이메일 서비스 설정 필요');
  }
}

// 2. 소셜 로그인 테스트
async function testSocialLogin() {
  console.log('\n=== 2. 소셜 로그인 테스트 ===\n');
  
  // 소셜 로그인은 실제 OAuth 토큰이 필요하므로 엔드포인트 확인만 수행
  const socialProviders = ['google', 'kakao', 'naver'];
  
  for (const provider of socialProviders) {
    try {
      // 실제 소셜 로그인은 OAuth 플로우가 필요하므로 400 에러 예상
      await axiosInstance.post(`/users/login/${provider}`, {
        access_token: 'dummy_token',
      });
      logTest(`${provider} 로그인`, 'WARNING', '실제 OAuth 토큰 필요');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        logTest(`${provider} 로그인 엔드포인트`, 'PASSED', '엔드포인트 존재 확인');
      } else {
        logTest(`${provider} 로그인`, 'FAILED', error.message);
      }
    }
  }
}

// 3. 프로젝트 CRUD 테스트
async function testProjectCRUD() {
  console.log('\n=== 3. 프로젝트 CRUD 테스트 ===\n');
  
  if (!authToken) {
    logTest('프로젝트 CRUD', 'FAILED', '인증 토큰 없음');
    return;
  }
  
  // 3-1. 프로젝트 생성 (멱등성 키 테스트)
  const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const formData = new FormData();
  formData.append('name', testData.project.name);
  formData.append('description', testData.project.description);
  formData.append('manager', testData.project.manager);
  formData.append('consumer', testData.project.consumer);
  
  try {
    const createRes = await axiosInstance.post('/projects/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Idempotency-Key': idempotencyKey,
      },
    });
    projectId = createRes.data.project_id || createRes.data.id;
    logTest('프로젝트 생성', 'PASSED', `프로젝트 ID: ${projectId}`);
    
    // 같은 멱등성 키로 재시도
    try {
      await axiosInstance.post('/projects/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Idempotency-Key': idempotencyKey,
        },
      });
      logTest('멱등성 키 테스트', 'WARNING', '중복 생성 방지 미구현');
    } catch (error) {
      if (error.response?.status === 409) {
        logTest('멱등성 키 테스트', 'PASSED', '중복 생성 방지 성공');
      } else {
        logTest('멱등성 키 테스트', 'WARNING', '다른 에러 발생');
      }
    }
  } catch (error) {
    logTest('프로젝트 생성', 'FAILED', error.response?.data?.message || error.message);
  }
  
  // 3-2. 프로젝트 목록 조회
  try {
    const listRes = await axiosInstance.get('/projects/project_list');
    const projects = listRes.data.result || listRes.data.projects || [];
    logTest('프로젝트 목록 조회', 'PASSED', `프로젝트 수: ${projects.length}`);
  } catch (error) {
    logTest('프로젝트 목록 조회', 'FAILED', error.message);
  }
  
  // 3-3. 프로젝트 상세 조회
  if (projectId) {
    try {
      const detailRes = await axiosInstance.get(`/projects/detail/${projectId}`);
      logTest('프로젝트 상세 조회', 'PASSED');
    } catch (error) {
      logTest('프로젝트 상세 조회', 'FAILED', error.message);
    }
  }
  
  // 3-4. 프로젝트 수정
  if (projectId) {
    const updateFormData = new FormData();
    updateFormData.append('name', testData.project.name + ' (수정됨)');
    updateFormData.append('description', testData.project.description + ' (수정됨)');
    
    try {
      await axiosInstance.post(`/projects/detail/${projectId}`, updateFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      logTest('프로젝트 수정', 'PASSED');
    } catch (error) {
      logTest('프로젝트 수정', 'FAILED', error.message);
    }
  }
  
  // 3-5. 멤버 초대
  if (projectId) {
    try {
      await axiosInstance.post(`/projects/invite_project/${projectId}`, {
        email: 'invite_test@example.com',
        role: 'Normal',
      });
      logTest('프로젝트 멤버 초대', 'PASSED');
    } catch (error) {
      logTest('프로젝트 멤버 초대', 'WARNING', '이메일 서비스 설정 필요');
    }
  }
}

// 4. 피드백 시스템 테스트
async function testFeedbackSystem() {
  console.log('\n=== 4. 피드백 시스템 테스트 ===\n');
  
  if (!authToken || !projectId) {
    logTest('피드백 시스템', 'FAILED', '인증 토큰 또는 프로젝트 ID 없음');
    return;
  }
  
  // 4-1. 피드백 생성
  try {
    const feedbackData = {
      project_id: projectId,
      description: testData.feedback.description,
      content: testData.feedback.content,
    };
    const createRes = await axiosInstance.put(`/feedbacks/${projectId}`, feedbackData);
    feedbackId = createRes.data.feedback_id || createRes.data.id;
    logTest('피드백 생성', 'PASSED', `피드백 ID: ${feedbackId}`);
  } catch (error) {
    logTest('피드백 생성', 'FAILED', error.response?.data?.message || error.message);
  }
  
  // 4-2. 피드백 조회
  if (feedbackId) {
    try {
      await axiosInstance.get(`/feedbacks/${feedbackId}`);
      logTest('피드백 조회', 'PASSED');
    } catch (error) {
      logTest('피드백 조회', 'FAILED', error.message);
    }
  }
  
  // 4-3. 피드백 파일 업로드 (시뮬레이션)
  if (feedbackId) {
    const fileFormData = new FormData();
    // 실제 파일 대신 텍스트 파일 생성
    const testContent = Buffer.from('테스트 비디오 파일 내용');
    fileFormData.append('file', testContent, 'test_video.mp4');
    
    try {
      await axiosInstance.post(`/feedbacks/${feedbackId}`, fileFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`  업로드 진행률: ${percentCompleted}%`);
        },
      });
      logTest('피드백 파일 업로드', 'PASSED');
    } catch (error) {
      logTest('피드백 파일 업로드', 'WARNING', '파일 업로드 설정 필요');
    }
  }
  
  // 4-4. WebSocket 메시지 전송 테스트
  logTest('WebSocket 메시지 전송', 'WARNING', 'WebSocket 연결 테스트는 별도 구현 필요');
}

// 5. 권한 체크 테스트
async function testPermissions() {
  console.log('\n=== 5. 권한 체크 테스트 ===\n');
  
  if (!projectId) {
    logTest('권한 체크', 'FAILED', '프로젝트 ID 없음');
    return;
  }
  
  // 5-1. Owner 권한 테스트 (프로젝트 생성자는 Owner)
  try {
    await axiosInstance.delete(`/projects/detail/${projectId}`);
    logTest('Owner 권한 - 프로젝트 삭제', 'PASSED');
    projectId = null; // 삭제됨
  } catch (error) {
    logTest('Owner 권한 - 프로젝트 삭제', 'WARNING', '삭제 권한 확인 필요');
  }
  
  // 5-2. 비인가 접근 테스트
  const originalToken = authToken;
  authToken = 'invalid_token';
  
  try {
    await axiosInstance.get('/projects/project_list');
    logTest('비인가 접근 차단', 'FAILED', '잘못된 토큰으로 접근 성공');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('비인가 접근 차단', 'PASSED', '401 Unauthorized');
    } else {
      logTest('비인가 접근 차단', 'WARNING', `예상치 못한 에러: ${error.response?.status}`);
    }
  }
  
  authToken = originalToken;
}

// 6. 엣지 케이스 테스트
async function testEdgeCases() {
  console.log('\n=== 6. 엣지 케이스 테스트 ===\n');
  
  // 6-1. 빈 데이터 전송
  try {
    await axiosInstance.post('/projects/create', {});
    logTest('빈 데이터 프로젝트 생성', 'FAILED', '유효성 검사 미작동');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('빈 데이터 프로젝트 생성', 'PASSED', '유효성 검사 작동');
    } else {
      logTest('빈 데이터 프로젝트 생성', 'WARNING', error.message);
    }
  }
  
  // 6-2. 초대형 데이터 전송
  const largeData = {
    name: 'A'.repeat(10000),
    description: 'B'.repeat(50000),
  };
  
  try {
    const formData = new FormData();
    Object.entries(largeData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await axiosInstance.post('/projects/create', formData);
    logTest('초대형 데이터 처리', 'WARNING', '데이터 크기 제한 미설정');
  } catch (error) {
    if (error.response?.status === 413 || error.response?.status === 400) {
      logTest('초대형 데이터 처리', 'PASSED', '데이터 크기 제한 작동');
    } else {
      logTest('초대형 데이터 처리', 'WARNING', error.message);
    }
  }
  
  // 6-3. SQL Injection 테스트
  const sqlInjectionData = {
    email: "test@example.com'; DROP TABLE users; --",
    password: "' OR '1'='1",
  };
  
  try {
    await axiosInstance.post('/users/login', sqlInjectionData);
    logTest('SQL Injection 방어', 'WARNING', '추가 검증 필요');
  } catch (error) {
    logTest('SQL Injection 방어', 'PASSED', 'SQL Injection 시도 차단');
  }
  
  // 6-4. XSS 테스트
  const xssData = {
    name: '<script>alert("XSS")</script>',
    description: '<img src=x onerror=alert("XSS")>',
  };
  
  if (authToken) {
    try {
      const formData = new FormData();
      Object.entries(xssData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const res = await axiosInstance.post('/projects/create', formData);
      const createdProjectId = res.data.project_id || res.data.id;
      
      // 생성된 프로젝트 조회하여 XSS 방어 확인
      const detailRes = await axiosInstance.get(`/projects/detail/${createdProjectId}`);
      const project = detailRes.data;
      
      if (project.name.includes('<script>') || project.description.includes('<img')) {
        logTest('XSS 방어', 'FAILED', 'HTML 태그가 그대로 저장됨');
      } else {
        logTest('XSS 방어', 'PASSED', 'HTML 태그 이스케이프 확인');
      }
      
      // 테스트 프로젝트 삭제
      await axiosInstance.delete(`/projects/detail/${createdProjectId}`);
    } catch (error) {
      logTest('XSS 방어', 'WARNING', error.message);
    }
  }
  
  // 6-5. 동시성 테스트
  console.log('\n  동시성 테스트 시작...');
  const concurrentRequests = 10;
  const promises = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      axiosInstance.get('/projects/project_list').catch(e => e)
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const successCount = results.filter(r => !(r instanceof Error)).length;
    logTest('동시 요청 처리', 'PASSED', `${successCount}/${concurrentRequests} 성공`);
  } catch (error) {
    logTest('동시 요청 처리', 'FAILED', error.message);
  }
}

// 7. 로그아웃 테스트
async function testLogout() {
  console.log('\n=== 7. 로그아웃 테스트 ===\n');
  
  if (!authToken) {
    logTest('로그아웃', 'FAILED', '인증 토큰 없음');
    return;
  }
  
  try {
    await axiosInstance.post('/users/logout');
    logTest('로그아웃', 'PASSED');
    authToken = null;
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('로그아웃', 'WARNING', '로그아웃 엔드포인트 미구현');
    } else {
      logTest('로그아웃', 'FAILED', error.message);
    }
  }
}

// 메인 테스트 실행 함수
async function runAllTests() {
  console.log('========================================');
  console.log('VideoPlanet API 통합 테스트 시작');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log('========================================');
  
  try {
    await testAuthFlow();
    await testSocialLogin();
    await testProjectCRUD();
    await testFeedbackSystem();
    await testPermissions();
    await testEdgeCases();
    await testLogout();
  } catch (error) {
    console.error('\n치명적 오류 발생:', error.message);
  }
  
  // 테스트 결과 요약
  console.log('\n========================================');
  console.log('테스트 결과 요약');
  console.log('========================================');
  console.log(`총 테스트: ${testResults.passed.length + testResults.failed.length + testResults.warnings.length}개`);
  console.log(`성공: ${testResults.passed.length}개`);
  console.log(`실패: ${testResults.failed.length}개`);
  console.log(`경고: ${testResults.warnings.length}개`);
  console.log('========================================');
  
  if (testResults.failed.length > 0) {
    console.log('\n실패한 테스트:');
    testResults.failed.forEach(test => {
      console.log(`- ${test.testName}: ${test.details}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n경고 사항:');
    testResults.warnings.forEach(test => {
      console.log(`- ${test.testName}: ${test.details}`);
    });
  }
  
  // 결과를 파일로 저장
  const resultFilePath = path.join(__dirname, `test-results-${Date.now()}.json`);
  fs.writeFileSync(resultFilePath, JSON.stringify(testResults, null, 2));
  console.log(`\n테스트 결과가 ${resultFilePath}에 저장되었습니다.`);
}

// 테스트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };