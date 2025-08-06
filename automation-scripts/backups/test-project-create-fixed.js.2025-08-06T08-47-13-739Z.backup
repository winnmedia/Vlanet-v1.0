/**
 * 프로젝트 생성 API 수정된 테스트
 */

const axios = require('axios');

async function testProjectCreate() {
  console.log('🔍 프로젝트 생성 API 수정된 테스트\n');
  
  // 1. 로그인
  const loginResponse = await axios.post('http://localhost:8001/api/users/login/', {
    email: 'demo@test.com',
    password: 'demo1234'
  });
  
  const token = loginResponse.data.vridge_session;
  console.log('✅ 로그인 성공\n');
  
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 2. process 데이터 포함하여 프로젝트 생성
  console.log('📝 프로젝트 생성 테스트 (process 포함)');
  
  const projectData = {
    name: `테스트 프로젝트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '기능 테스트를 위한 프로젝트',
    color: '#1631F8',
    process: [
      {
        name: '기본 기획',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: '스토리보드',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: '촬영',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: '편집',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  };
  
  try {
    const createResponse = await axios.post(
      'http://localhost:8001/api/projects/create/',
      projectData,
      config
    );
    console.log('✅ 프로젝트 생성 성공!');
    console.log('응답:', JSON.stringify(createResponse.data, null, 2));
    
    const projectId = createResponse.data.result?.id;
    if (projectId) {
      console.log(`\n생성된 프로젝트 ID: ${projectId}`);
      
      // 3. 생성된 프로젝트 조회
      console.log('\n📋 생성된 프로젝트 조회');
      try {
        const detailResponse = await axios.get(
          `http://localhost:8001/api/projects/detail/${projectId}/`,
          config
        );
        console.log('✅ 프로젝트 조회 성공');
        console.log('프로젝트명:', detailResponse.data.name);
        console.log('고객사:', detailResponse.data.consumer);
      } catch (error) {
        console.log('❌ 프로젝트 조회 실패:', error.response?.data);
      }
    }
  } catch (error) {
    console.log('❌ 프로젝트 생성 실패:', error.response?.status);
    console.log('오류 상세:', error.response?.data);
  }
  
  // 4. 프로젝트 목록 재조회
  console.log('\n📋 프로젝트 목록 조회');
  try {
    const listResponse = await axios.get('http://localhost:8001/api/projects/', config);
    console.log('✅ 프로젝트 목록 조회 성공');
    console.log(`총 ${listResponse.data.length}개의 프로젝트`);
  } catch (error) {
    console.log('❌ 프로젝트 목록 조회 실패:', error.response?.data);
  }
}

testProjectCreate().catch(console.error);