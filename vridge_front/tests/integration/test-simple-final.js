const http = require('http');
const https = require('https');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';

// 테스트 결과 저장용
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  pages: [],
  summary: ''
};

// 페이지별 테스트 정의
const pagesToTest = [
  { path: '/', name: '홈페이지', expectedStatus: 200 },
  { path: '/login', name: '로그인', expectedStatus: 200 },
  { path: '/signup', name: '회원가입', expectedStatus: 200 },
  { path: '/cms/projects', name: '프로젝트 목록', expectedStatus: 200 },
  { path: '/cms/project-create', name: '프로젝트 생성', expectedStatus: 200 },
  { path: '/video-planning', name: '영상 기획', expectedStatus: 200 },
  { path: '/my-page/profile', name: '마이페이지', expectedStatus: 200 },
  { path: '/admin', name: '관리자 대시보드', expectedStatus: 200 },
  { path: '/video-analysis', name: '영상 분석', expectedStatus: 200 }
];

// HTTP 요청 헬퍼 함수
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          loadTime: Date.now() - startTime
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// HTML 내용 분석 함수
function analyzeHTML(html, pageName) {
  const analysis = {
    hasTitle: false,
    title: '',
    hasLogo: false,
    hasNavigation: false,
    hasButtons: false,
    buttonCount: 0,
    hasForm: false,
    formCount: 0,
    hasErrors: false,
    errors: []
  };

  // 타이틀 확인
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    analysis.hasTitle = true;
    analysis.title = titleMatch[1];
  }

  // 로고 확인
  if (html.includes('logo') || html.includes('Logo')) {
    analysis.hasLogo = true;
  }

  // 네비게이션 확인
  if (html.includes('<nav') || html.includes('navigation') || html.includes('menu')) {
    analysis.hasNavigation = true;
  }

  // 버튼 확인
  const buttonMatches = html.match(/<button/gi) || [];
  analysis.hasButtons = buttonMatches.length > 0;
  analysis.buttonCount = buttonMatches.length;

  // 폼 확인
  const formMatches = html.match(/<form/gi) || [];
  analysis.hasForm = formMatches.length > 0;
  analysis.formCount = formMatches.length;

  // 에러 메시지 확인
  if (html.includes('error') || html.includes('Error') || html.includes('에러')) {
    analysis.hasErrors = true;
    
    // Next.js 특정 에러 패턴 확인
    if (html.includes('404') || html.includes('Page not found')) {
      analysis.errors.push('404 페이지');
    }
    if (html.includes('500') || html.includes('Internal Server Error')) {
      analysis.errors.push('500 서버 에러');
    }
  }

  return analysis;
}

