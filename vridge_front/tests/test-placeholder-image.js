const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function testPlaceholderImage() {
  console.log('=== 플레이스홀더 이미지 테스트 ===\n');
  
  try {
    // 1. 인증
    const timestamp = Date.now();
    const testUser = {
      email: `placeholder${timestamp}@example.com`,
      nickname: `placeholder${timestamp}`,
      password: 'TestPassword123!'
    };
    
    await axios.post(`${API_BASE_URL}/api/users/signup/`, testUser);
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const authToken = loginResponse.data.vridge_session;
    console.log('✓ 인증 완료\n');
    
    // 2. 스토리에서 스토리보드까지 전체 플로우
    console.log('전체 플로우 테스트:');
    
    // 스토리 생성
    const storyResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: 'AI와 인간이 협업하는 미래 사무실' },
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Origin': 'https://vlanet.net' } }
    );
    
    console.log('1. 스토리 생성: ✓');
    
    // 씬 생성
    const sceneResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/scenes/`,
      { story_data: storyResponse.data.data },
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Origin': 'https://vlanet.net' } }
    );
    
    console.log('2. 씬 생성: ✓');
    
    // 숏 생성
    const shotResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/shots/`,
      { scene_data: sceneResponse.data.data.scenes[0] },
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Origin': 'https://vlanet.net' } }
    );
    
    console.log('3. 숏 생성: ✓');
    
    // 스토리보드 생성
    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      { shot_data: shotResponse.data.data.shots[0] },
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Origin': 'https://vlanet.net' } }
    );
    
    console.log('4. 스토리보드 생성: ✓\n');
    
    const frames = storyboardResponse.data.data.storyboards || [];
    console.log(`생성된 프레임 수: ${frames.length}`);
    
    if (frames.length > 0) {
      const frame = frames[0];
      console.log('\n첫 번째 프레임:');
      console.log(`- 제목: ${frame.title}`);
      console.log(`- 이미지 URL: ${frame.image_url ? '있음' : '없음'}`);
      console.log(`- 플레이스홀더: ${frame.is_placeholder ? '예' : '아니오'}`);
      
      if (frame.image_url) {
        console.log(`- URL 타입: ${frame.image_url.substring(0, 30)}...`);
        console.log(`- URL 길이: ${frame.image_url.length} 문자`);
        
        if (frame.is_placeholder) {
          console.log('\n✅ 플레이스홀더 이미지가 성공적으로 생성되었습니다!');
        } else {
          console.log('\n✅ 실제 AI 이미지가 생성되었습니다!');
          console.log(`사용된 모델: ${frame.model_used || 'N/A'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testPlaceholderImage();