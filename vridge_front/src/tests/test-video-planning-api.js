const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testVideoPlanningAPI() {
  console.log('=== 영상 기획 API 테스트 시작 ===\n');

  // 방금 생성한 테스트 사용자의 토큰 사용
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyMTQ1NjA0LCJpYXQiOjE3NTE1NDA4MDQsImp0aSI6ImJmZmNlZmQzMGJmZjRiYWViYjQ0ZmQyZTFkZTMxNDU3IiwidXNlcl9pZCI6MjV9.sAEolv1eV5FR8U762bdWStH90q63btTm3hHOhcouoDs';
  console.log('✓ 테스트 토큰 준비 완료');

  // 2. 스토리 생성 테스트
  console.log('\n2. 스토리 생성 API 테스트');
  const planningText = "신제품 런칭을 위한 프로모션 영상을 제작하려고 합니다. 혁신적인 기술과 사용자 경험을 강조하고 싶습니다.";
  
  try {
    console.log('기획안:', planningText);
    const response = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/story/`,
      { planning_text: planningText },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.status === 'success') {
      console.log('✓ 스토리 생성 성공');
      console.log('\n생성된 스토리들:');
      
      const stories = response.data.data.stories || [];
      stories.forEach((story, index) => {
        console.log(`\n스토리 ${index + 1}: ${story.title}`);
        console.log(`  요약: ${story.summary}`);
        console.log(`  장르: ${story.genre}`);
        console.log(`  톤: ${story.tone}`);
        console.log(`  예상 시간: ${story.duration}`);
        console.log(`  주요 장면:`, story.key_scenes?.join(', '));
      });
    } else {
      console.log('✗ 스토리 생성 실패:', response.data.message);
    }
  } catch (error) {
    console.log('✗ API 호출 실패:', error.response?.data?.message || error.message);
    if (error.response) {
      console.log('상태 코드:', error.response.status);
      console.log('응답 데이터:', error.response.data);
    }
  }

  console.log('\n=== 테스트 완료 ===');
}

// 테스트 실행
testVideoPlanningAPI().catch(console.error);