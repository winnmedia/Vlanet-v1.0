/**
 * 프로젝트 목록 조회 디버깅
 */

const axios = require('axios');

async function debugProjectList() {
  console.log('🔍 프로젝트 목록 조회 디버깅\n');
  
  // 1. 로그인
  const loginResponse = await axios.post('http://localhost:8001/api/users/login/', {
    email: 'demo@test.com',
    password: 'demo1234'
  });
  
  const token = loginResponse.data.vridge_session;
  const userId = loginResponse.data.user_id || loginResponse.data.id;
  console.log('✅ 로그인 성공');
  console.log(`사용자 ID: ${userId}\n`);
  
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 2. 먼저 프로젝트 생성 확인
  console.log('📝 프로젝트 생성');
  const projectData = {
    name: `디버그 테스트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '디버깅용',
    color: '#1631F8',
    process: [
      {
        name: '기본 기획',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  };
  
  let projectId;
  try {
    const createResp = await axios.post(
      'http://localhost:8001/api/projects/create/',
      projectData,
      config
    );
    projectId = createResp.data.project_id;
    console.log(`✅ 프로젝트 생성 성공 (ID: ${projectId})\n`);
  } catch (error) {
    console.log('❌ 프로젝트 생성 실패:', error.response?.data);
    return;
  }
  
  // 3. 프로젝트 상세 조회 (이것이 작동하는지 확인)
  console.log('📋 프로젝트 상세 조회');
  try {
    const detailResp = await axios.get(
      `http://localhost:8001/api/projects/detail/${projectId}/`,
      config
    );
    console.log('✅ 프로젝트 상세 조회 성공');
    console.log(`프로젝트명: ${detailResp.data.name}\n`);
  } catch (error) {
    console.log('❌ 프로젝트 상세 조회 실패:', error.response?.data);
  }
  
  // 4. 프로젝트 목록 조회 (문제가 있는 부분)
  console.log('📋 프로젝트 목록 조회');
  try {
    const listResp = await axios.get(
      'http://localhost:8001/api/projects/',
      config
    );
    console.log('✅ 프로젝트 목록 조회 성공');
    console.log(`총 ${listResp.data.length}개의 프로젝트`);
  } catch (error) {
    console.log('❌ 프로젝트 목록 조회 실패');
    console.log('상태 코드:', error.response?.status);
    console.log('오류 메시지:', error.response?.data);
    
    // 5. 디버깅을 위해 다른 엔드포인트들 시도
    console.log('\n🔧 대체 엔드포인트 시도');
    
    // 사용자별 프로젝트 조회 시도
    try {
      const userProjectsResp = await axios.get(
        `http://localhost:8001/api/users/${userId}/projects/`,
        config
      );
      console.log('✅ 사용자별 프로젝트 조회 성공');
    } catch (err) {
      console.log('❌ 사용자별 프로젝트 조회 실패:', err.response?.status);
    }
    
    // 필터링된 조회 시도
    try {
      const filteredResp = await axios.get(
        'http://localhost:8001/api/projects/?status=active',
        config
      );
      console.log('✅ 필터링된 프로젝트 조회 성공');
    } catch (err) {
      console.log('❌ 필터링된 프로젝트 조회 실패:', err.response?.status);
    }
  }
}

debugProjectList().catch(console.error);