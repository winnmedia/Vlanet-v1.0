const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function checkAPIKeyStatus() {
  console.log('=== API Key 상태 확인 ===\n');
  
  try {
    // 디버그 정보 확인
    const response = await axios.get(`${API_BASE_URL}/debug/`);
    const html = response.data;
    
    console.log('서버 상태: 연결됨');
    
    // 간단한 회원가입/로그인으로 테스트
    const timestamp = Date.now();
    const testUser = {
      email: `apitest${timestamp}@example.com`,
      nickname: `apitest${timestamp}`,
      password: 'TestPassword123!'
    };
    
    // 회원가입
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    
    // 로그인
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    
    // 스토리보드 생성 테스트
    console.log('\n스토리보드 생성 테스트 중...');
    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      {
        shot_data: {
          shot_number: 1,
          visual_description: "simple test scene",
          title: "Test Frame"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://vlanet.net'
        }
      }
    );
    
    console.log('\n응답:', JSON.stringify(storyboardResponse.data, null, 2));
    
    if (storyboardResponse.data.status === 'success') {
      const frames = storyboardResponse.data.data.storyboards || [];
      console.log(`\n프레임 수: ${frames.length}`);
      
      if (frames.length > 0) {
        const frame = frames[0];
        console.log('\n첫 번째 프레임 정보:');
        console.log(`- 이미지 URL 존재: ${!!frame.image_url}`);
        console.log(`- 플레이스홀더 여부: ${frame.is_placeholder || false}`);
        console.log(`- 모델: ${frame.model_used || 'N/A'}`);
        console.log(`- 에러: ${frame.image_error || 'N/A'}`);
        
        if (frame.image_url) {
          if (frame.is_placeholder) {
            console.log('\n⚠️  HUGGINGFACE_API_KEY가 설정되지 않았습니다.');
            console.log('플레이스홀더 이미지가 생성되었습니다.');
          } else {
            console.log('\n✅ HUGGINGFACE_API_KEY가 설정되어 있습니다!');
            console.log('실제 이미지 생성 성공');
          }
        } else {
          console.log('\n❌ 이미지 생성 실패');
        }
      }
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

checkAPIKeyStatus();