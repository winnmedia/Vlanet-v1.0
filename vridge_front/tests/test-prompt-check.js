const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testPromptGeneration() {
  console.log('=== 콘티 프롬프트 생성 테스트 ===\n');
  
  try {
    // 1. 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `prompt${timestamp}@example.com`,
      nickname: `prompt${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 테스트용 샷 데이터
    const testShots = [
      {
        shot_number: 1,
        type: "와이드샷",
        description: "미래의 사무실 전경",
        visual_description: "현대적인 사무실 공간. 큰 창문으로 도시 전경이 보이고, AI 로봇과 사람들이 함께 일하고 있다.",
        camera_angle: "하이앵글",
        movement: "고정",
        duration: "5초"
      },
      {
        shot_number: 2,
        type: "클로즈업",
        description: "AI 로봇의 얼굴",
        visual_description: "친근한 표정의 흰색 휴머노이드 로봇. 파란색 LED 눈이 부드럽게 빛나고 있다.",
        camera_angle: "아이레벨",
        movement: "슬로우 줌인",
        duration: "3초"
      },
      {
        shot_number: 3,
        type: "미디엄샷",
        description: "협업 장면",
        visual_description: "사람과 로봇이 함께 홀로그램 디스플레이를 보며 프로젝트를 논의하는 모습",
        camera_angle: "아이레벨",
        movement: "트래킹",
        duration: "7초"
      }
    ];
    
    // 3. 각 샷에 대해 스토리보드 생성
    for (const shot of testShots) {
      console.log(`\n샷 ${shot.shot_number}: ${shot.description}`);
      console.log(`시각적 설명: ${shot.visual_description}`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
          { shot_data: shot },
          { 
            headers: { 
              'Authorization': `Bearer ${authToken}`,
              'Origin': 'https://vlanet.net'
            }
          }
        );
        
        if (response.data.status === 'success') {
          const frames = response.data.data.storyboards || [];
          
          frames.forEach((frame, idx) => {
            console.log(`\n  프레임 ${idx + 1}:`);
            if (frame.prompt_used) {
              console.log(`  사용된 프롬프트:\n  "${frame.prompt_used}"`);
            }
            console.log(`  이미지 생성: ${frame.image_url ? '성공' : '실패'}`);
            console.log(`  모델: ${frame.model_used || 'N/A'}`);
            console.log(`  플레이스홀더: ${frame.is_placeholder ? '예' : '아니오'}`);
          });
        } else {
          console.log(`  ❌ 생성 실패: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`  ❌ 오류: ${error.response?.data?.message || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testPromptGeneration();