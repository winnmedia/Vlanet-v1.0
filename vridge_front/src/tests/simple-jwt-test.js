/**
 * 간단한 JWT 인증 테스트
 */

const axios = require('axios');

async function testJWT() {
  console.log('JWT 인증 테스트 시작...\n');
  
  // 1. 로그인
  console.log('1. 로그인 테스트');
  try {
    const loginResponse = await axios.post('http://localhost:8001/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    
    console.log('✅ 로그인 성공');
    console.log('응답:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.vridge_session;
    console.log(`\n토큰: ${token}\n`);
    
    // 2. 토큰으로 인증 테스트
    console.log('2. JWT 토큰 인증 테스트');
    
    // 방법 1: Authorization 헤더
    try {
      const meResponse = await axios.get('http://localhost:8001/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Authorization 헤더로 인증 성공!');
      console.log('사용자 정보:', JSON.stringify(meResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Authorization 헤더 인증 실패:', error.response?.data || error.message);
    }
    
    // 방법 2: 쿠키로 인증
    console.log('\n3. 쿠키 인증 테스트');
    try {
      const meResponse2 = await axios.get('http://localhost:8001/api/users/me/', {
        headers: {
          'Cookie': `vridge_session=${token}`
        }
      });
      console.log('✅ 쿠키로 인증 성공!');
      console.log('사용자 정보:', JSON.stringify(meResponse2.data, null, 2));
    } catch (error) {
      console.log('❌ 쿠키 인증 실패:', error.response?.data || error.message);
    }
    
    // 방법 3: 둘 다 사용
    console.log('\n4. Authorization 헤더 + 쿠키 인증 테스트');
    try {
      const meResponse3 = await axios.get('http://localhost:8001/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `vridge_session=${token}`
        }
      });
      console.log('✅ 헤더 + 쿠키로 인증 성공!');
      console.log('사용자 정보:', JSON.stringify(meResponse3.data, null, 2));
    } catch (error) {
      console.log('❌ 헤더 + 쿠키 인증 실패:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ 로그인 실패:', error.response?.data || error.message);
  }
}

// 실행
testJWT().catch(console.error);