const axios = require('axios');

async function testRailwayAPI() {
  console.log('=== Railway API 테스트 ===\n');
  
  const API_URL = 'https://videoplanet.up.railway.app';
  const loginData = {
    email: 'demo@test.com',
    password: 'demo1234'
  };
  
  try {
    // 1. 헬스체크
    console.log('1. 헬스체크 테스트');
    const healthResponse = await axios.get(`${API_URL}/api/health/`);
    console.log('   ✅ 헬스체크 성공:', healthResponse.data.status);
    
    // 2. 로그인 테스트
    console.log('\n2. 로그인 테스트');
    const loginResponse = await axios.post(`${API_URL}/api/users/login/`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    console.log('   상태 코드:', loginResponse.status);
    if (loginResponse.status === 200) {
      console.log('   ✅ 로그인 성공!');
      const token = loginResponse.data.vridge_session;
      console.log('   토큰:', token ? token.substring(0, 50) + '...' : 'No token');
      
      // 3. 인증된 요청 테스트
      if (token) {
        console.log('\n3. 인증된 API 요청 테스트');
        const projectsResponse = await axios.get(`${API_URL}/api/projects/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: () => true
        });
        
        console.log('   프로젝트 API 상태:', projectsResponse.status);
        if (projectsResponse.status === 200) {
          console.log('   ✅ 프로젝트 목록 조회 성공');
          console.log('   프로젝트 수:', projectsResponse.data.results?.length || 0);
        } else {
          console.log('   ❌ 프로젝트 API 실패:', projectsResponse.data);
        }
      }
    } else {
      console.log('   ❌ 로그인 실패:', loginResponse.data);
      
      // 테스트 사용자 생성 시도
      console.log('\n4. 테스트 사용자 생성 시도');
      const signupData = {
        email: 'demo@test.com',
        password: 'demo1234',
        passwordConfirm: 'demo1234',
        nickname: '데모유저',
        login_method: 'email'
      };
      
      const signupResponse = await axios.post(`${API_URL}/api/users/signup/`, signupData, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      
      console.log('   회원가입 상태:', signupResponse.status);
      if (signupResponse.status === 201 || signupResponse.status === 200) {
        console.log('   ✅ 회원가입 성공! 다시 로그인을 시도하세요.');
      } else {
        console.log('   ❌ 회원가입 실패:', signupResponse.data);
      }
    }
    
  } catch (error) {
    console.error('오류:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
  }
}

testRailwayAPI();