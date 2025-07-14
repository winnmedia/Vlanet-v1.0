const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testProjectCreation() {
  console.log('=== 간단한 프로젝트 생성 테스트 ===\n');
  
  try {
    // 1. 회원가입 및 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `simple${timestamp}@example.com`,
      nickname: `simple${timestamp}`,
      password: 'TestPassword123!'
    };
    
    console.log('1. 회원가입');
    await axios.post(`${API_BASE_URL}/users/signup/`, testUser);
    console.log('✓ 회원가입 성공');
    
    console.log('\n2. 로그인');
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 로그인 성공');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Origin': 'https://vlanet.net'
    };
    
    // 3. 프로젝트 생성 - 프론트엔드와 동일한 데이터 구조
    console.log('\n3. 프로젝트 생성 테스트');
    
    const projectData = {
      name: `테스트 프로젝트 ${timestamp}`,
      manager: '테스트 매니저',
      consumer: '테스트 고객사',
      description: '테스트 설명',
      color: '#1631F8',
      process: {
        shooting_start: '2025-07-10',
        shooting_end: '2025-07-15',
        editing_start: '2025-07-16',
        editing_end: '2025-07-20'
      }
    };
    
    console.log('전송 데이터:', JSON.stringify(projectData, null, 2));
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/projects/atomic-create/`,
        projectData,
        { headers }
      );
      
      console.log('\n✅ 프로젝트 생성 성공!');
      console.log('응답:', response.data);
    } catch (error) {
      console.log('\n❌ 프로젝트 생성 실패');
      console.log('상태 코드:', error.response?.status);
      console.log('에러 메시지:', error.response?.data);
      
      // 상세 디버깅
      if (error.response?.status === 400) {
        console.log('\n400 에러 - 요청 데이터 문제');
        console.log('서버가 기대하는 데이터 형식을 확인하세요.');
      } else if (error.response?.status === 404) {
        console.log('\n404 에러 - URL 경로 문제');
        console.log('URL:', `${API_BASE_URL}/projects/atomic-create/`);
      }
    }
    
  } catch (error) {
    console.error('\n전체 테스트 실패:', error.message);
  }
}

testProjectCreation();