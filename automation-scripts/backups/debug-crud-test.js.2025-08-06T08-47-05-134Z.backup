const axios = require('axios');

const API_URL = 'https://videoplanet.up.railway.app';
let authToken = '';

async function debugCRUD() {
  console.log('🔍 CRUD 디버깅 테스트 시작\n');
  
  // 1. 로그인
  try {
    const loginResponse = await axios.post(`${API_URL}/api/users/login/`, {
      email: 'test_videoplan@example.com',
      password: 'testpass123!'
    });
    
    authToken = loginResponse.data.vridge_session || 
                loginResponse.data.access || 
                loginResponse.data.token;
    console.log('✅ 로그인 성공\n');
  } catch (error) {
    console.error('❌ 로그인 실패:', error.response?.data || error.message);
    return;
  }
  
  // 2. 영상 기획 생성 테스트
  console.log('📝 영상 기획 생성 테스트');
  console.log('요청 데이터:');
  const testData = {
    title: '테스트 영상 기획',
    planning_text: '두 친구의 우정과 성장을 다룬 5분짜리 감성 드라마.',
    planning_options: {
      genre: '드라마',
      target_audience: '20-30대',
      tone_manner: '감성적',
      duration: '5분'
    },
    stories: [],
    scenes: [],
    shots: [],
    storyboards: [],
    current_step: 1,
    is_completed: false
  };
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    const saveResponse = await axios.post(
      `${API_URL}/api/video-planning/save/`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('\n✅ 생성 성공:', saveResponse.data);
  } catch (error) {
    console.error('\n❌ 생성 실패:');
    console.error('상태 코드:', error.response?.status);
    console.error('에러 데이터:', error.response?.data);
    console.error('에러 메시지:', error.message);
  }
  
  // 3. 목록 조회 테스트
  console.log('\n\n📋 영상 기획 목록 조회 테스트');
  try {
    const listResponse = await axios.get(
      `${API_URL}/api/video-planning/list/`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ 목록 조회 성공:');
    console.log('전체 개수:', listResponse.data.count || listResponse.data.length);
    console.log('첫 번째 항목:', listResponse.data.results?.[0] || listResponse.data[0]);
  } catch (error) {
    console.error('\n❌ 목록 조회 실패:');
    console.error('상태 코드:', error.response?.status);
    console.error('에러 데이터:', error.response?.data);
  }
  
  // 4. 라이브러리 조회 테스트
  console.log('\n\n📚 영상 기획 라이브러리 조회 테스트');
  try {
    const libraryResponse = await axios.get(
      `${API_URL}/api/video-planning/library/`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ 라이브러리 조회 성공:');
    console.log('응답 데이터:', JSON.stringify(libraryResponse.data, null, 2));
  } catch (error) {
    console.error('\n❌ 라이브러리 조회 실패:');
    console.error('상태 코드:', error.response?.status);
    console.error('에러 데이터:', error.response?.data);
  }
}

debugCRUD();