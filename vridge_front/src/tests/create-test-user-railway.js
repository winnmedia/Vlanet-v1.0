/**
 * Railway에 테스트 사용자 생성
 */

const axios = require('axios');

const API_URL = 'https://videoplanet.up.railway.app';

async function createTestUser() {
  try {
    // 회원가입 시도
    const signupData = {
      username: 'test_videoplan@example.com',
      email: 'test_videoplan@example.com',
      nickname: '영상기획테스터',
      password: 'testpass123!',
      password_confirm: 'testpass123!'
    };
    
    console.log('🔐 테스트 사용자 생성 시도...');
    
    try {
      const signupResponse = await axios.post(`${API_URL}/api/users/signup/`, signupData);
      console.log('✅ 회원가입 성공:', signupResponse.data);
    } catch (error) {
      if (error.response?.data?.message?.includes('이미 사용중')) {
        console.log('ℹ️  사용자가 이미 존재합니다. 로그인 시도...');
      } else {
        console.log('❌ 회원가입 실패:', error.response?.data);
      }
    }
    
    // 로그인 테스트
    const loginResponse = await axios.post(`${API_URL}/api/users/login/`, {
      email: 'test_videoplan@example.com',
      password: 'testpass123!'
    });
    
    console.log('✅ 로그인 성공!');
    console.log('토큰:', loginResponse.data.vridge_session || loginResponse.data.token);
    
    return {
      email: 'test_videoplan@example.com',
      password: 'testpass123!',
      token: loginResponse.data.vridge_session || loginResponse.data.token
    };
    
  } catch (error) {
    console.error('❌ 오류:', error.response?.data || error.message);
    return null;
  }
}

createTestUser().then(result => {
  if (result) {
    console.log('\n📝 테스트에서 사용할 계정 정보:');
    console.log(`이메일: ${result.email}`);
    console.log(`비밀번호: ${result.password}`);
  }
});