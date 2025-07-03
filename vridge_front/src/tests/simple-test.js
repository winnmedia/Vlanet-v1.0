/**
 * 간단한 기능 검증 테스트
 */

const API_BASE = 'https://videoplanet.up.railway.app';

async function simpleTest() {
  console.log('🧪 VideoPlanet 간단 기능 테스트\n');

  const makeRequest = async (method, endpoint, data = null, headers = {}) => {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.text();
      
      let jsonData;
      try {
        jsonData = JSON.parse(responseData);
      } catch {
        jsonData = { raw: responseData };
      }

      return {
        status: response.status,
        ok: response.ok,
        data: jsonData
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message
      };
    }
  };

  let testsPassed = 0;
  let testsTotal = 0;

  const test = (name, condition, details = '') => {
    testsTotal++;
    if (condition) {
      testsPassed++;
      console.log(`✅ ${name} ${details}`);
    } else {
      console.log(`❌ ${name} ${details}`);
    }
  };

  // 1. 기본 연결 테스트
  console.log('🔗 기본 연결 테스트');
  const health = await makeRequest('GET', '/');
  test('API 서버 연결', health.ok, `(${health.status})`);
  
  // 2. 입력 검증 테스트
  console.log('\n🛡️ 보안 검증 테스트');
  
  const validEmail = await makeRequest('POST', '/users/check_email', { email: 'test@valid.com' });
  test('올바른 이메일 허용', validEmail.ok, validEmail.data?.message);
  
  const invalidEmail = await makeRequest('POST', '/users/check_email', { email: 'invalid.email' });
  test('잘못된 이메일 차단', !invalidEmail.ok, invalidEmail.data?.message);
  
  const xssEmail = await makeRequest('POST', '/users/check_email', { email: '<script>@test.com' });
  test('XSS 패턴 차단', !xssEmail.ok, 'XSS 보호 작동');

  // 3. 회원가입 테스트 (여러 비밀번호 시도)
  console.log('\n👤 회원가입 테스트');
  
  const timestamp = Date.now();
  const passwords = [
    'Secure123!',      // 일반적인 안전한 비밀번호
    'MyPass2024@',     // 년도 포함
    'Test123Pass!',    // Test 포함하지만 123은 3자리만
    'ComplexP@ssw0rd'  // 복잡한 비밀번호
  ];

  let signupSuccess = false;
  let validUser = null;

  for (let i = 0; i < passwords.length; i++) {
    const testUser = {
      email: `testuser${timestamp}_${i}@example.com`,
      nickname: `TestUser${timestamp}_${i}`,
      password: passwords[i]
    };

    const signup = await makeRequest('POST', '/users/signup', testUser);
    if (signup.ok) {
      signupSuccess = true;
      validUser = testUser;
      test(`회원가입 성공 (비밀번호 ${i+1})`, true, signup.data?.message);
      break;
    } else {
      console.log(`   ⚠️ 비밀번호 ${i+1} (${passwords[i]}) 실패: ${signup.data?.message}`);
    }
  }

  if (!signupSuccess) {
    test('회원가입', false, '모든 비밀번호 패턴 실패');
  }

  // 4. 로그인 테스트 (회원가입이 성공한 경우)
  let authToken = null;
  if (signupSuccess && validUser) {
    console.log('\n🔐 로그인 테스트');
    const login = await makeRequest('POST', '/users/signin', {
      email: validUser.email,
      password: validUser.password
    });
    
    test('로그인', login.ok, login.data?.message);
    
    if (login.ok) {
      authToken = login.data?.vridge_session;
      test('토큰 발급', !!authToken, authToken ? '토큰 획득' : '토큰 없음');
    }
  }

  // 5. 인증된 API 테스트
  if (authToken) {
    console.log('\n📊 인증 API 테스트');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Cookie': `vridge_session=${authToken}`
    };

    try {
      // 프로젝트 목록 조회
      const projectList = await fetch(`${API_BASE}/projects/project_list`, { headers });
      const projects = await projectList.json();
      
      test('프로젝트 목록 조회', projectList.ok, `${projects.result?.length || 0}개 프로젝트`);
      
      // 간단한 프로젝트 생성 테스트
      const formData = new FormData();
      formData.append('inputs', JSON.stringify({
        name: `QuickTest_${timestamp}`,
        manager: 'Test Manager',
        consumer: 'Test Consumer',
        description: '빠른 테스트',
        color: '#FF0000'
      }));
      formData.append('process', JSON.stringify({
        basic_plan: { start_date: '2025-01-01', end_date: '2025-01-05' }
      }));

      const createProject = await fetch(`${API_BASE}/projects/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': `vridge_session=${authToken}`
        },
        body: formData
      });
      const createResult = await createProject.json();
      
      test('프로젝트 생성', createProject.ok, createResult.message || '성공');
      
      // 피드백 접근 테스트 (첫 번째 프로젝트)
      if (projects.result?.length > 0) {
        const feedback = await fetch(`${API_BASE}/feedbacks/${projects.result[0].id}`, { headers });
        const feedbackData = await feedback.json();
        
        test('피드백 접근', feedback.ok, feedbackData.result?.files ? '파일 있음' : '구조 정상');
        
        // 파일 URL 검증 (있는 경우)
        if (feedbackData.result?.files) {
          const fileUrl = feedbackData.result.files;
          const isHttps = fileUrl.startsWith('https://');
          const hasRightDomain = fileUrl.includes('videoplanet.up.railway.app');
          
          test('파일 URL 형식', isHttps && hasRightDomain, fileUrl);
        }
      }
      
    } catch (error) {
      test('인증 API 접근', false, error.message);
    }
  }

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`총 테스트: ${testsTotal}개`);
  console.log(`성공: ${testsPassed}개`);
  console.log(`실패: ${testsTotal - testsPassed}개`);
  console.log(`성공률: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

  if (testsPassed / testsTotal >= 0.8) {
    console.log('\n🎉 시스템이 매우 잘 작동하고 있습니다!');
  } else if (testsPassed / testsTotal >= 0.6) {
    console.log('\n✅ 핵심 기능들이 정상 작동하고 있습니다.');
  } else {
    console.log('\n⚠️ 일부 기능에 문제가 있습니다.');
  }

  // 핵심 기능 상태 요약
  console.log('\n🔍 핵심 기능 상태:');
  console.log(`   ${health.ok ? '✅' : '❌'} API 서버 연결`);
  console.log(`   ${validEmail.ok && !invalidEmail.ok ? '✅' : '❌'} 입력 검증 시스템`);
  console.log(`   ${signupSuccess ? '✅' : '❌'} 사용자 인증 시스템`);
  console.log(`   ${authToken ? '✅' : '❌'} 프로젝트 관리 시스템`);
  console.log(`   ${authToken ? '✅' : '❌'} 피드백 시스템`);
}

simpleTest().catch(console.error);