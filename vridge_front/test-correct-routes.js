const http = require('http');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';

// 실제 존재하는 페이지 경로로 수정
const pagesToTest = [
  { path: '/', name: '홈페이지', expectedStatus: 200 },
  { path: '/login', name: '로그인', expectedStatus: 200 },
  { path: '/signup', name: '회원가입', expectedStatus: 200 },
  { path: '/cmshome', name: 'CMS 홈', expectedStatus: 200 },
  { path: '/project/create', name: '프로젝트 생성', expectedStatus: 200 },
  { path: '/videoplanning', name: '영상 기획', expectedStatus: 200 },
  { path: '/mypage', name: '마이페이지', expectedStatus: 200 },
  { path: '/admin', name: '관리자 대시보드', expectedStatus: 200 },
  { path: '/admindashboard', name: '관리자 대시보드2', expectedStatus: 200 },
  { path: '/calendar', name: '캘린더', expectedStatus: 200 },
  { path: '/feedbackall', name: '피드백 전체', expectedStatus: 200 },
  { path: '/emailcheck', name: '이메일 확인', expectedStatus: 200 },
  { path: '/emailmonitor', name: '이메일 모니터', expectedStatus: 200 },
  { path: '/privacy', name: '개인정보처리방침', expectedStatus: 200 },
  { path: '/terms', name: '이용약관', expectedStatus: 200 },
  { path: '/resetpw', name: '비밀번호 재설정', expectedStatus: 200 }
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
    errors: [],
    hasPrimaryButton: false,
    logoSize: null,
    headerHeight: null
  };

  // 타이틀 확인
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    analysis.hasTitle = true;
    analysis.title = titleMatch[1];
  }

  // 로고 확인 (더 정확한 패턴)
  if (html.includes('logo.svg') || html.includes('w_logo') || html.includes('b_logo')) {
    analysis.hasLogo = true;
    // 로고 크기 추정 (width, height 속성 확인)
    const logoMatch = html.match(/logo[^>]*width="?(\d+)"?[^>]*height="?(\d+)"?/i);
    if (logoMatch) {
      analysis.logoSize = { width: parseInt(logoMatch[1]), height: parseInt(logoMatch[2]) };
    }
  }

  // 네비게이션 확인
  if (html.includes('<nav') || html.includes('navigation') || html.includes('SideBar')) {
    analysis.hasNavigation = true;
  }

  // 버튼 확인
  const buttonMatches = html.match(/<button/gi) || [];
  analysis.hasButtons = buttonMatches.length > 0;
  analysis.buttonCount = buttonMatches.length;

  // 주요 버튼 색상 확인 (#1631F8)
  if (html.includes('#1631F8') || html.includes('rgb(22, 49, 248)') || html.includes('primary')) {
    analysis.hasPrimaryButton = true;
  }

  // 폼 확인
  const formMatches = html.match(/<form/gi) || [];
  analysis.hasForm = formMatches.length > 0;
  analysis.formCount = formMatches.length;

  // 에러 메시지 확인
  if (html.includes('error') || html.includes('Error') || html.includes('에러')) {
    // Next.js 특정 에러 패턴 확인
    if (html.includes('404') || html.includes('Page not found')) {
      analysis.errors.push('404 페이지');
      analysis.hasErrors = true;
    }
    if (html.includes('500') || html.includes('Internal Server Error')) {
      analysis.errors.push('500 서버 에러');
      analysis.hasErrors = true;
    }
  }

  return analysis;
}

