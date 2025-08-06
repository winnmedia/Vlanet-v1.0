const axios = require('axios');

async function testDemoLogin() {
  console.log('=== 데모 계정 로그인 테스트 ===\n');
  
  const loginData = {
    email: 'demo@test.com',
    password: 'demo1234'
  };
  
  try {
    // 백엔드 직접 테스트
    console.log('1. 백엔드 API 직접 테스트 (http://localhost:8000)');
    const backendResponse = await axios.post('http://localhost:8000/api/users/login/', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    console.log('   상태 코드:', backendResponse.status);
    if (backendResponse.status === 200) {
      console.log('   ✅ 백엔드 로그인 성공!');
      console.log('   토큰:', backendResponse.data.vridge_session?.substring(0, 50) + '...');
    } else {
      console.log('   ❌ 백엔드 로그인 실패:', backendResponse.data);
    }
    
    // 프론트엔드 프록시 테스트
    console.log('\n2. 프론트엔드 프록시 테스트 (http://localhost:3000)');
    const frontendResponse = await axios.post('http://localhost:3000/api/users/login/', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true,
      maxRedirects: 0
    });
    
    console.log('   상태 코드:', frontendResponse.status);
    if (frontendResponse.status === 200) {
      console.log('   ✅ 프론트엔드 프록시 성공!');
    } else if (frontendResponse.status === 308) {
      console.log('   ⚠️  리다이렉트 발생:', frontendResponse.headers.location);
    } else {
      console.log('   ❌ 프론트엔드 프록시 실패:', frontendResponse.data);
    }
    
  } catch (error) {
    console.error('오류:', error.message);
  }
  
  console.log('\n=== 브라우저에서 테스트 ===');
  console.log('1. http://localhost:3000/login 접속');
  console.log('2. 이메일: demo@test.com');
  console.log('3. 비밀번호: demo1234');
  console.log('4. 로그인 버튼 클릭');
}

testDemoLogin();