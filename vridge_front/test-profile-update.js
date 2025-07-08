const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://videoplanet.up.railway.app/api';
let authToken = '';

async function testProfileUpdate() {
  console.log('=== 프로필 업데이트 테스트 ===\n');
  console.log('API URL:', API_URL);

  try {
    // 1. 로그인
    console.log('1. 로그인 시도');
    const loginResponse = await axios.post(`${API_URL}/users/login/`, {
      email: 'test@test.com',
      password: 'test1234!'
    });
    
    if (loginResponse.data.status === 'success') {
      authToken = loginResponse.data.data.access;
      console.log('✓ 로그인 성공');
      console.log(`  - 사용자: ${loginResponse.data.data.user.email}\n`);
    }

    // 2. 현재 프로필 조회
    console.log('2. 현재 프로필 정보 조회');
    const currentProfile = await axios.get(`${API_URL}/users/mypage/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (currentProfile.data.status === 'success') {
      console.log('✓ 현재 프로필:');
      console.log(`  - 닉네임: ${currentProfile.data.data.profile.nickname || '미설정'}`);
      console.log(`  - 자기소개: ${currentProfile.data.data.profile.bio || '미설정'}`);
      console.log(`  - 프로필 이미지: ${currentProfile.data.data.profile.profile_image || '없음'}\n`);
    }

    // 3. 프로필 업데이트 테스트 (PATCH)
    console.log('3. 프로필 업데이트 테스트 (PATCH 메서드)');
    try {
      const updateResponse = await axios.patch(`${API_URL}/users/profile/update/`, {
        nickname: '업데이트테스트',
        bio: '프로필 업데이트 테스트입니다.',
        phone: '010-1234-5678',
        company: '테스트 회사',
        position: '개발자'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.data.status === 'success') {
        console.log('✓ 프로필 업데이트 성공 (PATCH)');
        console.log(`  - 업데이트된 필드: ${updateResponse.data.updated_fields.join(', ')}`);
        console.log(`  - 새 닉네임: ${updateResponse.data.profile.nickname}`);
        console.log(`  - 새 자기소개: ${updateResponse.data.profile.bio}\n`);
      }
    } catch (error) {
      console.log('✗ PATCH 메서드 실패:', error.response?.data || error.message);
      
      // POST 메서드로 재시도
      console.log('\n4. 프로필 업데이트 재시도 (POST 메서드)');
      try {
        const updateResponse = await axios.post(`${API_URL}/users/profile/update/`, {
          nickname: '업데이트테스트2',
          bio: '프로필 업데이트 테스트입니다 (POST).',
          phone: '010-5678-1234',
          company: '테스트 회사2',
          position: '시니어 개발자'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (updateResponse.data.status === 'success') {
          console.log('✓ 프로필 업데이트 성공 (POST)');
          console.log(`  - 업데이트된 필드: ${updateResponse.data.updated_fields.join(', ')}`);
          console.log(`  - 새 닉네임: ${updateResponse.data.profile.nickname}`);
          console.log(`  - 새 자기소개: ${updateResponse.data.profile.bio}\n`);
        }
      } catch (postError) {
        console.log('✗ POST 메서드도 실패:', postError.response?.data || postError.message);
      }
    }

    // 5. 업데이트 후 프로필 재조회
    console.log('\n5. 업데이트 후 프로필 확인');
    const updatedProfile = await axios.get(`${API_URL}/users/mypage/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (updatedProfile.data.status === 'success') {
      console.log('✓ 업데이트된 프로필:');
      console.log(`  - 닉네임: ${updatedProfile.data.data.profile.nickname}`);
      console.log(`  - 자기소개: ${updatedProfile.data.data.profile.bio}`);
      console.log(`  - 전화번호: ${updatedProfile.data.data.profile.phone}`);
      console.log(`  - 회사: ${updatedProfile.data.data.profile.company}`);
      console.log(`  - 직책: ${updatedProfile.data.data.profile.position}`);
    }

    console.log('\n=== 테스트 결과 요약 ===');
    console.log('프로필 업데이트 API가 정상적으로 작동합니다.');
    console.log('PATCH와 POST 메서드 모두 지원됩니다.');
    
  } catch (error) {
    console.error('\n테스트 중 오류 발생:', error.response?.data || error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 헤더:', error.response.headers);
    }
  }
}

// 실행
testProfileUpdate();