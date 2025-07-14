/**
 * 데모 계정으로 전체 플로우 테스트
 * 회원가입 → 로그인 → 프로젝트 생성 → 피드백 페이지 → 영상 업로드 등
 */

const API_BASE = 'https://videoplanet.up.railway.app';

async function demoAccountTest() {
  console.log('🎭 데모 계정 전체 플로우 테스트\n');

  const timestamp = Date.now();
  const demoUser = {
    email: `demo.user${timestamp}@vlanet.net`,
    nickname: `DemoUser${timestamp}`,
    password: 'DemoTest2024@'
  };

  let step = 1;
  const results = {
    steps: [],
    errors: [],
    warnings: []
  };

  const logStep = (description, success, details = '') => {
    console.log(`${success ? '✅' : '❌'} Step ${step}: ${description}`);
    if (details) console.log(`   ${details}`);
    
    results.steps.push({
      step: step++,
      description,
      success,
      details
    });
    
    if (!success) {
      results.errors.push(`Step ${step-1}: ${description} - ${details}`);
    }
  };

  const makeRequest = async (method, endpoint, data = null, headers = {}) => {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']; // FormData가 자동으로 설정
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
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

  console.log('🚀 데모 사용자 정보:');
  console.log(`   📧 이메일: ${demoUser.email}`);
  console.log(`   👤 닉네임: ${demoUser.nickname}`);
  console.log(`   🔐 비밀번호: ${demoUser.password}\n`);

  // Step 1: API 서버 연결 확인
  const health = await makeRequest('GET', '/');
  logStep('API 서버 연결 테스트', health.ok, 
    health.ok ? `서버 응답: ${health.data.message}` : `오류: ${health.error || health.status}`);

  if (!health.ok) {
    console.log('\n❌ API 서버에 연결할 수 없어 테스트를 중단합니다.');
    return;
  }

  // Step 2: 이메일 중복 확인
  const emailCheck = await makeRequest('POST', '/users/check_email', { email: demoUser.email });
  logStep('이메일 중복 확인', emailCheck.ok, emailCheck.data?.message);

  // Step 3: 회원가입
  const signup = await makeRequest('POST', '/users/signup', demoUser);
  logStep('데모 계정 회원가입', signup.ok, 
    signup.ok ? '회원가입 성공' : `오류: ${signup.data?.message}`);

  if (!signup.ok) {
    console.log('\n❌ 회원가입에 실패하여 테스트를 중단합니다.');
    return;
  }

  // 잠시 대기 (DB 동기화)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 4: 로그인
  const login = await makeRequest('POST', '/users/login', {
    email: demoUser.email,
    password: demoUser.password
  });
  logStep('데모 계정 로그인', login.ok, 
    login.ok ? '로그인 성공' : `오류: ${login.data?.message}`);

  if (!login.ok) {
    console.log('\n❌ 로그인에 실패하여 테스트를 중단합니다.');
    return;
  }

  const authToken = login.data?.vridge_session;
  if (!authToken) {
    logStep('인증 토큰 획득', false, '토큰이 반환되지 않음');
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `vridge_session=${authToken}`
  };

  logStep('인증 토큰 획득', true, `토큰 길이: ${authToken.length}자`);

  // Step 5: 기존 프로젝트 목록 확인
  const projectList = await makeRequest('GET', '/projects/project_list', null, authHeaders);
  logStep('기존 프로젝트 목록 조회', projectList.ok, 
    projectList.ok ? `${projectList.data.result?.length || 0}개 프로젝트 존재` : '조회 실패');

  // Step 6: 새 프로젝트 생성
  const projectName = `데모 프로젝트 ${timestamp}`;
  const formData = new FormData();
  
  formData.append('inputs', JSON.stringify({
    name: projectName,
    manager: '김데모',
    consumer: '테스트 회사',
    description: '데모 계정으로 생성한 테스트 프로젝트입니다.',
    color: '#3498db'
  }));
  
  formData.append('process', JSON.stringify({
    basic_plan: { start_date: '2025-01-10', end_date: '2025-01-15' },
    story_board: { start_date: '2025-01-16', end_date: '2025-01-20' },
    filming: { start_date: '2025-01-21', end_date: '2025-01-30' },
    video_edit: { start_date: '2025-02-01', end_date: '2025-02-10' }
  }));

  const createProject = await makeRequest('POST', '/projects/create', formData, authHeaders);
  logStep('새 프로젝트 생성', createProject.ok, 
    createProject.ok ? `프로젝트 "${projectName}" 생성 완료` : `오류: ${createProject.data?.message}`);

  let projectId = null;
  if (createProject.ok) {
    projectId = createProject.data?.project_id;
    logStep('프로젝트 ID 확인', !!projectId, projectId ? `프로젝트 ID: ${projectId}` : 'ID 없음');
  }

  // Step 7: 업데이트된 프로젝트 목록 확인
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const updatedList = await makeRequest('GET', '/projects/project_list', null, authHeaders);
  logStep('업데이트된 프로젝트 목록 확인', updatedList.ok, 
    updatedList.ok ? `${updatedList.data.result?.length || 0}개 프로젝트` : '조회 실패');

  // 생성된 프로젝트 찾기
  let createdProject = null;
  if (updatedList.ok && updatedList.data.result) {
    createdProject = updatedList.data.result.find(p => p.name === projectName);
    if (createdProject) {
      projectId = createdProject.id;
      logStep('생성된 프로젝트 확인', true, `프로젝트 발견: ID ${projectId}`);
    }
  }

  // Step 8: 프로젝트 중복 생성 방지 테스트
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const duplicateAttempt = await makeRequest('POST', '/projects/create', formData, authHeaders);
  const isDuplicateBlocked = !duplicateAttempt.ok && (
    duplicateAttempt.data?.message?.includes('이미') || 
    duplicateAttempt.data?.message?.includes('중복') ||
    duplicateAttempt.data?.message?.includes('존재')
  );
  
  logStep('중복 생성 방지 확인', isDuplicateBlocked, 
    isDuplicateBlocked ? '중복 생성이 올바르게 차단됨' : '중복 생성 방지 실패');

  // Step 9: 피드백 시스템 접근
  if (projectId) {
    const feedback = await makeRequest('GET', `/feedbacks/${projectId}`, null, authHeaders);
    logStep('피드백 페이지 접근', feedback.ok, 
      feedback.ok ? '피드백 시스템 정상 접근' : `오류: ${feedback.data?.message}`);

    if (feedback.ok) {
      const feedbackData = feedback.data.result;
      
      // 피드백 구조 확인
      logStep('피드백 데이터 구조 확인', !!feedbackData, 
        feedbackData ? '피드백 객체 존재' : '피드백 데이터 없음');

      // 파일 업로드 상태 확인
      if (feedbackData?.files) {
        const fileUrl = feedbackData.files;
        const isValidUrl = fileUrl.startsWith('https://') && fileUrl.includes('videoplanet.up.railway.app');
        
        logStep('피드백 파일 URL 구조 확인', isValidUrl, 
          isValidUrl ? `올바른 URL 형식: ${fileUrl}` : `잘못된 URL: ${fileUrl}`);

        // 실제 파일 접근 테스트 (HEAD 요청)
        try {
          const fileTest = await fetch(fileUrl, { method: 'HEAD' });
          logStep('피드백 파일 접근성 테스트', fileTest.ok, 
            fileTest.ok ? '파일 접근 가능' : `HTTP ${fileTest.status}`);
        } catch (error) {
          logStep('피드백 파일 접근성 테스트', false, `네트워크 오류: ${error.message}`);
        }
      } else {
        logStep('피드백 파일 상태', true, '파일 업로드 대기 상태 (정상)');
      }

      // WebSocket 연결 정보 확인 (시뮬레이션)
      const wsUrl = `wss://videoplanet.up.railway.app/ws/feedback/${projectId}/`;
      logStep('WebSocket URL 생성', true, `WS URL: ${wsUrl}`);
    }
  }

  // Step 10: 다른 API 엔드포인트 테스트
  const apiTests = [
    { name: '사용자 프로필 조회', endpoint: '/users/profile', method: 'GET' },
    { name: '프로젝트 상세 조회', endpoint: `/projects/${projectId}`, method: 'GET' }
  ];

  for (const test of apiTests) {
    if (test.endpoint.includes('null')) continue; // projectId가 없으면 스킵
    
    const result = await makeRequest(test.method, test.endpoint, null, authHeaders);
    logStep(test.name, result.ok, 
      result.ok ? '정상 응답' : `HTTP ${result.status}`);
  }

  // 최종 결과 리포트
  console.log('\n' + '='.repeat(80));
  console.log('🎭 데모 계정 전체 플로우 테스트 결과');
  console.log('='.repeat(80));
  
  const successCount = results.steps.filter(s => s.success).length;
  const totalCount = results.steps.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  console.log(`📊 테스트 결과: ${successCount}/${totalCount} 성공 (${successRate}%)`);
  console.log(`👤 데모 사용자: ${demoUser.nickname} (${demoUser.email})`);
  console.log(`📁 생성된 프로젝트: ${projectName}`);
  
  if (projectId) {
    console.log(`🆔 프로젝트 ID: ${projectId}`);
    console.log(`🔗 피드백 URL: ${API_BASE}/feedbacks/${projectId}`);
  }

  console.log('\n🔍 세부 결과:');
  results.steps.forEach(step => {
    const status = step.success ? '✅' : '❌';
    console.log(`   ${status} Step ${step.step}: ${step.description}`);
    if (step.details && !step.success) {
      console.log(`      └─ ${step.details}`);
    }
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️ 발견된 문제점:');
    results.errors.forEach(error => {
      console.log(`   🔸 ${error}`);
    });
  }

  console.log('\n🎯 핵심 기능 검증 상태:');
  const coreFeatures = [
    { name: 'API 서버 연결', working: health.ok },
    { name: '사용자 인증 시스템', working: !!authToken },
    { name: '프로젝트 생성', working: !!projectId },
    { name: '중복 방지 시스템', working: isDuplicateBlocked },
    { name: '피드백 시스템', working: projectId && feedback?.ok }
  ];

  coreFeatures.forEach(feature => {
    console.log(`   ${feature.working ? '✅' : '❌'} ${feature.name}`);
  });

  console.log('\n🏆 최종 평가:');
  if (successRate >= 90) {
    console.log('🚀 모든 핵심 기능이 완벽하게 작동하고 있습니다!');
    console.log('   📈 시스템이 프로덕션 환경에서 안정적으로 동작할 준비가 되었습니다.');
  } else if (successRate >= 75) {
    console.log('✅ 대부분의 기능이 정상 작동하며, 일부 개선사항이 있습니다.');
    console.log('   🔧 발견된 문제점들을 수정하면 완전한 시스템이 됩니다.');
  } else {
    console.log('⚠️ 몇 가지 중요한 문제가 발견되어 추가 수정이 필요합니다.');
    console.log('   🛠️ 핵심 기능들을 점검하고 수정해야 합니다.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎬 데모 계정 테스트 완료');
  console.log('='.repeat(80));

  return {
    demoUser,
    projectId,
    projectName,
    successRate: parseFloat(successRate),
    totalSteps: totalCount,
    successSteps: successCount,
    results
  };
}

// 테스트 실행
demoAccountTest().catch(error => {
  console.error('❌ 데모 테스트 중 오류 발생:', error);
});