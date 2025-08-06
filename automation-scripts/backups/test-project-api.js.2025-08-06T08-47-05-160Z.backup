/**
 * 프로젝트 API 상세 테스트
 */

const axios = require('axios');

async function testProjectAPIs() {
  console.log('🔍 프로젝트 API 상세 테스트\n');
  
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
  
  // 2. 프로젝트 목록 조회 테스트
  console.log('📋 프로젝트 목록 조회 테스트');
  try {
    const listResponse = await axios.get('http://localhost:8001/api/projects/', config);
    console.log('✅ 성공:', listResponse.data);
  } catch (error) {
    console.log('❌ 실패:', error.response?.status, error.response?.data);
    if (error.response?.status === 500) {
      console.log('서버 오류 상세:', error.response.data);
    }
  }
  
  // 3. 프로젝트 생성 테스트 - 기본 데이터
  console.log('\n📝 프로젝트 생성 테스트 (기본 데이터)');
  const basicProject = {
    name: `테스트 프로젝트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '기능 테스트를 위한 프로젝트',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
  
  try {
    const createResponse = await axios.post(
      'http://localhost:8001/api/projects/create/',
      basicProject,
      config
    );
    console.log('✅ 성공:', createResponse.data);
  } catch (error) {
    console.log('❌ 실패:', error.response?.status, error.response?.data);
    
    // 4. 필수 필드 확인
    if (error.response?.status === 400) {
      console.log('\n🔍 필수 필드 확인을 위한 추가 테스트');
      
      // 각 필드를 하나씩 제거하며 테스트
      const fields = Object.keys(basicProject);
      for (const field of fields) {
        const testData = { ...basicProject };
        delete testData[field];
        
        try {
          await axios.post('http://localhost:8001/api/projects/create/', testData, config);
          console.log(`  ⚠️  ${field} 없이도 생성됨 (필수 아님)`);
        } catch (err) {
          if (err.response?.status === 400) {
            console.log(`  ✅ ${field}는 필수 필드`);
          }
        }
      }
      
      // 5. 추가 필드 테스트
      console.log('\n🔍 추가 필드 포함 테스트');
      const extendedProject = {
        ...basicProject,
        status: 'active',
        priority: 'high',
        budget: 10000000,
        client_name: '테스트 클라이언트',
        project_type: 'video'
      };
      
      try {
        const extResponse = await axios.post(
          'http://localhost:8001/api/projects/create/',
          extendedProject,
          config
        );
        console.log('✅ 추가 필드 포함 성공:', extResponse.data);
      } catch (err) {
        console.log('❌ 추가 필드 포함 실패:', err.response?.data);
      }
    }
  }
  
  // 6. projects/create/ vs projects/ 엔드포인트 비교
  console.log('\n🔍 엔드포인트 비교 테스트');
  try {
    const altResponse = await axios.post(
      'http://localhost:8001/api/projects/',
      basicProject,
      config
    );
    console.log('✅ /api/projects/ POST 성공:', altResponse.data);
  } catch (error) {
    console.log('❌ /api/projects/ POST 실패:', error.response?.status);
  }
}

testProjectAPIs().catch(console.error);