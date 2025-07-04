const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testHealthAndDebug() {
  console.log('=== 서버 상태 확인 ===\n');
  
  try {
    // 1. Health check
    console.log('1. Health Check:');
    const healthResponse = await axios.get(`${API_BASE_URL}/health/`);
    console.log('✓ Status:', healthResponse.data);
    
    // 2. Debug info
    console.log('\n2. Debug Info:');
    const debugResponse = await axios.get(`${API_BASE_URL}/debug/`);
    const debugHtml = debugResponse.data;
    
    // HTML에서 정보 추출
    if (debugHtml.includes('DJANGO_SETTINGS_MODULE')) {
      const settingsMatch = debugHtml.match(/Django Settings: ([^<]+)/);
      if (settingsMatch) {
        console.log('✓ Django Settings:', settingsMatch[1]);
      }
    }
    
    // 3. API root
    console.log('\n3. API Root:');
    const apiResponse = await axios.get(`${API_BASE_URL}/api/`);
    console.log('✓ API:', apiResponse.data);
    
    // 4. 환경변수 확인을 위한 특별 엔드포인트 생성 테스트
    console.log('\n4. 배포 상태:');
    console.log('✓ 서버가 정상적으로 실행 중입니다.');
    console.log('\n환경변수 설정 필요:');
    console.log('- HUGGINGFACE_API_KEY: Hugging Face API 토큰');
    console.log('- GOOGLE_API_KEY: Google Gemini API 키');
    
  } catch (error) {
    console.error('에러:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

testHealthAndDebug();