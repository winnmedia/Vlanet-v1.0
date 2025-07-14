const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function checkServiceStatus() {
  console.log('=== 서비스 상태 확인 ===\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/video-planning/debug/services/`, {
      headers: {
        'Origin': 'https://vlanet.net'
      }
    });
    
    const data = response.data;
    
    console.log('1. 환경변수 상태:');
    console.log(`   - Google API Key: ${data.services.google_api_key_exists ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`   - Hugging Face API Key: ${data.services.huggingface_api_key_exists ? '✅ 설정됨' : '❌ 미설정'}`);
    if (data.services.huggingface_api_key_exists) {
      console.log(`     (${data.services.huggingface_api_key_prefix})`);
    }
    
    console.log('\n2. 서비스 초기화 상태:');
    console.log(`   - Gemini Service: ${data.services.gemini_service === 'initialized' ? '✅' : '❌'} ${data.services.gemini_service}`);
    console.log(`   - Image Service Available: ${data.services.image_service_available ? '✅' : '❌'}`);
    console.log(`   - Placeholder Service: ${data.services.placeholder_service_available ? '✅' : '❌'}`);
    
    console.log('\n3. Stable Diffusion 상태:');
    const sd = data.services.stable_diffusion;
    if (sd.initialized) {
      console.log(`   - 초기화: ✅`);
      console.log(`   - 사용 가능: ${sd.available ? '✅' : '❌'}`);
      console.log(`   - 현재 모델: ${sd.current_model || 'N/A'}`);
    } else {
      console.log(`   - 초기화: ❌ (${sd.error})`);
    }
    
    console.log('\n4. 플레이스홀더 서비스:');
    const ph = data.services.placeholder;
    console.log(`   - 초기화: ${ph.initialized ? '✅' : '❌'}`);
    console.log(`   - 사용 가능: ${ph.available ? '✅' : '❌'}`);
    
    console.log('\n5. Django 설정:');
    console.log(`   - DEBUG: ${data.settings.debug}`);
    console.log(`   - Settings Module: ${data.settings.settings_module}`);
    
  } catch (error) {
    console.error('서비스 상태 확인 실패:', error.response?.data || error.message);
  }
}

checkServiceStatus();