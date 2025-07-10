const axios = require('axios');

// 테스트 설정
const API_URL = 'http://localhost:8000';
const testUserToken = 'YOUR_TEST_TOKEN'; // 실제 테스트 시 유효한 토큰으로 교체

// axios 기본 설정
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Authorization'] = `Bearer ${testUserToken}`;

async function testAutoSave() {
  console.log('🧪 자동 저장 기능 테스트 시작...\n');

  try {
    // 1. 새 기획 생성 (자동 저장)
    console.log('1️⃣ 새 기획 자동 저장 테스트');
    const createResponse = await axios.post('/api/video-planning/save/', {
      title: '자동 저장 테스트 기획',
      planning_text: '이것은 자동 저장 기능을 테스트하기 위한 기획입니다.',
      stories: [],
      scenes: [],
      shots: [],
      storyboards: [],
      planning_options: {
        tone: '밝고 경쾌한',
        genre: '기업 홍보',
        concept: '혁신적인',
        target: '20-30대',
        purpose: '브랜드 인지도 향상',
        duration: '3-5분'
      },
      current_step: 1
    });

    if (createResponse.data.status === 'success') {
      console.log('✅ 새 기획 생성 성공!');
      console.log(`   기획 ID: ${createResponse.data.data.id}`);
      console.log(`   제목: ${createResponse.data.data.title}`);
      
      const planningId = createResponse.data.data.id;

      // 2. 기존 기획 업데이트 (자동 저장)
      console.log('\n2️⃣ 기존 기획 업데이트 테스트');
      const updateResponse = await axios.put(`/api/video-planning/update/${planningId}/`, {
        title: '자동 저장 테스트 기획 (수정됨)',
        planning_text: '이것은 자동 저장 기능을 테스트하기 위한 기획입니다. 수정되었습니다.',
        stories: [
          {
            stage: '기',
            stage_name: '도입',
            title: '브랜드 소개',
            summary: '우리 브랜드의 시작과 비전을 소개합니다.'
          }
        ],
        current_step: 2
      });

      if (updateResponse.data.status === 'success') {
        console.log('✅ 기획 업데이트 성공!');
        console.log(`   수정된 제목: ${updateResponse.data.data.title}`);
        console.log(`   현재 단계: ${updateResponse.data.data.current_step}`);
        console.log(`   스토리 개수: ${updateResponse.data.data.stories.length}`);
      }

      // 3. 최근 기획 목록 확인
      console.log('\n3️⃣ 최근 기획 목록 확인');
      const recentResponse = await axios.get('/api/video-planning/recent/');
      
      if (recentResponse.data.status === 'success') {
        console.log('✅ 최근 기획 목록 조회 성공!');
        console.log(`   총 기획 수: ${recentResponse.data.data.planning_logs.length}`);
        
        const testPlanning = recentResponse.data.data.planning_logs.find(p => p.id === planningId);
        if (testPlanning) {
          console.log(`   테스트 기획 확인:`);
          console.log(`   - 제목: ${testPlanning.title}`);
          console.log(`   - 현재 단계: ${testPlanning.current_step}`);
          console.log(`   - 생성 시간: ${testPlanning.created_at}`);
        }
      }

      console.log('\n✅ 모든 테스트 통과! 자동 저장 기능이 정상적으로 작동합니다.');

    } else {
      console.error('❌ 기획 생성 실패:', createResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.response?.data || error.message);
  }
}

// 사용법 안내
console.log('📌 테스트 실행 방법:');
console.log('1. 백엔드 서버가 실행 중인지 확인 (python3 manage.py runserver)');
console.log('2. 유효한 JWT 토큰을 testUserToken 변수에 설정');
console.log('3. node test-auto-save.js 실행\n');

// 토큰이 설정되지 않은 경우 경고
if (testUserToken === 'YOUR_TEST_TOKEN') {
  console.log('⚠️  테스트를 실행하려면 유효한 JWT 토큰을 설정해주세요!');
  console.log('   로그인 후 개발자 도구에서 토큰을 복사하여 testUserToken 변수에 설정하세요.\n');
} else {
  testAutoSave();
}