const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testDebugPost() {
  console.log('=== 디버그 POST 테스트 (이미지 생성 포함) ===\n');
  
  try {
    // POST로 서비스 상태 및 테스트 실행
    const response = await axios.post(
      `${API_BASE_URL}/api/video-planning/debug/services/`,
      {},
      { 
        headers: { 
          'Origin': 'https://vlanet.net'
        }
      }
    );
    
    console.log('응답 받음:\n');
    
    // 서비스 상태
    const services = response.data.services;
    console.log('서비스 상태:');
    console.log(`- HuggingFace API 키: ${services.huggingface_api_key_exists ? '설정됨' : '미설정'}`);
    console.log(`- API 키 길이: ${services.huggingface_api_key_length}`);
    console.log(`- API 키 접두사: ${services.huggingface_api_key_prefix}`);
    
    // Stable Diffusion 상태
    if (services.stable_diffusion) {
      console.log('\nStable Diffusion:');
      console.log(`- 초기화: ${services.stable_diffusion.initialized ? '성공' : '실패'}`);
      console.log(`- 사용 가능: ${services.stable_diffusion.available ? '예' : '아니오'}`);
      console.log(`- 현재 모델: ${services.stable_diffusion.current_model}`);
    }
    
    // 테스트 결과
    if (services.test_result) {
      console.log('\n이미지 생성 테스트 결과:');
      const testResult = services.test_result.image_generation;
      
      if (testResult.success) {
        console.log('✅ 이미지 생성 성공!');
        console.log(`- 이미지 URL 타입: ${testResult.image_url ? testResult.image_url.substring(0, 30) + '...' : 'N/A'}`);
        console.log(`- 사용된 모델: ${testResult.model_used}`);
        console.log(`- 사용된 프롬프트: ${testResult.prompt_used}`);
      } else {
        console.log('❌ 이미지 생성 실패');
        console.log(`- 오류: ${testResult.error}`);
      }
      
      // API 헤더 정보
      if (services.test_result.api_headers) {
        console.log('\nAPI 헤더 정보:');
        console.log(`- Authorization 헤더 존재: ${services.test_result.api_headers.authorization_exists ? '예' : '아니오'}`);
        console.log(`- 헤더 형식: ${services.test_result.api_headers.auth_format || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testDebugPost();