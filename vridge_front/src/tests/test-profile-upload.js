const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

// 로그인 후 받은 토큰 (실제 테스트 시 유효한 토큰으로 교체 필요)
let AUTH_TOKEN = '';

async function createTestUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/signup/`, {
      email: 'profiletest@example.com',
      password: 'Test@9876!',
      nickname: 'ProfileTester'
    });
    
    console.log('✅ 테스트 사용자 생성 성공');
    return true;
  } catch (error) {
    if (error.response?.data?.message?.includes('이미 존재하는 이메일') || 
        error.response?.data?.message?.includes('이미 가입되어 있는 이메일')) {
      console.log('ℹ️ 테스트 사용자가 이미 존재합니다');
      return true;
    }
    console.error('❌ 테스트 사용자 생성 실패:', error.response?.data || error.message);
    return false;
  }
}

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: 'profiletest@example.com',
      password: 'Test@9876!'
    });
    
    console.log('로그인 응답:', response.data);
    
    if (response.data.access || response.data.token || response.data.vridge_session) {
      AUTH_TOKEN = response.data.access || response.data.token || response.data.vridge_session;
      console.log('✅ 로그인 성공');
      return true;
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error.response?.data || error.message);
    return false;
  }
}

async function testMyPageAPI() {
  console.log('\n=== 마이페이지 API 테스트 ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/mypage/`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('✅ 마이페이지 조회 성공:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 마이페이지 조회 실패:', error.response?.data || error.message);
    return false;
  }
}

async function testProfileImageUpload() {
  console.log('\n=== 프로필 이미지 업로드 테스트 ===');
  
  try {
    // 테스트 이미지 생성 (1x1 픽셀 PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');
    
    const formData = new FormData();
    formData.append('profile_image', buffer, {
      filename: 'test-profile.png',
      contentType: 'image/png',
    });
    
    const response = await axios.post(`${API_BASE_URL}/api/users/profile/upload-image/`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('✅ 프로필 이미지 업로드 성공:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 프로필 이미지 업로드 실패:', error.response?.data || error.message);
    return false;
  }
}

async function testProfileUpdate() {
  console.log('\n=== 프로필 정보 업데이트 테스트 ===');
  
  try {
    const profileData = {
      nickname: '테스트닉네임',
      bio: '안녕하세요, 테스트 사용자입니다.',
      phone: '010-1234-5678',
      company: '테스트 회사',
      position: '개발자'
    };
    
    const response = await axios.patch(`${API_BASE_URL}/api/users/profile/update/`, profileData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 프로필 업데이트 성공:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 프로필 업데이트 실패:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 프로필 업로드 기능 테스트 시작...\n');
  
  // 0. 테스트 사용자 생성
  const userCreated = await createTestUser();
  if (!userCreated) {
    console.log('\n❌ 테스트 사용자 생성 실패로 테스트 중단');
    return;
  }
  
  // 1. 로그인
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ 로그인 실패로 테스트 중단');
    return;
  }
  
  // 2. 마이페이지 API 테스트
  await testMyPageAPI();
  
  // 3. 프로필 이미지 업로드 테스트
  await testProfileImageUpload();
  
  // 4. 프로필 정보 업데이트 테스트
  await testProfileUpdate();
  
  // 5. 업데이트 후 마이페이지 다시 조회
  console.log('\n=== 업데이트 후 마이페이지 재조회 ===');
  await testMyPageAPI();
  
  console.log('\n✅ 모든 테스트 완료!');
}

// 테스트 실행
runTests();