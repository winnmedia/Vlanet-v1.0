const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testSimpleImageGeneration() {
  console.log('=== 간단한 이미지 생성 테스트 ===\n');
  
  try {
    // 1. 빠른 회원가입/로그인
    const timestamp = Date.now();
    const testUser = {
      email: `imgtest${timestamp}@example.com`,
      nickname: `imgtest${timestamp}`,
      password: 'TestPassword123!'
    };
    
    console.log('1. 인증 중...');
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 매우 간단한 프레임 데이터로 테스트
    console.log('2. 이미지 재생성 API 직접 호출...');
    
    const simpleFrame = {
      frame_data: {
        frame_number: 1,
        title: 'Simple Test',
        visual_description: 'robot and human',
        action: 'working together'
      }
    };
    
    try {
      const imageResponse = await axios.post(
        `${API_BASE_URL}/api/video-planning/regenerate/storyboard-image/`,
        simpleFrame,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://vlanet.net',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('\n응답:', JSON.stringify(imageResponse.data, null, 2));
      
      if (imageResponse.data.status === 'success') {
        const data = imageResponse.data.data;
        console.log('\n✅ 이미지 생성 성공!');
        console.log(`- 이미지 URL 길이: ${data.image_url ? data.image_url.length : 0}`);
        console.log(`- 이미지 타입: ${data.image_url ? data.image_url.substring(0, 30) : 'N/A'}`);
      } else {
        console.log('\n❌ 이미지 생성 실패');
        console.log('메시지:', imageResponse.data.message);
      }
      
    } catch (error) {
      console.log('\n❌ API 호출 실패');
      console.log('에러:', error.response?.data || error.message);
      
      if (error.response?.status === 503) {
        console.log('\n💡 503 오류는 다음을 의미할 수 있습니다:');
        console.log('1. HUGGINGFACE_API_KEY가 설정되지 않음');
        console.log('2. 모델이 아직 로딩 중');
        console.log('3. API 할당량 초과');
      }
    }
    
    // 3. Railway 재시작 확인
    console.log('\n3. 환경변수 설정 후 체크리스트:');
    console.log('✓ Railway Variables에서 HUGGINGFACE_API_KEY 확인');
    console.log('✓ 자동 재배포가 완료되었는지 확인 (2-3분 소요)');
    console.log('✓ Railway 로그에서 "Stable Diffusion service initialized" 메시지 확인');
    
  } catch (error) {
    console.error('테스트 실패:', error.message);
  }
}

testSimpleImageGeneration();