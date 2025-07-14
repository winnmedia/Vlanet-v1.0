/**
 * 프로젝트 생성 디버깅 테스트
 */

const API_BASE = 'https://videoplanet.up.railway.app';

async function debugProjectTest() {
  console.log('🔍 프로젝트 생성 디버깅 테스트\n');

  const timestamp = Date.now();
  const testUser = {
    email: `debug.test${timestamp}@vlanet.net`,
    nickname: `DebugUser${timestamp}`,
    password: 'DebugTest2024@'
  };

  // 기본 요청 함수
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
      console.log(`🌐 ${method} ${url}`);
      const response = await fetch(url, config);
      const responseText = await response.text();
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch {
        jsonData = { raw: responseText };
      }

      return {
        status: response.status,
        ok: response.ok,
        data: jsonData,
        raw: responseText
      };
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return {
        status: 0,
        ok: false,
        error: error.message
      };
    }
  };

  // Step 1: 회원가입
  console.log('='.repeat(50));
  console.log('1. 회원가입 테스트');
  console.log('='.repeat(50));
  
  const signup = await makeRequest('POST', '/users/signup', testUser);
  if (!signup.ok) {
    console.log('❌ 회원가입 실패, 테스트 중단');
    return;
  }

  // Step 2: 로그인
  console.log('\n' + '='.repeat(50));
  console.log('2. 로그인 테스트');
  console.log('='.repeat(50));
  
  const login = await makeRequest('POST', '/users/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (!login.ok) {
    console.log('❌ 로그인 실패, 테스트 중단');
    return;
  }

  const authToken = login.data?.vridge_session;
  if (!authToken) {
    console.log('❌ 토큰 없음, 테스트 중단');
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `vridge_session=${authToken}`
  };

  console.log(`✅ 토큰 획득: ${authToken.substring(0, 20)}...`);

  // Step 3: 다양한 프로젝트 생성 엔드포인트 테스트
  const endpoints = [
    '/projects/create',  // 새로운 fixed_final 버전
    '/projects/atomic-create',
    '/projects/create_safe',
    '/projects/create_original'
  ];

  const projectData = {
    name: `디버그 프로젝트 ${timestamp}`,
    manager: '디버그 매니저',
    consumer: '디버그 고객사',
    description: '디버깅용 테스트 프로젝트',
    color: '#FF5722'
  };

  const processData = {
    basic_plan: { start_date: '2025-01-15', end_date: '2025-01-20' },
    story_board: { start_date: '2025-01-21', end_date: '2025-01-25' }
  };

  for (const endpoint of endpoints) {
    console.log('\n' + '='.repeat(50));
    console.log(`3. 프로젝트 생성 테스트: ${endpoint}`);
    console.log('='.repeat(50));

    const formData = new FormData();
    formData.append('inputs', JSON.stringify(projectData));
    formData.append('process', JSON.stringify(processData));

    console.log(`📤 전송 데이터:`);
    console.log(`   inputs: ${JSON.stringify(projectData)}`);
    console.log(`   process: ${JSON.stringify(processData)}`);

    const result = await makeRequest('POST', endpoint, formData, authHeaders);
    
    if (result.ok) {
      console.log('✅ 성공!');
      if (result.data?.project_id) {
        console.log(`📁 프로젝트 ID: ${result.data.project_id}`);
      }
    } else {
      console.log('❌ 실패');
    }
  }

  // Step 4: 프로젝트 목록 확인
  console.log('\n' + '='.repeat(50));
  console.log('4. 프로젝트 목록 확인');
  console.log('='.repeat(50));
  
  const projectList = await makeRequest('GET', '/projects/project_list', null, authHeaders);
  
  if (projectList.ok && projectList.data.result) {
    console.log(`✅ ${projectList.data.result.length}개 프로젝트 발견`);
    projectList.data.result.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔍 디버깅 테스트 완료');
  console.log('='.repeat(50));
}

debugProjectTest().catch(console.error);