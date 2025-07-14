const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';
const FRONTEND_URL = 'https://vlanet.net';

// axios 기본 헤더 설정
axios.defaults.headers.common['Origin'] = FRONTEND_URL;

async function testStoryboardGeneration() {
  console.log('=== 스토리보드 이미지 생성 직접 테스트 ===\n');
  
  // 테스트 계정 정보
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testCredentials = {
    email: testEmail,
    nickname: `testuser${timestamp}`,
    password: 'TestPassword123!'
  };
  
  try {
    // 1. 회원가입
    console.log('1. 회원가입 중...');
    try {
      await axios.post(`${API_BASE_URL}/api/users/signup/`, testCredentials);
      console.log('✓ 회원가입 성공');
    } catch (e) {
      console.log('회원가입 실패, 로그인 시도...');
    }
    
    // 2. 로그인
    console.log('\n2. 로그인 중...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testCredentials.email,
      password: testCredentials.password
    });
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 로그인 성공\n');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // 3. 스토리보드 생성 테스트
    console.log('3. 스토리보드 생성 테스트');
    
    const testShot = {
      shot_data: {
        shot_number: 1,
        type: "와이드샷",
        description: "현대적인 사무실에서 AI 로봇과 사람이 협업하는 모습",
        visual_description: "밝고 깨끗한 사무실, 대형 모니터와 AI 로봇이 있는 공간",
        action: "사람과 로봇이 함께 프로젝트를 논의하는 장면",
        camera_angle: "아이레벨",
        movement: "고정",
        duration: "5초"
      }
    };
    
    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      testShot,
      { headers }
    );
    
    console.log('응답 상태:', storyboardResponse.data.status);
    
    if (storyboardResponse.data.status === 'success') {
      const storyboards = storyboardResponse.data.data.storyboards || [];
      
      console.log(`\n생성된 콘티 프레임 수: ${storyboards.length}`);
      
      storyboards.forEach((frame, index) => {
        console.log(`\n프레임 ${frame.frame_number}:`);
        console.log(`  제목: ${frame.title}`);
        console.log(`  시각적 설명: ${frame.visual_description}`);
        console.log(`  이미지 URL 존재: ${frame.image_url ? 'O' : 'X'}`);
        
        if (frame.image_url) {
          console.log(`  이미지 타입: ${frame.image_url.substring(0, 30)}...`);
          console.log(`  플레이스홀더: ${frame.is_placeholder ? 'O' : 'X'}`);
          console.log(`  사용된 모델: ${frame.model_used || 'N/A'}`);
        }
        
        if (frame.image_error) {
          console.log(`  이미지 생성 에러: ${frame.image_error}`);
        }
        
        if (frame.prompt_used) {
          console.log(`  사용된 프롬프트: ${frame.prompt_used.substring(0, 80)}...`);
        }
      });
      
      // 4. 이미지 재생성 테스트
      if (storyboards.length > 0) {
        console.log('\n\n4. 이미지 재생성 테스트');
        
        const frameToRegenerate = storyboards[0];
        const regenerateResponse = await axios.post(
          `${API_BASE_URL}/api/video-planning/regenerate/storyboard-image/`,
          { frame_data: frameToRegenerate },
          { headers }
        );
        
        console.log('재생성 응답 상태:', regenerateResponse.data.status);
        
        if (regenerateResponse.data.status === 'success') {
          console.log('✓ 이미지 재생성 성공');
          console.log(`  이미지 URL 존재: ${regenerateResponse.data.data.image_url ? 'O' : 'X'}`);
        } else {
          console.log('✗ 이미지 재생성 실패:', regenerateResponse.data.message);
        }
      }
    } else {
      console.log('✗ 스토리보드 생성 실패:', storyboardResponse.data.message);
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
testStoryboardGeneration();