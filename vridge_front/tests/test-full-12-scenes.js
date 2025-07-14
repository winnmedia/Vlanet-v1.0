const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';
let authToken = '';

async function login() {
  console.log('=== 로그인 중 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
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

async function testFullSceneGeneration() {
  console.log('\n=== 전체 12개 씬 자동 생성 테스트 ===\n');

  const planningText = "청소년들을 위한 진로 탐색 다큐멘터리를 제작하려고 합니다. 다양한 직업군의 전문가들을 인터뷰하고, 실제 직업 체험을 통해 청소년들이 자신의 꿈을 찾아가는 과정을 담고자 합니다.";

  try {
    // 1. 스토리 생성 (기승전결)
    console.log('1. 기승전결 스토리 생성 중...');
    const storiesResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: planningText },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const stories = storiesResponse.data.data.stories;
    console.log(`\n✅ ${stories.length}개 스토리 생성 완료:\n`);
    
    stories.forEach((story, idx) => {
      console.log(`[${story.stage}] ${story.stage_name} - "${story.title}"`);
      console.log(`   핵심: ${story.key_content}`);
      console.log(`   요약: ${story.summary}`);
      console.log('');
    });

    // 2. 모든 스토리에 대해 씬 생성 (프론트엔드 로직과 동일)
    console.log('2. 전체 씬 생성 중...');
    let allScenes = [];
    
    for (let i = 0; i < stories.length; i++) {
      console.log(`   - ${stories[i].stage} 스토리의 씬 생성 중...`);
      
      const scenesResponse = await axios.post(
        `${API_BASE_URL}/api/video-planning/generate/scenes/`,
        { story_data: stories[i] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const scenes = scenesResponse.data.data.scenes;
      
      // 각 씬에 스토리 정보 추가
      const scenesWithStoryInfo = scenes.map(scene => ({
        ...scene,
        story_stage: stories[i].stage,
        story_stage_name: stories[i].stage_name,
        story_title: stories[i].title
      }));
      
      allScenes = [...allScenes, ...scenesWithStoryInfo];
      console.log(`     → ${scenes.length}개 씬 생성됨`);
    }
    
    console.log(`\n✅ 총 ${allScenes.length}개 씬 생성 완료\n`);

    // 3. 생성된 씬 상세 정보 출력
    console.log('=== 생성된 12개 씬 상세 정보 ===\n');
    allScenes.forEach((scene, idx) => {
      console.log(`씬 ${idx + 1} [${scene.story_stage}-${scene.story_stage_name}]`);
      console.log(`  장소: ${scene.location}`);
      console.log(`  시간: ${scene.time || scene.time_of_day}`);
      console.log(`  액션: ${scene.action}`);
      if (scene.dialogue) console.log(`  대사: ${scene.dialogue}`);
      if (scene.purpose) console.log(`  목적: ${scene.purpose}`);
      console.log('');
    });

    // 4. 결과 검증
    console.log('=== 검증 결과 ===');
    console.log(`✅ 기승전결 스토리: ${stories.length}개 (목표: 4개)`);
    console.log(`✅ 총 씬 개수: ${allScenes.length}개 (목표: 12개)`);
    
    // 각 스토리별 씬 개수 확인
    const scenesByStage = {};
    allScenes.forEach(scene => {
      const stage = scene.story_stage;
      scenesByStage[stage] = (scenesByStage[stage] || 0) + 1;
    });
    
    console.log('\n각 스토리별 씬 개수:');
    Object.entries(scenesByStage).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count}개 씬`);
    });

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
async function runTest() {
  if (await login()) {
    await testFullSceneGeneration();
  }
}

runTest();