async function runTest() {
  console.log('🚀 Next.js 애플리케이션 최종 테스트 시작...\n');
  console.log(`테스트 서버: ${BASE_URL}`);
  console.log(`테스트 시간: ${new Date().toLocaleString('ko-KR')}\n`);

  // 1. 페이지별 접근성 테스트
  console.log('📄 페이지 접근성 테스트');
  console.log('=' .repeat(60));
  
  for (const pageTest of pagesToTest) {
    const pageResult = {
      name: pageTest.name,
      path: pageTest.path,
      status: null,
      loadTime: null,
      passed: true,
      analysis: null
    };

    try {
      const response = await makeRequest(BASE_URL + pageTest.path);
      
      pageResult.status = response.status;
      pageResult.loadTime = response.loadTime;
      
      if (response.status !== pageTest.expectedStatus) {
        pageResult.passed = false;
      }

      // HTML 분석
      if (response.status === 200) {
        pageResult.analysis = analyzeHTML(response.body, pageTest.name);
        
        // 에러 페이지인지 확인
        if (pageResult.analysis.hasErrors && pageResult.analysis.errors.length > 0) {
          pageResult.passed = false;
        }
      }

      const statusIcon = pageResult.passed ? '✅' : '❌';
      console.log(`${statusIcon} ${pageTest.name.padEnd(20)} | 상태: ${response.status} | 응답시간: ${response.loadTime}ms`);
      
      if (pageResult.analysis) {
        console.log(`   - 제목: ${pageResult.analysis.title || '없음'}`);
        console.log(`   - 버튼: ${pageResult.analysis.buttonCount}개 | 폼: ${pageResult.analysis.formCount}개`);
        
        if (pageResult.analysis.hasErrors) {
          console.log(`   - ⚠️  에러: ${pageResult.analysis.errors.join(', ')}`);
        }
      }

    } catch (error) {
      pageResult.passed = false;
      pageResult.error = error.message;
      console.log(`❌ ${pageTest.name.padEnd(20)} | 에러: ${error.message}`);
    }

    testResults.pages.push(pageResult);
    testResults.totalTests++;
    if (pageResult.passed) testResults.passed++;
    else testResults.failed++;
  }

  // 2. API 엔드포인트 테스트
  console.log('\n🔌 API 엔드포인트 테스트');
  console.log('=' .repeat(60));

  const apiEndpoints = [
    { path: '/api/health', name: 'Health Check', expectedStatus: 200 },
    { path: '/api/auth/session', name: 'Session Check', expectedStatus: 200 }
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest(BASE_URL + endpoint.path);
      const passed = response.status === endpoint.expectedStatus;
      const statusIcon = passed ? '✅' : '❌';
      
      console.log(`${statusIcon} ${endpoint.name.padEnd(20)} | 상태: ${response.status} | 응답시간: ${response.loadTime}ms`);
      
      testResults.totalTests++;
      if (passed) testResults.passed++;
      else testResults.failed++;
    } catch (error) {
      console.log(`❌ ${endpoint.name.padEnd(20)} | 에러: ${error.message}`);
      testResults.totalTests++;
      testResults.failed++;
    }
  }

  // 3. 정적 자산 테스트
  console.log('\n📦 정적 자산 테스트');
  console.log('=' .repeat(60));

  const staticAssets = [
    { path: '/_next/static/css/', name: 'CSS 번들' },
    { path: '/_next/static/chunks/', name: 'JS 번들' },
    { path: '/logo.png', name: '로고 이미지' },
    { path: '/favicon.ico', name: 'Favicon' }
  ];

  for (const asset of staticAssets) {
    try {
      // 정적 자산은 실제 파일 경로를 테스트하기 어려우므로 홈페이지에서 참조 확인
      const homeResponse = await makeRequest(BASE_URL);
      const hasAsset = homeResponse.body.includes(asset.path);
      const statusIcon = hasAsset ? '✅' : '⚠️ ';
      
      console.log(`${statusIcon} ${asset.name.padEnd(20)} | ${hasAsset ? '참조됨' : '참조 없음'}`);
    } catch (error) {
      console.log(`❌ ${asset.name.padEnd(20)} | 에러: ${error.message}`);
    }
  }

  // 4. 보안 헤더 확인
  console.log('\n🔒 보안 헤더 확인');
  console.log('=' .repeat(60));

  try {
    const response = await makeRequest(BASE_URL);
    const securityHeaders = {
      'x-powered-by': response.headers['x-powered-by'],
      'x-frame-options': response.headers['x-frame-options'],
      'x-content-type-options': response.headers['x-content-type-options'],
      'strict-transport-security': response.headers['strict-transport-security']
    };

    for (const [header, value] of Object.entries(securityHeaders)) {
      if (value) {
        console.log(`✅ ${header}: ${value}`);
      } else {
        console.log(`⚠️  ${header}: 설정되지 않음`);
      }
    }
  } catch (error) {
    console.log(`❌ 보안 헤더 확인 실패: ${error.message}`);
  }

  // 최종 요약
  console.log('\n📊 테스트 결과 요약');
  console.log('=' .repeat(60));
  console.log(`총 테스트: ${testResults.totalTests}`);
  console.log(`성공: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)`);
  console.log(`실패: ${testResults.failed}`);
  
  // 주요 문제점 요약
  const failedPages = testResults.pages.filter(p => !p.passed);
  if (failedPages.length > 0) {
    console.log('\n⚠️  실패한 페이지:');
    failedPages.forEach(page => {
      console.log(`   - ${page.name} (${page.path}): ${page.error || `상태 ${page.status}`}`);
    });
  }

  // 성능 지표 요약
  const avgLoadTime = testResults.pages
    .filter(p => p.loadTime)
    .reduce((sum, p) => sum + p.loadTime, 0) / testResults.pages.filter(p => p.loadTime).length;
  
  console.log(`\n⚡ 평균 응답 시간: ${avgLoadTime.toFixed(0)}ms`);

  if (testResults.failed === 0) {
    console.log('\n✅ 모든 테스트가 성공적으로 완료되었습니다!');
    testResults.summary = 'All tests passed successfully';
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다.');
    testResults.summary = `${testResults.failed} tests failed`;
  }

  // 결과를 JSON 파일로 저장
  await fs.writeFile('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📁 상세 결과가 test-results.json에 저장되었습니다.');
}

// 테스트 실행
runTest().catch(console.error);