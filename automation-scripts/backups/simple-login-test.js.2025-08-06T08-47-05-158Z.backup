const axios = require('axios');

async function simpleLoginTest() {
  console.log('=== 심플 로그인 테스트 ===\n');
  
  // 1. 개발 서버 상태 확인
  console.log('1. 서버 상태 확인:');
  try {
    await axios.get('http://localhost:3000/', { timeout: 3000 });
    console.log('   ✅ 프론트엔드 (3000): 정상');
  } catch (e) {
    console.log('   ❌ 프론트엔드 (3000): 접속 불가');
  }
  
  try {
    await axios.get('http://localhost:8000/api/health/');
    console.log('   ✅ 백엔드 (8000): 정상');
  } catch (e) {
    console.log('   ❌ 백엔드 (8000): 접속 불가');
  }
  
  // 2. 백엔드 직접 로그인 테스트
  console.log('\n2. 백엔드 직접 로그인 테스트:');
  try {
    const response = await axios.post('http://localhost:8000/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    console.log('   ✅ 로그인 성공!');
    console.log('   사용자:', response.data.user);
    console.log('   닉네임:', response.data.nickname);
    console.log('   토큰:', response.data.vridge_session.substring(0, 50) + '...');
  } catch (e) {
    console.log('   ❌ 로그인 실패:', e.response?.data?.message || e.message);
  }
  
  // 3. 프론트엔드 프록시 테스트
  console.log('\n3. 프론트엔드 API 프록시 테스트:');
  try {
    const response = await axios.post('http://localhost:3000/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    }, {
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('   ✅ 프록시 성공!');
    console.log('   상태 코드:', response.status);
  } catch (e) {
    console.log('   ❌ 프록시 실패:', e.message);
    if (e.response) {
      console.log('   상태 코드:', e.response.status);
      console.log('   응답:', e.response.data);
    }
  }
  
  // 4. 사용 가능한 계정 정보
  console.log('\n4. 테스트 계정 정보:');
  console.log('   이메일: demo@test.com');
  console.log('   비밀번호: demo1234');
  console.log('\n5. 브라우저에서 테스트:');
  console.log('   1) http://localhost:3000/login 접속');
  console.log('   2) 위 계정으로 로그인');
  console.log('   또는');
  console.log('   1) http://localhost:3000/test-login 접속');
  console.log('   2) 테스트 페이지에서 로그인');
}

simpleLoginTest();