const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testStoryboardImageGeneration() {
  console.log('=== 스토리보드 이미지 생성 테스트 ===\n');
  console.log('주의: Hugging Face API 키가 설정되어 있어야 합니다.\n');

  // 테스트용 토큰
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyMTQ1NjA0LCJpYXQiOjE3NTE1NDA4MDQsImp0aSI6ImJmZmNlZmQzMGJmZjRiYWViYjQ0ZmQyZTFkZTMxNDU3IiwidXNlcl9pZCI6MjV9.sAEolv1eV5FR8U762bdWStH90q63btTm3hHOhcouoDs';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  try {
    // 1. 간단한 스토리와 씬으로 테스트
    console.log('1. 스토리보드 생성 테스트');
    
    const testShot = {
      shot_number: 1,
      type: "와이드샷",
      description: "현대적인 사무실에서 AI 로봇과 사람이 협업하는 모습",
      camera_angle: "아이레벨",
      movement: "고정",
      duration: "5초",
      audio: "잔잔한 배경음악"
    };

    const storyboardResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      { shot_data: testShot },
      { headers }
    );

    if (storyboardResponse.data.status === 'success') {
      console.log('✓ 스토리보드 생성 성공');
      const storyboards = storyboardResponse.data.data.storyboards || [];
      
      console.log(`\n생성된 콘티 프레임 수: ${storyboards.length}`);
      
      storyboards.forEach((frame, index) => {
        console.log(`\n프레임 ${frame.frame_number}:`);
        console.log(`  제목: ${frame.title}`);
        console.log(`  이미지 URL: ${frame.image_url || '이미지 생성 실패'}`);
        if (frame.image_error) {
          console.log(`  에러: ${frame.image_error}`);
        }
        if (frame.prompt_used) {
          console.log(`  사용된 프롬프트: ${frame.prompt_used.substring(0, 100)}...`);
        }
      });

      // 2. 이미지 재생성 테스트
      if (storyboards.length > 0) {
        console.log('\n2. 이미지 재생성 테스트');
        
        const frameToRegenerate = storyboards[0];
        const regenerateResponse = await axios.post(
          `${API_BASE_URL}/api/video-planning/regenerate/storyboard-image/`,
          { frame_data: frameToRegenerate },
          { headers }
        );

        if (regenerateResponse.data.status === 'success') {
          console.log('✓ 이미지 재생성 성공');
          console.log(`  새 이미지 URL: ${regenerateResponse.data.data.image_url}`);
        } else {
          console.log('✗ 이미지 재생성 실패:', regenerateResponse.data.message);
        }
      }

      // 3. 전체 플로우와 함께 저장 테스트
      console.log('\n3. 전체 기획과 함께 저장 테스트');
      
      const fullPlanningData = {
        title: "AI 협업 시스템 소개",
        planning_text: "AI와 인간이 협업하는 미래를 보여주는 영상",
        stories: [{
          title: "협업의 미래",
          summary: "AI와 인간의 조화로운 협업",
          genre: "다큐멘터리",
          tone: "미래지향적"
        }],
        selected_story: {
          title: "협업의 미래"
        },
        storyboards: storyboards,
        current_step: 5,
        is_completed: true
      };

      const saveResponse = await axios.post(
        `${API_BASE_URL}/api/video-planning/save/`,
        fullPlanningData,
        { headers }
      );

      if (saveResponse.data.status === 'success') {
        console.log('✓ 전체 기획 저장 성공');
        console.log(`  저장된 이미지 수: ${saveResponse.data.data.images.length}`);
      }

    } else {
      console.log('✗ 스토리보드 생성 실패:', storyboardResponse.data.message);
    }

    console.log('\n✅ 테스트 완료!');
    console.log('\n참고: 이미지 생성이 실패한 경우 HUGGINGFACE_API_KEY 설정을 확인하세요.');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답:', error.response.data);
    }
  }
}

// 테스트 실행
testStoryboardImageGeneration().catch(console.error);