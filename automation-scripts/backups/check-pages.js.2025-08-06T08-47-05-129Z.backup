const axios = require('axios');

async function checkPages() {
  const baseUrl = 'http://localhost:3002';
  const pages = [
    { path: '/videoplanning', name: '영상 기획' },
    { path: '/feedback/123', name: '영상 피드백' },
    { path: '/cmshome', name: 'CMS 홈' },
    { path: '/project/create', name: '프로젝트 생성' },
    { path: '/test-pages', name: '테스트 페이지' }
  ];
  
  console.log('🔍 페이지 상태 확인\n');
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${baseUrl}${page.path}`, {
        validateStatus: () => true,
        timeout: 5000
      });
      
      const status = response.status;
      const hasError = response.data.includes('Error') || response.data.includes('error');
      
      if (status === 200 && !hasError) {
        console.log(`✅ ${page.name}: 정상 (${status})`);
      } else if (status === 200 && hasError) {
        console.log(`⚠️  ${page.name}: 에러 포함 (${status})`);
        // 에러 메시지 추출
        const errorMatch = response.data.match(/Error:.*?(?=<|$)/);
        if (errorMatch) {
          console.log(`   에러: ${errorMatch[0]}`);
        }
      } else {
        console.log(`❌ ${page.name}: 실패 (${status})`);
      }
    } catch (error) {
      console.log(`❌ ${page.name}: 접속 실패 - ${error.message}`);
    }
  }
  
  // Next.js 빌드 로그 확인
  console.log('\n📊 Next.js 콘솔 로그를 확인하세요.');
}

checkPages();