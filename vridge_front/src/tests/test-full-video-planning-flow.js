const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testFullVideoPlanningFlow() {
  console.log('=== 영상 기획 전체 플로우 테스트 ===\n');

  // 테스트용 토큰 (이전에 생성한 testuser1의 토큰)
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyMTQ1NjA0LCJpYXQiOjE3NTE1NDA4MDQsImp0aSI6ImJmZmNlZmQzMGJmZjRiYWViYjQ0ZmQyZTFkZTMxNDU3IiwidXNlcl9pZCI6MjV9.sAEolv1eV5FR8U762bdWStH90q63btTm3hHOhcouoDs';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  try {
    // 1단계: 기획안 → 스토리 생성
    console.log('1단계: 기획안에서 스토리 생성');
    const planningText = "스타트업의 성장 과정을 담은 다큐멘터리 영상을 제작하려고 합니다. 도전과 극복의 스토리를 감동적으로 전달하고 싶습니다.";
    
    const storyResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: planningText },
      { headers }
    );

    if (storyResponse.data.status !== 'success') {
      throw new Error('스토리 생성 실패');
    }

    const stories = storyResponse.data.data.stories || [];
    console.log(`✓ ${stories.length}개의 스토리 생성 완료`);
    
    // 첫 번째 스토리 선택
    const selectedStory = stories[0];
    console.log(`\n선택된 스토리: ${selectedStory.title}`);
    console.log(`장르: ${selectedStory.genre}, 톤: ${selectedStory.tone}`);

    // 2단계: 스토리 → 씬 생성
    console.log('\n2단계: 스토리에서 씬 생성');
    const sceneResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/scenes/`,
      { story_data: selectedStory },
      { headers }
    );

    if (sceneResponse.data.status !== 'success') {
      throw new Error('씬 생성 실패');
    }

    const scenes = sceneResponse.data.data.scenes || [];
    console.log(`✓ ${scenes.length}개의 씬 생성 완료`);
    
    // 첫 번째 씬 선택
    const selectedScene = scenes[0];
    console.log(`\n선택된 씬: ${selectedScene.title}`);
    console.log(`장소: ${selectedScene.location}, 시간: ${selectedScene.time}`);

    // 3단계: 씬 → 숏 생성
    console.log('\n3단계: 씬에서 숏 생성');
    const shotResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/shots/`,
      { story_data: selectedScene }, // 씬 데이터를 story_data로 전달
      { headers }
    );

    if (shotResponse.data.status !== 'success') {
      throw new Error('숏 생성 실패');
    }

    const shots = shotResponse.data.data.shots || [];
    console.log(`✓ ${shots.length}개의 숏 생성 완료`);
    
    // 첫 번째 숏 선택
    const selectedShot = shots[0];
    console.log(`\n선택된 숏: ${selectedShot.type}`);
    console.log(`설명: ${selectedShot.description}`);

    // 4단계: 숏 → 콘티 생성
    console.log('\n4단계: 숏에서 콘티(스토리보드) 생성');
    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      { shot_data: selectedShot },
      { headers }
    );

    if (storyboardResponse.data.status !== 'success') {
      throw new Error('콘티 생성 실패');
    }

    const storyboards = storyboardResponse.data.data.storyboards || [];
    console.log(`✓ ${storyboards.length}개의 콘티 프레임 생성 완료`);
    
    // 콘티 상세 정보 출력
    console.log('\n=== 생성된 콘티 정보 ===');
    storyboards.forEach((frame, index) => {
      console.log(`\n프레임 ${frame.frame_number}: ${frame.title}`);
      console.log(`  시각적 설명: ${frame.visual_description}`);
      console.log(`  구도: ${frame.composition}`);
      console.log(`  카메라: ${frame.camera_info.angle} / ${frame.camera_info.movement}`);
      console.log(`  조명: ${frame.lighting}`);
      if (frame.audio.dialogue) {
        console.log(`  대사: "${frame.audio.dialogue}"`);
      }
      console.log(`  지속시간: ${frame.duration}`);
    });

    console.log('\n✅ 전체 플로우 테스트 성공!');
    console.log('\n=== 요약 ===');
    console.log(`기획안 → ${stories.length}개 스토리 → ${scenes.length}개 씬 → ${shots.length}개 숏 → ${storyboards.length}개 콘티 프레임`);

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답:', error.response.data);
    }
  }
}

// 테스트 실행
testFullVideoPlanningFlow().catch(console.error);