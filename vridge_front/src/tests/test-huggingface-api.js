const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testHuggingFaceAPI() {
  console.log('=== Hugging Face API 테스트 ===\n');
  
  try {
    // 1. 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `hftest${timestamp}@example.com`,
      nickname: `hftest${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 이미지 재생성 엔드포인트 직접 테스트
    console.log('이미지 재생성 엔드포인트 테스트:');
    
    const testFrame = {
      frame_number: 1,
      title: 'Test Frame',
      visual_description: 'A simple modern office with people and robots working together',
      composition: 'Center composition',
      lighting: 'Natural light'
    };
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video-planning/regenerate/storyboard-image/`,
        { frame_data: testFrame },
        { 
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://vlanet.net'
          }
        }
      );
      
      console.log('응답 상태:', response.data.status);
      console.log('응답 메시지:', response.data.message || 'N/A');
      
      if (response.data.status === 'success') {
        console.log('✅ 이미지 생성 성공!');
        console.log('이미지 URL 타입:', response.data.data.image_url.substring(0, 30) + '...');
      } else {
        console.log('❌ 이미지 생성 실패');
      }
    } catch (error) {
      console.log('❌ API 호출 실패:', error.response?.data?.message || error.message);
    }
    
    // 3. 디버그 엔드포인트가 있는지 확인
    console.log('\n\n서비스 상태 확인:');
    try {
      const debugResponse = await axios.get(
        `${API_BASE_URL}/api/video-planning/debug/service-status/`,
        { 
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://vlanet.net'
          }
        }
      );
      console.log(debugResponse.data);
    } catch (error) {
      console.log('디버그 엔드포인트 없음');
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testHuggingFaceAPI();