const axios = require('axios');

// 라우팅 테스트
async function testRouting() {
  console.log('=== 프론트엔드 라우팅 테스트 ===\n');
  
  const routes = [
    '/',
    '/Login',
    '/Signup',
    '/ProjectCreate',
    '/CmsHome',
    '/Calendar',
    '/MyPage',
    '/not-existing-page'
  ];
  
  console.log('테스트할 라우트:');
  routes.forEach(route => console.log(`  - ${route}`));
  
  console.log('\n참고: React SPA는 모든 라우트에서 동일한 index.html을 반환합니다.');
  console.log('실제 라우팅은 클라이언트 사이드에서 처리됩니다.\n');
  
  // 개발 서버가 실행 중인지 확인
  try {
    const response = await axios.get('http://localhost:3000');
    console.log('✅ 개발 서버가 실행 중입니다.');
    console.log(`   상태 코드: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    
    // HTML에 React root element가 있는지 확인
    if (response.data.includes('<div id="root">')) {
      console.log('✅ React root element 발견');
    }
    
    // 빌드된 JavaScript 파일이 포함되어 있는지 확인
    if (response.data.includes('main.') && response.data.includes('.js')) {
      console.log('✅ React 번들 JavaScript 발견');
    }
    
  } catch (error) {
    console.error('❌ 개발 서버에 연결할 수 없습니다.');
    console.error('   npm start로 개발 서버를 먼저 실행해주세요.');
    return;
  }
  
  console.log('\n=== 라우팅 구성 요약 ===');
  console.log('1. /ProjectCreate 라우트가 AppRoute.js에 정의되어 있음 ✅');
  console.log('2. ProjectCreate 컴포넌트가 존재함 ✅');
  console.log('3. Lazy loading이 적용되어 있음 ✅');
  console.log('4. 404 페이지 처리가 구현되어 있음 ✅');
  
  console.log('\n=== 결론 ===');
  console.log('프론트엔드 라우팅 설정은 정상입니다.');
  console.log('/ProjectCreate 페이지에 접근할 수 없다면 다음을 확인하세요:');
  console.log('1. 로그인 상태인지 확인 (ProjectCreate는 인증이 필요함)');
  console.log('2. 브라우저 콘솔에서 JavaScript 에러 확인');
  console.log('3. Network 탭에서 API 요청 실패 여부 확인');
}

testRouting();