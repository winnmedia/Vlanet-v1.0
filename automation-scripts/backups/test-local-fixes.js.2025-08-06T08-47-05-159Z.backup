/**
 * 로컬 환경에서 수정사항 테스트
 */

const axios = require('axios');

const API_URL = 'http://localhost:8002';
let authToken = '';

async function testLocalFixes() {
  console.log('🧪 로컬 환경 수정사항 테스트');
  console.log('='.repeat(60));
  
  try {
    // 1. 로그인
    console.log('\n1. 로그인 테스트');
    const loginResponse = await axios.post(`${API_URL}/api/users/login/`, {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    
    authToken = loginResponse.data.token || loginResponse.data.access || loginResponse.data.vridge_session;
    console.log('✅ 로그인 성공');
    
    // 2. 최근 기획 조회 (color_tone 문제 확인)
    console.log('\n2. 최근 기획 조회 (color_tone 문제 수정 확인)');
    try {
      const recentResponse = await axios.get(`${API_URL}/api/video-planning/recent/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ 최근 기획 조회 성공:', recentResponse.data.data.planning_logs.length + '개');
    } catch (error) {
      console.log('❌ 최근 기획 조회 실패:', error.response?.data?.message || error.message);
    }
    
    // 3. 스토리보드 생성 (no_image 옵션 테스트)
    console.log('\n3. 스토리보드 생성 (no_image 옵션 테스트)');
    const startTime = Date.now();
    try {
      const storyboardResponse = await axios.post(`${API_URL}/api/video-planning/generate/storyboards/`, {
        shot_data: {
          shot_number: 1,
          shot_type: "Wide Shot",
          description: "카페 전경",
          duration: "3초"
        },
        style: 'minimal',
        no_image: true  // 이미지 생성 스킵
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ 스토리보드 생성 성공 (${duration}ms)`);
      
      const storyboards = storyboardResponse.data.data.storyboards;
      if (storyboards && storyboards[0]) {
        console.log('   - image_url:', storyboards[0].image_url || 'null');
        console.log('   - image_note:', storyboards[0].image_note || 'none');
      }
    } catch (error) {
      console.log('❌ 스토리보드 생성 실패:', error.response?.data?.message || error.message);
    }
    
    // 4. 대용량 데이터 저장
    console.log('\n4. 대용량 데이터 저장 테스트');
    try {
      const saveResponse = await axios.post(`${API_URL}/api/video-planning/save/`, {
        title: '대용량 테스트',
        planning_text: '테스트 기획',
        planning_data: {
          scenes: Array(10).fill({ scene_number: 1, description: '테스트 씬' }),
          shots: Array(20).fill({ shot_number: 1, description: '테스트 샷' })
        }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ 대용량 데이터 저장 성공');
    } catch (error) {
      console.log('❌ 대용량 데이터 저장 실패:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message);
  }
  
  console.log('\n✨ 테스트 완료!');
}

// 실행
testLocalFixes().catch(console.error);