async function runTest() {
  console.log('🚀 Next.js 애플리케이션 최종 테스트 (수정된 경로)\n');
  console.log(`테스트 서버: ${BASE_URL}`);
  console.log(`테스트 시간: ${new Date().toLocaleString('ko-KR')}\n`);

  const testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    pages: [],
    uiConsistency: {
      logoFound: 0,
      primaryButtonFound: 0,
      navigationFound: 0
    },
    summary: ''
  };

  // 1. 페이지별 접근성 테스트
  console.log('📄 페이지별 접근성 테스트');
  console.log('=' .repeat(80));
  console.log('페이지명'.padEnd(25) + '| 상태 | 응답시간 | UI 요소');
  console.log('-' .repeat(80));
  
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

        // UI 일관성 통계
        if (pageResult.analysis.hasLogo) testResults.uiConsistency.logoFound++;
        if (pageResult.analysis.hasPrimaryButton) testResults.uiConsistency.primaryButtonFound++;
        if (pageResult.analysis.hasNavigation) testResults.uiConsistency.navigationFound++;
      }

      const statusIcon = pageResult.passed ? '✅' : '❌';
      const uiElements = [];
      if (pageResult.analysis) {
        if (pageResult.analysis.hasLogo) uiElements.push('로고');
        if (pageResult.analysis.hasNavigation) uiElements.push('네비');
        if (pageResult.analysis.buttonCount > 0) uiElements.push(`버튼${pageResult.analysis.buttonCount}`);
        if (pageResult.analysis.formCount > 0) uiElements.push(`폼${pageResult.analysis.formCount}`);
      }
      
      console.log(
        `${statusIcon} ${pageTest.name.padEnd(23)} | ${String(response.status).padEnd(4)} | ${String(response.loadTime).padEnd(6)}ms | ${uiElements.join(', ')}`
      );
      
      if (pageResult.analysis && pageResult.analysis.hasErrors) {
        console.log(`   ⚠️  에러: ${pageResult.analysis.errors.join(', ')}`);
      }

    } catch (error) {
      pageResult.passed = false;
      pageResult.error = error.message;
      console.log(`❌ ${pageTest.name.padEnd(23)} | 에러 | ${error.message}`);
    }

    testResults.pages.push(pageResult);
    testResults.totalTests++;
    if (pageResult.passed) testResults.passed++;
    else testResults.failed++;
  }

  // 2. UI 일관성 분석
  console.log('\n🎨 UI 일관성 분석');
  console.log('=' .repeat(80));
  
  const totalPages = testResults.pages.filter(p => p.status === 200).length;
  console.log(`로고 포함 페이지: ${testResults.uiConsistency.logoFound}/${totalPages} (${((testResults.uiConsistency.logoFound/totalPages)*100).toFixed(0)}%)`);
  console.log(`주요 버튼 스타일 적용: ${testResults.uiConsistency.primaryButtonFound}/${totalPages} (${((testResults.uiConsistency.primaryButtonFound/totalPages)*100).toFixed(0)}%)`);
  console.log(`네비게이션 포함: ${testResults.uiConsistency.navigationFound}/${totalPages} (${((testResults.uiConsistency.navigationFound/totalPages)*100).toFixed(0)}%)`);

  // 3. 성능 분석
  console.log('\n⚡ 성능 분석');
  console.log('=' .repeat(80));
  
  const loadTimes = testResults.pages.filter(p => p.loadTime).map(p => p.loadTime);
  const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
  const maxLoadTime = Math.max(...loadTimes);
  const minLoadTime = Math.min(...loadTimes);
  
  console.log(`평균 응답 시간: ${avgLoadTime.toFixed(0)}ms`);
  console.log(`최대 응답 시간: ${maxLoadTime}ms (${testResults.pages.find(p => p.loadTime === maxLoadTime)?.name})`);
  console.log(`최소 응답 시간: ${minLoadTime}ms (${testResults.pages.find(p => p.loadTime === minLoadTime)?.name})`);

  // 4. 주요 기능 페이지 상태
  console.log('\n🔑 주요 기능 페이지 상태');
  console.log('=' .repeat(80));
  
  const criticalPages = [
    { name: '홈페이지', path: '/' },
    { name: '로그인', path: '/login' },
    { name: '회원가입', path: '/signup' },
    { name: 'CMS 홈', path: '/cmshome' },
    { name: '프로젝트 생성', path: '/project/create' },
    { name: '관리자 대시보드', path: '/admin' }
  ];

  criticalPages.forEach(page => {
    const result = testResults.pages.find(p => p.path === page.path);
    if (result && result.passed) {
      console.log(`✅ ${page.name}: 정상 작동`);
    } else {
      console.log(`❌ ${page.name}: 문제 발생 (${result?.status || '응답 없음'})`);
    }
  });

  // 최종 요약
  console.log('\n📊 최종 테스트 결과');
  console.log('=' .repeat(80));
  console.log(`총 테스트: ${testResults.totalTests}`);
  console.log(`성공: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)`);
  console.log(`실패: ${testResults.failed}`);
  
  // 실패한 페이지 목록
  const failedPages = testResults.pages.filter(p => !p.passed);
  if (failedPages.length > 0) {
    console.log('\n⚠️  문제가 있는 페이지:');
    failedPages.forEach(page => {
      console.log(`   - ${page.name} (${page.path}): ${page.error || `상태 ${page.status}`}`);
    });
  }

  // 권장사항
  console.log('\n💡 권장사항:');
  if (testResults.uiConsistency.logoFound < totalPages * 0.8) {
    console.log('   - 일부 페이지에 로고가 없습니다. 브랜드 일관성을 위해 모든 페이지에 로고 추가를 권장합니다.');
  }
  if (testResults.uiConsistency.primaryButtonFound < totalPages * 0.5) {
    console.log('   - 주요 버튼 스타일(#1631F8)이 일부 페이지에만 적용되어 있습니다. 통일성 개선이 필요합니다.');
  }
  if (avgLoadTime > 500) {
    console.log('   - 평균 응답 시간이 500ms를 초과합니다. 성능 최적화를 권장합니다.');
  }

  if (testResults.failed === 0) {
    console.log('\n✅ 모든 테스트가 성공적으로 완료되었습니다!');
    testResults.summary = 'All tests passed successfully';
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 위의 권장사항을 참고하여 개선하세요.');
    testResults.summary = `${testResults.failed} tests failed`;
  }

  // 결과를 JSON 파일로 저장
  await fs.writeFile('test-results-final.json', JSON.stringify(testResults, null, 2));
  console.log('\n📁 상세 결과가 test-results-final.json에 저장되었습니다.');
}

// 테스트 실행
runTest().catch(console.error);