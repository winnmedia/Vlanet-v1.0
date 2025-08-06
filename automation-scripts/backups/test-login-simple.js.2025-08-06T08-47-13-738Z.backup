const axios = require('axios');

async function testLogin() {
  const API_URL = 'http://localhost:8000';
  
  console.log('=== 로그인 API 테스트 ===');
  
  const loginData = {
    email: 'test@example.com',
    password: 'test1234'
  };
  
  try {
    console.log('로그인 시도:', loginData);
    const response = await axios.post(`${API_URL}/api/users/login/`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    console.log('상태 코드:', response.status);
    console.log('응답:', response.data);
    
    if (response.status === 200) {
      console.log('\n✅ 로그인 성공!');
      console.log('세션 토큰:', response.data.vridge_session);
      console.log('사용자 정보:', response.data.user);
    } else {
      console.log('\n❌ 로그인 실패');
    }
    
  } catch (error) {
    console.error('오류:', error.message);
  }
}

testLogin();