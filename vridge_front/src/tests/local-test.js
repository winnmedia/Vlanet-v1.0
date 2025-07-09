/**
 * 로컬 환경 MECE 테스트
 */

const API_BASE = 'http://localhost:8000';

async function localTest() {
  console.log('🎯 VideoPlanet 로컬 MECE 테스트\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {
      api: { total: 0, passed: 0 },
      auth: { total: 0, passed: 0 },
      project: { total: 0, passed: 0 },
      feedback: { total: 0, passed: 0 },
      planning: { total: 0, passed: 0 }
    }
  };

  const test = async (category, name, testFn) => {
    results.total++;
    results.categories[category].total++;
    
    try {
      const result = await testFn();
      if (result.success) {
        results.passed++;
        results.categories[category].passed++;
        console.log(`✅ [${category}] ${name}`);
      } else {
        results.failed++;
        console.log(`❌ [${category}] ${name}: ${result.message}`);
      }
      return result;
    } catch (error) {
      results.failed++;
      console.log(`❌ [${category}] ${name}: ${error.message}`);
      return { success: false, message: error.message };
    }
  };

  // 1. API 연결 테스트
  await test('api', 'API 서버 연결', async () => {
    const response = await fetch(`${API_BASE}/api/health/`);
    const data = await response.json();
    return { 
      success: response.ok && data.status === 'healthy',
      message: data.message || response.statusText
    };
  });

  // 2. 인증 테스트
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authToken = null;

  await test('auth', '이메일 중복 확인', async () => {
    const response = await fetch(`${API_BASE}/api/users/check-email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    return { success: response.ok };
  });

  await test('auth', '회원가입', async () => {
    const response = await fetch(`${API_BASE}/api/users/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        nickname: `테스트유저_${Date.now()}`
      })
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  });

  await test('auth', '로그인', async () => {
    const response = await fetch(`${API_BASE}/api/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.vridge_session || data.access_token;
      return { success: !!authToken, message: data.message };
    }
    const data = await response.json();
    return { success: false, message: data.message };
  });

  // 3. 프로젝트 테스트
  let projectId = null;

  await test('project', '프로젝트 생성', async () => {
    if (!authToken) return { success: false, message: '인증 토큰 없음' };
    
    const formData = new FormData();
    formData.append('inputs', JSON.stringify({
      name: `테스트 프로젝트 ${new Date().toISOString()}`,
      client: '테스트 클라이언트',
      manager: `testuser_${Date.now()}`,
      status: 'planning',
      theme: '테스트 테마'
    }));
    formData.append('process', JSON.stringify({
      basic_plan: { active: true },
      story_board: { active: true },
      filming: { active: true },
      video_edit: { active: true },
      post_work: { active: true },
      video_preview: { active: true },
      confirmation: { active: true },
      video_delivery: { active: true }
    }));
    
    const response = await fetch(`${API_BASE}/api/projects/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      projectId = data.project_id;
      return { success: !!projectId };
    }
    return { success: false };
  });

  await test('project', '프로젝트 중복 생성 방지', async () => {
    if (!authToken) return { success: false, message: '인증 토큰 없음' };
    
    const projectName = `중복테스트_${Date.now()}`;
    
    // 첫 번째 생성
    const formData1 = new FormData();
    formData1.append('inputs', JSON.stringify({
      name: projectName,
      client: '테스트',
      manager: 'test',
      status: 'planning'
    }));
    formData1.append('process', JSON.stringify({
      basic_plan: { active: true }
    }));
    
    const response1 = await fetch(`${API_BASE}/api/projects/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData1
    });
    
    if (!response1.ok) return { success: false, message: '첫 번째 생성 실패' };
    
    // 동일한 이름으로 두 번째 생성 시도
    const formData2 = new FormData();
    formData2.append('inputs', JSON.stringify({
      name: projectName,
      client: '테스트',
      manager: 'test',
      status: 'planning'
    }));
    formData2.append('process', JSON.stringify({
      basic_plan: { active: true }
    }));
    
    const response2 = await fetch(`${API_BASE}/api/projects/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData2
    });
    
    const responseData = await response2.text();
    
    // 409 Conflict가 반환되어야 함
    if (response2.status !== 409) {
      return { 
        success: false, 
        message: `예상: 409, 실제: ${response2.status}, 응답: ${responseData.substring(0, 100)}` 
      };
    }
    
    return { success: true };
  });

  await test('project', '프로젝트 목록 조회', async () => {
    if (!authToken) return { success: false, message: '인증 토큰 없음' };
    
    try {
      const response = await fetch(`${API_BASE}/api/projects/project_list/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // API가 {result: [...]} 형태로 반환
        return { success: data.result && Array.isArray(data.result) };
      }
      
      const errorText = await response.text();
      return { success: false, message: `${response.status}: ${errorText.substring(0, 100)}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 4. 피드백 테스트
  await test('feedback', '피드백 조회 (프로젝트 있음)', async () => {
    if (!authToken || !projectId) return { success: false, message: '사전 조건 미충족' };
    
    const response = await fetch(`${API_BASE}/api/projects/detail/${projectId}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    return { success: response.ok };
  });

  // 5. 비디오 플래닝 테스트
  await test('planning', '비디오 플래닝 구조 생성', async () => {
    if (!authToken) return { success: false, message: '인증 토큰 없음' };
    
    const response = await fetch(`${API_BASE}/api/video-planning/generate/structure/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        planning_input: '5분 길이의 환경 보호 다큐멘터리를 만들고 싶습니다. 일반 대중을 대상으로 하며, 기후 변화의 심각성을 알리는 내용입니다.'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `${response.status}: ${errorText.substring(0, 100)}` };
    }
    
    return { success: true };
  });

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 MECE 테스트 결과');
  console.log('='.repeat(60));
  
  console.log(`\n총 테스트: ${results.total}개`);
  console.log(`성공: ${results.passed}개`);
  console.log(`실패: ${results.failed}개`);
  console.log(`성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n카테고리별 결과:');
  for (const [category, stats] of Object.entries(results.categories)) {
    if (stats.total > 0) {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(0);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.passed === results.total) {
    console.log('✅ 모든 테스트 통과! 배포 준비 완료');
  } else {
    console.log('⚠️  일부 테스트 실패. 배포 전 수정 필요');
  }
}

// 테스트 실행
localTest().catch(console.error);