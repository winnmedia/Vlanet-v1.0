const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function createTestUser() {
  console.log('=== 테스트 사용자 생성 ===\n');

  // 회원가입 테스트
  console.log('회원가입 시도...');
  try {
    const signupResponse = await axios.post(`${API_BASE_URL}/users/signup`, {
      username: 'testuser1',
      password: 'Test@User2024!',
      password_confirm: 'Test@User2024!',
      email: 'testuser1@example.com',
      nickname: 'TestUser1'
    });
    
    console.log('✓ 회원가입 성공:', signupResponse.data);
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.username) {
      console.log('! 이미 존재하는 사용자입니다. 로그인을 시도합니다.');
    } else {
      console.log('✗ 회원가입 실패:', error.response?.data || error.message);
      return;
    }
  }

  // 로그인 테스트
  console.log('\n로그인 시도...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
      username: 'testuser1',
      password: 'Test@User2024!'
    });
    
    if (loginResponse.data.access) {
      console.log('✓ 로그인 성공');
      console.log('Access Token:', loginResponse.data.access.substring(0, 20) + '...');
      return loginResponse.data.access;
    }
  } catch (error) {
    console.log('✗ 로그인 실패:', error.response?.data?.message || error.message);
  }
}

// 실행
createTestUser().catch(console.error);