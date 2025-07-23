const http = require('http');
const fs = require('fs').promises;

// 테스트할 페이지 목록
const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'CMS Home', path: '/cmshome' },
  { name: 'Project Create', path: '/project/create' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Admin', path: '/admin' },
  { name: 'Video Planning', path: '/videoplanning' },
  { name: 'My Page', path: '/mypage' },
  { name: 'Feedback All', path: '/feedbackall' }
];

// HTTP 요청 함수
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        resolve({
          path,
          statusCode: res.statusCode,
          loadTime,
          contentLength: data.length,
          headers: res.headers,
          hasHtml: data.includes('<html') || data.includes('<!DOCTYPE'),
          hasNextData: data.includes('__NEXT_DATA__'),
          title: extractTitle(data),
          error: null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        statusCode: 0,
        loadTime: 0,
        contentLength: 0,
        headers: {},
        hasHtml: false,
        hasNextData: false,
        title: '',
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        path,
        statusCode: 0,
        loadTime: 0,
        contentLength: 0,
        headers: {},
        hasHtml: false,
        hasNextData: false,
        title: '',
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// HTML에서 title 추출
function extractTitle(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1] : '';
}

// 모든 페이지 테스트
async function testAllPages() {
  console.log('🚀 Next.js 페이지 테스트 시작...\n');
  
  const results = [];
  const timestamp = new Date().toISOString();
  
  // 서버 연결 테스트
  console.log('서버 연결 테스트 중...');
  const serverTest = await makeRequest('/');
  
  if (serverTest.error) {
    console.error('❌ 서버 연결 실패:', serverTest.error);
    console.log('\n서버가 실행 중인지 확인하세요:');
    console.log('cd /home/winnmedia/VideoPlanet/vridge-front-next && npm run dev');
    return;
  }
  
  console.log('✅ 서버 연결 성공\n');
  
  // 각 페이지 테스트
  for (const page of pages) {
    console.log(`테스트 중: ${page.name} (${page.path})`);
    const result = await makeRequest(page.path);
    
    results.push({
      ...page,
      ...result,
      timestamp
    });
    
    // 결과 출력
    if (result.error) {
      console.log(`  ❌ 에러: ${result.error}`);
    } else {
      const status = result.statusCode === 200 ? '✅' : '⚠️';
      console.log(`  ${status} 상태: ${result.statusCode}`);
      console.log(`  ⏱️  로딩 시간: ${result.loadTime}ms`);
      console.log(`  📄 콘텐츠 크기: ${(result.contentLength / 1024).toFixed(2)}KB`);
      if (result.title) {
        console.log(`  📌 페이지 제목: ${result.title}`);
      }
    }
    console.log('');
    
    // 요청 간 간격
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 결과 요약
  console.log('\n📊 테스트 결과 요약');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.statusCode === 200).length;
  const failCount = results.filter(r => r.statusCode !== 200).length;
  const avgLoadTime = results
    .filter(r => r.statusCode === 200)
    .reduce((sum, r) => sum + r.loadTime, 0) / successCount || 0;
  
  console.log(`✅ 성공: ${successCount}/${pages.length}`);
  console.log(`❌ 실패: ${failCount}/${pages.length}`);
  console.log(`⏱️  평균 로딩 시간: ${avgLoadTime.toFixed(2)}ms`);
  
  // 문제가 있는 페이지
  const problemPages = results.filter(r => r.statusCode !== 200);
  if (problemPages.length > 0) {
    console.log('\n⚠️  문제가 있는 페이지:');
    problemPages.forEach(page => {
      console.log(`  - ${page.name} (${page.path}): ${page.statusCode || page.error}`);
    });
  }
  
  // Next.js 특성 확인
  const nextPages = results.filter(r => r.hasNextData);
  console.log(`\n🔧 Next.js 페이지: ${nextPages.length}/${successCount}`);
  
  // 결과 저장
  const reportData = {
    testDate: timestamp,
    serverUrl: 'http://localhost:3002',
    summary: {
      totalPages: pages.length,
      successCount,
      failCount,
      averageLoadTime: avgLoadTime,
      fastestPage: results
        .filter(r => r.statusCode === 200)
        .sort((a, b) => a.loadTime - b.loadTime)[0],
      slowestPage: results
        .filter(r => r.statusCode === 200)
        .sort((a, b) => b.loadTime - a.loadTime)[0]
    },
    pages: results
  };
  
  const fileName = `test-results-${Date.now()}.json`;
  await fs.writeFile(fileName, JSON.stringify(reportData, null, 2));
  console.log(`\n💾 테스트 결과 저장됨: ${fileName}`);
  
  // 권장사항
  console.log('\n📋 권장사항:');
  if (failCount > 0) {
    console.log('  1. 실패한 페이지의 라우팅 설정 확인');
    console.log('  2. 페이지 컴포넌트의 에러 확인');
    console.log('  3. 필요한 데이터나 API 연결 확인');
  }
  
  if (avgLoadTime > 1000) {
    console.log('  - 페이지 로딩 시간이 길므로 성능 최적화 고려');
  }
  
  const largePages = results.filter(r => r.contentLength > 500 * 1024);
  if (largePages.length > 0) {
    console.log('  - 일부 페이지의 크기가 크므로 코드 분할 고려');
  }
}

// 테스트 실행
testAllPages().catch(console.error);