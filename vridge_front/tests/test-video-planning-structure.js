const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';
let authToken = '';

async function login() {
  console.log('=== 로그인 중 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
      username: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    authToken = response.data.access;
    console.log('✅ 로그인 성공');
    return true;
  } catch (error) {
    console.error('❌ 로그인 실패:', error.response?.data || error.message);
    return false;
  }
}

async function testVideoPlanning() {
  console.log('\n=== 영상 기획 구조 테스트 ===');
  console.log('목표: 1개 기획 → 4개 스토리(기승전결) → 12개 씬 → 36개 숏 → 12개 콘티\n');

  const planningText = "환경 보호를 주제로 한 공익 광고 영상을 제작하려고 합니다. 지구 온난화와 환경 오염의 심각성을 알리고, 일상에서 실천할 수 있는 작은 행동들이 큰 변화를 만들 수 있다는 메시지를 전달하고 싶습니다.";

  try {
    // 1. 스토리 생성 (기승전결 4개)
    console.log('1. 스토리 생성 중...');
    const storiesResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: planningText },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const stories = storiesResponse.data.data.stories;
    console.log(`✅ 스토리 ${stories.length}개 생성됨`);
    
    if (stories.length !== 4) {
      console.warn(`⚠️  기승전결 4개가 아닌 ${stories.length}개가 생성됨`);
    }

    stories.forEach((story, idx) => {
      console.log(`  - ${story.stage || `스토리${idx+1}`}: ${story.title} (${story.stage_name || ''})`);
    });

    // 2. 각 스토리에서 씬 생성 (총 12개)
    console.log('\n2. 씬 생성 중...');
    let allScenes = [];
    
    for (let i = 0; i < stories.length; i++) {
      const scenesResponse = await axios.post(
        `${API_BASE_URL}/api/video-planning/generate/scenes/`,
        { story_data: stories[i] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const scenes = scenesResponse.data.data.scenes;
      allScenes = allScenes.concat(scenes);
      console.log(`  스토리 ${i+1} → ${scenes.length}개 씬 생성`);
    }
    
    console.log(`✅ 총 ${allScenes.length}개 씬 생성됨`);
    
    if (allScenes.length !== 12) {
      console.warn(`⚠️  목표 12개가 아닌 ${allScenes.length}개가 생성됨`);
    }

    // 3. 각 씬에서 숏 생성 (총 36개)
    console.log('\n3. 숏 생성 중...');
    let allShots = [];
    
    for (let i = 0; i < Math.min(allScenes.length, 12); i++) {
      const shotsResponse = await axios.post(
        `${API_BASE_URL}/api/video-planning/generate/shots/`,
        { scene_data: allScenes[i] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const shots = shotsResponse.data.data.shots;
      allShots = allShots.concat(shots);
      console.log(`  씬 ${i+1} → ${shots.length}개 숏 생성`);
    }
    
    console.log(`✅ 총 ${allShots.length}개 숏 생성됨`);
    
    if (allShots.length !== 36) {
      console.warn(`⚠️  목표 36개가 아닌 ${allShots.length}개가 생성됨`);
    }

    // 4. 12개 씬에 대한 콘티 생성
    console.log('\n4. 콘티 생성 중 (12개 씬 기준)...');
    let storyboardCount = 0;
    
    // 각 씬의 첫 번째 숏으로 콘티 생성
    for (let i = 0; i < Math.min(allScenes.length, 12); i++) {
      const sceneShots = allShots.filter((shot, idx) => 
        Math.floor(idx / 3) === i  // 3개씩 묶어서 씬 인덱스 계산
      );
      
      if (sceneShots.length > 0) {
        const storyboardResponse = await axios.post(
          `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
          { shot_data: sceneShots[0] },  // 각 씬의 대표 숏
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const storyboards = storyboardResponse.data.data.storyboards;
        storyboardCount += storyboards.length;
        console.log(`  씬 ${i+1} → ${storyboards.length}개 콘티 생성`);
      }
    }
    
    console.log(`✅ 총 ${storyboardCount}개 콘티 생성됨`);

    // 결과 요약
    console.log('\n=== 최종 결과 요약 ===');
    console.log(`기획: 1개`);
    console.log(`스토리: ${stories.length}개 (목표: 4개)`);
    console.log(`씬: ${allScenes.length}개 (목표: 12개)`);
    console.log(`숏: ${allShots.length}개 (목표: 36개)`);
    console.log(`콘티: ${storyboardCount}개 (목표: 12개)`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
async function runTest() {
  if (await login()) {
    await testVideoPlanning();
  }
}

runTest();