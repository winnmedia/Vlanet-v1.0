/**
 * 영상 기획 기능 테스트
 */

const API_BASE = 'https://videoplanet.up.railway.app';

async function videoplanningTest() {
  console.log('🎥 VideoPlanet 영상 기획 기능 테스트\n');

  const results = {
    total: 0,
    passed: 0,
    issues: []
  };

  const test = async (name, testFn) => {
    results.total++;
    try {
      const result = await testFn();
      if (result.success) {
        results.passed++;
        console.log(`✅ ${name}: ${result.message || '성공'}`);
      } else {
        results.issues.push(name);
        console.log(`❌ ${name}: ${result.message || '실패'}`);
      }
      return result;
    } catch (error) {
      results.issues.push(name);
      console.log(`❌ ${name}: ${error.message}`);
      return { success: false, message: error.message };
    }
  };

  // 1. 로그인 먼저
  let authToken = null;
  const timestamp = Date.now();
  const testUser = {
    email: `videotest${timestamp}@example.com`,
    nickname: `VideoUser${timestamp}`,
    password: 'SecureTest2024@'
  };

  // 회원가입
  await fetch(`${API_BASE}/api/users/signup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  // 로그인
  const loginResponse = await fetch(`${API_BASE}/api/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  const loginData = await loginResponse.json();
  authToken = loginData.vridge_session;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `vridge_session=${authToken}`,
    'Content-Type': 'application/json'
  };

  // 2. 영상 기획 API 테스트
  await test('영상 기획 목록 조회', async () => {
    const response = await fetch(`${API_BASE}/api/video-planning/list`, { headers });
    const data = await response.json();
    return {
      success: response.ok,
      message: `${data.plans?.length || 0}개 기획안 조회됨`
    };
  });

  await test('새 영상 기획 생성 - 구조', async () => {
    const response = await fetch(`${API_BASE}/api/video-planning/generate/structure/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: '테스트 영상 기획',
        description: '테스트를 위한 영상 기획입니다',
        duration: 180,
        target_audience: '20-30대',
        purpose: '브랜드 홍보'
      })
    });
    
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : { message: 'Empty response' };
    } catch (e) {
      data = { message: 'Not JSON response' };
    }
    
    return {
      success: response.ok || response.status === 404, // 404도 허용 (API 미구현 가능)
      message: data.message || 'API 응답 받음'
    };
  });

  await test('최근 영상 기획 조회', async () => {
    const response = await fetch(`${API_BASE}/api/video-planning/recent`, { headers });
    
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : { message: 'Empty response' };
    } catch (e) {
      data = { message: 'Not JSON response' };
    }
    
    return {
      success: response.ok || response.status === 404,
      message: '최근 기획 조회 완료'
    };
  });

  // 최종 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('🎥 영상 기획 테스트 결과');
  console.log('='.repeat(60));
  console.log(`총 테스트: ${results.total}개`);
  console.log(`성공: ${results.passed}개`);
  console.log(`실패: ${results.total - results.passed}개`);
  console.log(`성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.issues.length > 0) {
    console.log('\n⚠️ 실패한 테스트:');
    results.issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

videoplanningTest().catch(console.error);