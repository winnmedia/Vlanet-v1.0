const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testDalleService() {
  console.log('=== DALL-E 서비스 테스트 ===\n');
  
  try {
    // 1. 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `dalle${timestamp}@example.com`,
      nickname: `dalle${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 서비스 상태 확인
    console.log('서비스 상태 확인 중...');
    try {
      const statusResponse = await axios.get(
        `${API_BASE_URL}/api/video-planning/debug/services/`,
        { 
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Origin': 'https://vlanet.net'
          }
        }
      );
      
      const services = statusResponse.data.services;
      console.log('\n현재 설정:');
      console.log(`- OpenAI API 키: ${services.openai_api_key_exists ? '설정됨' : '미설정'}`);
      console.log(`- DALL-E 서비스: ${services.dalle ? (services.dalle.available ? '사용 가능' : '사용 불가') : '초기화 실패'}`);
      
      if (!services.openai_api_key_exists) {
        console.log('\n⚠️  OpenAI API 키가 설정되지 않았습니다.');
        console.log('Railway에서 OPENAI_API_KEY 환경변수를 설정해주세요.');
        return;
      }
    } catch (e) {
      console.log('서비스 상태 확인 실패');
    }
    
    // 3. 스토리보드 생성 테스트
    console.log('\n\n스토리보드 생성 테스트:');
    
    const shotData = {
      shot_number: 1,
      type: "와이드샷",
      description: "미래의 사무실에서 AI와 사람이 함께 일하는 모습",
      visual_description: "밝고 현대적인 사무실, 로봇과 사람이 협업",
      camera_angle: "아이레벨",
      movement: "고정",
      duration: "5초"
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      { shot_data: shotData },
      { 
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://vlanet.net'
        }
      }
    );
    
    if (response.data.status === 'success') {
      const frames = response.data.data.storyboards || [];
      console.log(`\n생성된 프레임 수: ${frames.length}`);
      
      frames.forEach((frame, idx) => {
        console.log(`\n프레임 ${idx + 1}:`);
        console.log(`- 제목: ${frame.title}`);
        console.log(`- 이미지 URL: ${frame.image_url ? '있음' : '없음'}`);
        
        if (frame.image_url) {
          const isBase64 = frame.image_url.startsWith('data:image');
          const isPlaceholder = frame.is_placeholder === true;
          
          if (!isPlaceholder && frame.model_used === 'dall-e-3') {
            console.log(`- ✨ DALL-E 3 이미지 생성 성공!`);
            console.log(`- 모델: ${frame.model_used}`);
            console.log(`- 프롬프트: ${frame.prompt_used ? frame.prompt_used.substring(0, 80) + '...' : 'N/A'}`);
          } else if (isPlaceholder) {
            console.log(`- 📝 플레이스홀더 이미지 (DALL-E 사용 불가)`);
          } else {
            console.log(`- 이미지 타입: ${isBase64 ? 'Base64' : 'URL'}`);
            console.log(`- 모델: ${frame.model_used || 'N/A'}`);
          }
        }
      });
    } else {
      console.log('스토리보드 생성 실패:', response.data.message);
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testDalleService();