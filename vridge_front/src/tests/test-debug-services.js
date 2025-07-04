const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testDebugServices() {
  console.log('=== 서비스 상태 디버그 테스트 ===\n');
  
  try {
    // 1. 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `debug${timestamp}@example.com`,
      nickname: `debug${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 디버그 서비스 상태 확인
    console.log('서비스 상태 확인:');
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video-planning/debug/services/`,
        { 
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://vlanet.net'
          }
        }
      );
      
      console.log('\n응답:', JSON.stringify(response.data, null, 2));
      
      if (response.data.services) {
        const services = response.data.services;
        console.log('\n서비스별 상태:');
        console.log(`- Gemini API: ${services.gemini ? '✅' : '❌'}`);
        console.log(`- Stable Diffusion: ${services.stable_diffusion ? '✅' : '❌'}`);
        console.log(`- Placeholder Service: ${services.placeholder ? '✅' : '❌'}`);
        
        if (services.huggingface_key_exists !== undefined) {
          console.log(`\nHuggingFace API 키: ${services.huggingface_key_exists ? '설정됨' : '미설정'}`);
        }
        
        if (services.google_key_exists !== undefined) {
          console.log(`Google API 키: ${services.google_key_exists ? '설정됨' : '미설정'}`);
        }
      }
      
    } catch (error) {
      console.log('디버그 응답 오류:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testDebugServices();