1const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';
const TEST_TOKEN = process.argv[2];

if (!TEST_TOKEN) {
  console.error('❌ 사용법: node api-debug-test.js [JWT_TOKEN]');
  console.log('브라우저 개발자 도구에서 localStorage.getItem("VGID")로 토큰을 복사하세요.');
  process.exit(1);
}

// 토큰에서 따옴표 제거
const cleanToken = TEST_TOKEN.replace(/^"/, '').replace(/"$/, '');

console.log('🔍 API 디버깅 테스트 시작...\n');

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${cleanToken}`,
    'Content-Type': 'application/json'
  }
});

// 1. 사용자 정보 확인
async function testUserInfo() {
  console.log('1️⃣ 사용자 정보 테스트...');
  try {
    const response = await api.get('/api/users/info/');
    console.log('✅ 사용자 정보 조회 성공:');
    console.log('  - Email:', response.data.email);
    console.log('  - Nickname:', response.data.nickname);
    console.log('  - ID:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error.response?.data || error.message);
    return null;
  }
}

// 2. 프로젝트 목록 조회
async function testProjectList() {
  console.log('\n2️⃣ 프로젝트 목록 테스트...');
  try {
    const response = await api.get('/api/projects/project_list/');
    console.log('✅ 프로젝트 목록 조회 성공:');
    console.log('  - 총 프로젝트 수:', response.data.result?.length || 0);
    if (response.data.result?.length > 0) {
      console.log('  - 최근 프로젝트:', response.data.result[0].name);
    }
    return response.data.result;
  } catch (error) {
    console.error('❌ 프로젝트 목록 조회 실패:', error.response?.data || error.message);
    return [];
  }
}

// 3. 프로필 이미지 URL 테스트
async function testProfileImage() {
  console.log('\n3️⃣ 프로필 이미지 테스트...');
  try {
    const response = await api.get('/api/users/mypage/');
    const profileImage = response.data.data?.profile?.profile_image;
    
    if (profileImage) {
      console.log('✅ 프로필 이미지 URL:', profileImage);
      
      // 이미지 URL 접근 테스트
      let fullImageUrl = profileImage;
      if (profileImage.startsWith('/')) {
        fullImageUrl = `${API_BASE_URL}${profileImage}`;
      }
      
      console.log('  - 전체 URL:', fullImageUrl);
      
      try {
        const imgResponse = await axios.head(fullImageUrl);
        console.log('  - 이미지 접근 가능 ✅');
        console.log('  - Content-Type:', imgResponse.headers['content-type']);
      } catch (imgError) {
        console.error('  - 이미지 접근 불가 ❌:', imgError.response?.status || imgError.message);
      }
    } else {
      console.log('ℹ️ 프로필 이미지가 설정되지 않았습니다.');
    }
  } catch (error) {
    console.error('❌ 마이페이지 조회 실패:', error.response?.data || error.message);
  }
}

// 4. 프로젝트 생성 테스트
async function testProjectCreate() {
  console.log('\n4️⃣ 프로젝트 생성 API 테스트...');
  
  const testProject = {
    name: `테스트 프로젝트 ${Date.now()}`,
    manager: '테스트 매니저',
    consumer: '테스트 고객사',
    description: 'API 디버깅 테스트용 프로젝트',
    color: '#1631F8',
    process: []
  };
  
  try {
    console.log('  - 생성할 프로젝트:', testProject.name);
    const response = await api.post('/api/projects/create/', testProject);
    console.log('✅ 프로젝트 생성 성공:');
    console.log('  - ID:', response.data.project_id);
    console.log('  - Name:', response.data.project_name);
    
    // 생성 후 바로 목록 확인
    console.log('\n  프로젝트 목록 다시 확인...');
    const listResponse = await api.get('/api/projects/project_list/');
    const newProject = listResponse.data.result?.find(p => p.id === response.data.project_id);
    
    if (newProject) {
      console.log('  ✅ 새 프로젝트가 목록에 표시됨');
    } else {
      console.log('  ❌ 새 프로젝트가 목록에 나타나지 않음');
    }
    
    return response.data.project_id;
  } catch (error) {
    console.error('❌ 프로젝트 생성 실패:', error.response?.data || error.message);
    return null;
  }
}

// 5. JWT 디버그 정보
async function testJWTDebug() {
  console.log('\n5️⃣ JWT 디버그 정보...');
  try {
    const response = await api.get('/api/users/debug/jwt/');
    console.log('✅ JWT 디버그 정보:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('ℹ️ JWT 디버그 엔드포인트 없음 (정상)');
  }
}

// 메인 실행 함수
async function runTests() {
  const userInfo = await testUserInfo();
  if (!userInfo) {
    console.log('\n⚠️ 사용자 인증 실패. 토큰을 확인하세요.');
    return;
  }
  
  await testProjectList();
  await testProfileImage();
  await testProjectCreate();
  await testJWTDebug();
  
  console.log('\n✅ 모든 테스트 완료');
}

// 테스트 실행
runTests().catch(error => {
  console.error('\n❌ 예상치 못한 오류:', error);
});