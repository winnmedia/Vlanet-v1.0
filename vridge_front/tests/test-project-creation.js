const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testProjectCreation() {
  console.log('=== 프로젝트 생성 테스트 ===\n');
  
  try {
    // 1. 회원가입 및 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `project${timestamp}@example.com`,
      nickname: `project${timestamp}`,
      password: 'TestPassword123!'
    };
    
    console.log('1. 회원가입 테스트');
    try {
      const signupResponse = await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
      console.log('✓ 회원가입 성공');
    } catch (error) {
      console.log('✗ 회원가입 실패:', error.response?.data?.message || error.message);
      return;
    }
    
    console.log('\n2. 로그인 테스트');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 로그인 성공');
    console.log('- 토큰 길이:', authToken.length);
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Origin': 'https://vlanet.net'
    };
    
    // 3. 다양한 프로젝트 생성 엔드포인트 테스트
    console.log('\n3. 프로젝트 생성 엔드포인트 테스트\n');
    
    const endpoints = [
      { path: '/projects/create/', name: '기본 create' },
      { path: '/projects/atomic-create/', name: 'atomic-create' },
      { path: '/api/projects/create/', name: 'API prefix create' },
      { path: '/api/projects/atomic-create/', name: 'API prefix atomic-create' }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`테스트: ${endpoint.name} (${endpoint.path})`);
      
      const projectData = {
        title: `테스트 프로젝트 ${timestamp}`,
        description: '프로젝트 생성 테스트',
        project_purpose: 'TEST',
        share: false,
        status: 'TODO'
      };
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}${endpoint.path}`,
          projectData,
          { headers }
        );
        
        if (response.status === 201 || response.status === 200) {
          console.log(`✓ 성공! 프로젝트 ID: ${response.data.id || response.data.project_id}`);
          console.log(`  제목: ${response.data.title}`);
          console.log(`  상태: ${response.data.status}`);
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.response?.data?.detail || error.message;
        console.log(`✗ 실패 (${status}): ${message}`);
        
        // 409 Conflict는 중복 방지가 작동한다는 의미
        if (status === 409) {
          console.log('  → 중복 방지 시스템 정상 작동');
        }
      }
      console.log('');
    }
    
    // 4. FormData로 프로젝트 생성 테스트
    console.log('4. FormData 방식 프로젝트 생성 테스트\n');
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('title', `FormData 프로젝트 ${timestamp}`);
    formData.append('description', 'FormData 테스트');
    formData.append('project_purpose', 'TEST');
    formData.append('share', 'false');
    formData.append('status', 'TODO');
    
    try {
      const formResponse = await axios.post(
        `${API_BASE_URL}/projects/create/`,
        formData,
        {
          headers: {
            ...headers,
            ...formData.getHeaders()
          }
        }
      );
      
      console.log('✓ FormData 방식 성공!');
      console.log(`  프로젝트 ID: ${formResponse.data.id}`);
    } catch (error) {
      console.log('✗ FormData 방식 실패:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('\n전체 테스트 실패:', error.message);
  }
}

testProjectCreation();