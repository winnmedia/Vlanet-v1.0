const axios = require('axios');

const API_BASE_URL = 'https://videoplanet.up.railway.app';

console.log('🔍 백엔드 헬스체크 시작...\n');

async function checkEndpoint(path, description) {
  try {
    const response = await axios.get(`${API_BASE_URL}${path}`);
    console.log(`✅ ${description}: ${response.status} - ${response.statusText}`);
    return true;
  } catch (error) {
    console.error(`❌ ${description}: ${error.response?.status || 'Network Error'} - ${error.response?.statusText || error.message}`);
    if (error.response?.data) {
      console.error(`   에러 내용: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runHealthChecks() {
  // 기본 헬스체크
  await checkEndpoint('/api/health/', '기본 헬스체크');
  await checkEndpoint('/health/', '레거시 헬스체크');
  
  console.log('\n📝 인증이 필요 없는 엔드포인트:');
  await checkEndpoint('/api/users/csrf-token/', 'CSRF 토큰');
  
  console.log('\n🔐 인증이 필요한 엔드포인트 (401 에러가 정상):');
  await checkEndpoint('/api/projects/project_list/', '프로젝트 리스트');
  await checkEndpoint('/api/users/info/', '사용자 정보');
  await checkEndpoint('/api/users/mypage/', '마이페이지');
  
  console.log('\n✅ 헬스체크 완료');
}

runHealthChecks().catch(error => {
  console.error('\n❌ 예상치 못한 오류:', error);
});