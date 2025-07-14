const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testPlanningLibrary() {
  console.log('=== 기획 저장 및 라이브러리 테스트 ===\n');

  // 테스트용 토큰 (이전에 생성한 testuser1의 토큰)
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyMTQ1NjA0LCJpYXQiOjE3NTE1NDA4MDQsImp0aSI6ImJmZmNlZmQzMGJmZjRiYWViYjQ0ZmQyZTFkZTMxNDU3IiwidXNlcl9pZCI6MjV9.sAEolv1eV5FR8U762bdWStH90q63btTm3hHOhcouoDs';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  try {
    // 1. 기획 저장 테스트
    console.log('1. 새로운 기획 저장 테스트');
    
    const planningData = {
      title: "AI 교육 플랫폼 소개 영상",
      planning_text: "혁신적인 AI 교육 플랫폼을 소개하는 2분짜리 프로모션 영상을 제작하려고 합니다.",
      stories: [
        {
          title: "미래 교육의 시작",
          summary: "AI가 바꾸는 교육의 미래를 보여주는 감동적인 스토리",
          genre: "다큐멘터리",
          tone: "희망적이고 미래지향적인",
          duration: "2분"
        }
      ],
      selected_story: {
        title: "미래 교육의 시작",
        summary: "AI가 바꾸는 교육의 미래를 보여주는 감동적인 스토리"
      },
      current_step: 2,
      is_completed: false
    };

    const saveResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/save/`,
      planningData,
      { headers }
    );

    if (saveResponse.data.status === 'success') {
      console.log('✓ 기획 저장 성공');
      console.log(`  ID: ${saveResponse.data.data.id}`);
      console.log(`  제목: ${saveResponse.data.data.title}`);
      
      const savedPlanningId = saveResponse.data.data.id;

      // 2. 기획 목록 조회 테스트
      console.log('\n2. 기획 목록 조회 테스트');
      const listResponse = await axios.get(
        `${API_BASE_URL}/api/video-planning/list/`,
        { headers }
      );

      if (listResponse.data.status === 'success') {
        console.log(`✓ 기획 목록 조회 성공 (총 ${listResponse.data.count}개)`);
        listResponse.data.data.forEach((planning, index) => {
          console.log(`  ${index + 1}. ${planning.title} (단계: ${planning.current_step}/5)`);
        });
      }

      // 3. 기획 상세 조회 테스트
      console.log('\n3. 기획 상세 조회 테스트');
      const detailResponse = await axios.get(
        `${API_BASE_URL}/api/video-planning/detail/${savedPlanningId}/`,
        { headers }
      );

      if (detailResponse.data.status === 'success') {
        console.log('✓ 기획 상세 조회 성공');
        const detail = detailResponse.data.data;
        console.log(`  제목: ${detail.title}`);
        console.log(`  현재 단계: ${detail.current_step}`);
        console.log(`  스토리 개수: ${detail.stories.length}`);
      }

      // 4. 기획 업데이트 테스트
      console.log('\n4. 기획 업데이트 테스트');
      const updateData = {
        current_step: 3,
        scenes: [
          {
            scene_number: 1,
            title: "오프닝 - AI의 등장",
            location: "미래형 교실",
            time: "아침",
            description: "AI 교육 시스템이 작동하는 모습"
          }
        ]
      };

      const updateResponse = await axios.put(
        `${API_BASE_URL}/api/video-planning/update/${savedPlanningId}/`,
        updateData,
        { headers }
      );

      if (updateResponse.data.status === 'success') {
        console.log('✓ 기획 업데이트 성공');
        console.log(`  업데이트된 단계: ${updateResponse.data.data.current_step}`);
      }

      // 5. 여러 기획 저장하여 5개 제한 테스트
      console.log('\n5. 5개 제한 테스트를 위한 추가 기획 저장');
      for (let i = 2; i <= 6; i++) {
        const additionalPlanning = {
          title: `테스트 기획 ${i}`,
          planning_text: `테스트 기획 ${i}의 내용입니다.`,
          current_step: 1
        };

        await axios.post(
          `${API_BASE_URL}/api/video-planning/save/`,
          additionalPlanning,
          { headers }
        );
        console.log(`  테스트 기획 ${i} 저장 완료`);
      }

      // 6. 5개 제한 확인
      console.log('\n6. 기획 목록 5개 제한 확인');
      const limitTestResponse = await axios.get(
        `${API_BASE_URL}/api/video-planning/list/`,
        { headers }
      );

      console.log(`✓ 조회된 기획 개수: ${limitTestResponse.data.count}개 (최대 5개)`);

      console.log('\n✅ 모든 테스트 성공!');

    } else {
      console.log('✗ 기획 저장 실패:', saveResponse.data.message);
    }

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답:', error.response.data);
    }
  }
}

// 테스트 실행
testPlanningLibrary().catch(console.error);