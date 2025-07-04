const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testRealImageGeneration() {
  console.log('=== 실제 AI 이미지 생성 테스트 ===\n');
  
  try {
    // 1. 로그인
    const timestamp = Date.now();
    const testUser = {
      email: `realimage${timestamp}@example.com`,
      nickname: `realimage${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 간단한 프롬프트로 이미지 생성 테스트
    console.log('이미지 생성 테스트 시작...\n');
    
    const testFrames = [
      {
        frame_number: 1,
        title: 'Modern Office',
        visual_description: 'A bright modern office with large windows and city view',
        composition: 'Wide shot',
        lighting: 'Natural daylight'
      },
      {
        frame_number: 2,
        title: 'AI Robot',
        visual_description: 'A friendly white humanoid robot with blue eyes',
        composition: 'Medium shot',
        lighting: 'Soft indoor lighting'
      }
    ];
    
    for (const frame of testFrames) {
      console.log(`테스트 ${frame.frame_number}: ${frame.title}`);
      console.log(`설명: ${frame.visual_description}`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/video-planning/regenerate/storyboard-image/`,
          { frame_data: frame },
          { 
            headers: { 
              'Authorization': `Bearer ${authToken}`,
              'Origin': 'https://vlanet.net'
            },
            timeout: 30000 // 30초 타임아웃
          }
        );
        
        if (response.data.status === 'success') {
          const imageUrl = response.data.data.image_url;
          console.log(`✅ 성공!`);
          console.log(`   - URL 타입: ${imageUrl.substring(0, 30)}...`);
          console.log(`   - URL 길이: ${imageUrl.length} 문자`);
          
          // 실제 URL인지 base64인지 확인
          if (imageUrl.startsWith('http')) {
            console.log(`   - 실제 이미지 URL: ${imageUrl}`);
          } else if (imageUrl.startsWith('data:image')) {
            console.log(`   - Base64 이미지 (플레이스홀더일 가능성)`);
          }
        } else {
          console.log(`❌ 실패: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ 오류: ${error.response?.data?.message || error.message}`);
      }
      
      console.log('');
    }
    
    // 3. 전체 스토리보드 생성 플로우
    console.log('\n전체 스토리보드 생성 플로우 테스트:');
    
    const shotData = {
      shot_number: 1,
      type: "와이드샷",
      description: "AI와 사람이 함께 일하는 미래의 사무실",
      camera_angle: "아이레벨",
      movement: "고정",
      duration: "5초"
    };
    
    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      { shot_data: shotData },
      { 
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://vlanet.net'
        }
      }
    );
    
    if (storyboardResponse.data.status === 'success') {
      const frames = storyboardResponse.data.data.storyboards || [];
      console.log(`\n생성된 프레임 수: ${frames.length}`);
      
      frames.forEach((frame, idx) => {
        console.log(`\n프레임 ${idx + 1}:`);
        console.log(`- 제목: ${frame.title}`);
        console.log(`- 이미지 URL: ${frame.image_url ? '있음' : '없음'}`);
        if (frame.image_url) {
          const isRealImage = frame.image_url.startsWith('http');
          const isPlaceholder = frame.is_placeholder || frame.image_url.startsWith('data:image');
          console.log(`- 이미지 타입: ${isRealImage ? '실제 AI 이미지 🎨' : '플레이스홀더 📝'}`);
          if (frame.model_used) {
            console.log(`- 사용된 모델: ${frame.model_used}`);
          }
          if (isRealImage) {
            console.log(`- 🎉 실제 AI 이미지 URL: ${frame.image_url}`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testRealImageGeneration();