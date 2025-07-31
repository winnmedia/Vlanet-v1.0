const http = require('http');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';

// 주요 페이지 테스트
const criticalPages = [
  { path: '/', name: '홈페이지' },
  { path: '/login', name: '로그인' },
  { path: '/signup', name: '회원가입' },
  { path: '/cmshome', name: 'CMS 홈' },
  { path: '/project/create', name: '프로젝트 생성' },
  { path: '/videoplanning', name: '영상 기획' },
  { path: '/admin', name: '관리자 대시보드' }
];

// HTTP 요청으로 페이지 가져오기
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

// HTML에서 잠재적 문제 찾기
function findPotentialIssues(html, pageName) {
  const issues = [];
  
  // 1. React 개발 모드 경고 확인
  if (html.includes('__NEXT_DATA__')) {
    const nextDataMatch = html.match(/__NEXT_DATA__[^<]+/);
    if (nextDataMatch && nextDataMatch[0].includes('"err"')) {
      issues.push('Next.js 렌더링 에러 발견');
    }
  }

  // 2. JavaScript 에러 패턴 확인
  const errorPatterns = [
    /console\.error/gi,
    /throw new Error/gi,
    /uncaught/gi,
    /undefined is not/gi,
    /cannot read property/gi,
    /is not a function/gi,
    /failed to fetch/gi,
    /network error/gi
  ];

  errorPatterns.forEach(pattern => {
    if (pattern.test(html)) {
      issues.push(`JavaScript 에러 패턴 발견: ${pattern.source}`);
    }
  });

  // 3. 누락된 의존성 확인
  if (html.includes('Module not found') || html.includes('Cannot resolve')) {
    issues.push('모듈 누락 에러');
  }

  // 4. CORS 관련 문제
  if (html.includes('CORS') || html.includes('Access-Control')) {
    issues.push('CORS 관련 문제 가능성');
  }

  // 5. 인증 관련 문제
  if (html.includes('401') || html.includes('403') || html.includes('Unauthorized')) {
    issues.push('인증 관련 문제');
  }

  // 6. API 엔드포인트 문제
  const apiCalls = html.match(/fetch\(['"`][^'"`]+['"`]/gi) || [];
  const axiosCalls = html.match(/axios\.[a-z]+\(['"`][^'"`]+['"`]/gi) || [];
  
  if (apiCalls.length > 0 || axiosCalls.length > 0) {
    issues.push(`API 호출 발견: ${apiCalls.length + axiosCalls.length}개`);
  }

  // 7. 스타일 관련 문제
  if (html.includes('.css') && html.includes('404')) {
    issues.push('CSS 파일 로드 실패 가능성');
  }

  // 8. Redux 관련 문제
  if (html.includes('redux') && (html.includes('undefined') || html.includes('null'))) {
    issues.push('Redux 상태 관리 문제 가능성');
  }

  return issues;
}

// UI 일관성 체크
function checkUIConsistency(html, pageName) {
  const uiCheck = {
    logo: {
      found: false,
      width: null,
      height: null
    },
    primaryButton: {
      found: false,
      count: 0
    },
    header: {
      found: false,
      hasNavigation: false
    },
    footer: {
      found: false
    },
    responsiveness: {
      hasViewport: false,
      hasMobileStyles: false
    }
  };

  // 로고 체크
  if (html.includes('logo.svg') || html.includes('w_logo') || html.includes('b_logo')) {
    uiCheck.logo.found = true;
    // width/height 추출 시도
    const logoMatch = html.match(/logo[^>]*width[=:]["']?(\d+)/i);
    if (logoMatch) uiCheck.logo.width = parseInt(logoMatch[1]);
    const heightMatch = html.match(/logo[^>]*height[=:]["']?(\d+)/i);
    if (heightMatch) uiCheck.logo.height = parseInt(heightMatch[1]);
  }

  // 주요 버튼 색상 체크 (#1631F8)
  const primaryColorCount = (html.match(/#1631F8|rgb\(22,\s*49,\s*248\)/gi) || []).length;
  if (primaryColorCount > 0) {
    uiCheck.primaryButton.found = true;
    uiCheck.primaryButton.count = primaryColorCount;
  }

  // 헤더/네비게이션 체크
  if (html.includes('<header') || html.includes('Header')) {
    uiCheck.header.found = true;
  }
  if (html.includes('<nav') || html.includes('SideBar') || html.includes('navigation')) {
    uiCheck.header.hasNavigation = true;
  }

  // 푸터 체크
  if (html.includes('<footer') || html.includes('Footer')) {
    uiCheck.footer.found = true;
  }

  // 반응형 디자인 체크
  if (html.includes('viewport')) {
    uiCheck.responsiveness.hasViewport = true;
  }
  if (html.includes('@media') || html.includes('mobile') || html.includes('responsive')) {
    uiCheck.responsiveness.hasMobileStyles = true;
  }

  return uiCheck;
}

async function runDetailedTest() {
  console.log('🔍 Next.js 애플리케이션 상세 분석\n');
  console.log('=' .repeat(80));
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    pages: [],
    commonIssues: [],
    uiConsistencyScore: 0,
    recommendations: []
  };

  for (const page of criticalPages) {
    console.log(`\n📄 ${page.name} (${page.path})`);
    console.log('-' .repeat(40));
    
    try {
      const response = await fetchPage(BASE_URL + page.path);
      const issues = findPotentialIssues(response.body, page.name);
      const uiCheck = checkUIConsistency(response.body, page.name);
      
      const pageResult = {
        name: page.name,
        path: page.path,
        status: response.status,
        issues: issues,
        uiCheck: uiCheck
      };
      
      detailedResults.pages.push(pageResult);
      
      // 상태 출력
      console.log(`상태: ${response.status === 200 ? '✅ 정상' : '❌ 에러'} (${response.status})`);
      
      // UI 일관성 출력
      console.log('\nUI 일관성:');
      console.log(`  - 로고: ${uiCheck.logo.found ? `✅ 발견${uiCheck.logo.width ? ` (${uiCheck.logo.width}x${uiCheck.logo.height}px)` : ''}` : '❌ 없음'}`);
      console.log(`  - 주요 버튼: ${uiCheck.primaryButton.found ? `✅ ${uiCheck.primaryButton.count}개` : '❌ 없음'}`);
      console.log(`  - 헤더: ${uiCheck.header.found ? '✅' : '❌'} | 네비게이션: ${uiCheck.header.hasNavigation ? '✅' : '❌'}`);
      console.log(`  - 반응형: 뷰포트 ${uiCheck.responsiveness.hasViewport ? '✅' : '❌'} | 모바일 스타일 ${uiCheck.responsiveness.hasMobileStyles ? '✅' : '❌'}`);
      
      // 잠재적 문제 출력
      if (issues.length > 0) {
        console.log('\n⚠️  잠재적 문제:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('\n✅ 잠재적 문제 없음');
      }
      
    } catch (error) {
      console.log(`❌ 에러: ${error.message}`);
      detailedResults.pages.push({
        name: page.name,
        path: page.path,
        error: error.message
      });
    }
  }

  // 전체 분석
  console.log('\n\n🔬 전체 분석 결과');
  console.log('=' .repeat(80));
  
  // UI 일관성 점수 계산
  let totalScore = 0;
  let maxScore = 0;
  
  detailedResults.pages.forEach(page => {
    if (page.uiCheck) {
      maxScore += 5; // 각 페이지당 5점 만점
      if (page.uiCheck.logo.found) totalScore += 1;
      if (page.uiCheck.primaryButton.found) totalScore += 1;
      if (page.uiCheck.header.found) totalScore += 1;
      if (page.uiCheck.header.hasNavigation) totalScore += 1;
      if (page.uiCheck.responsiveness.hasViewport) totalScore += 1;
    }
  });
  
  detailedResults.uiConsistencyScore = (totalScore / maxScore * 100).toFixed(1);
  
  console.log(`\n🎨 UI 일관성 점수: ${detailedResults.uiConsistencyScore}%`);
  
  // 공통 문제 찾기
  const allIssues = detailedResults.pages.flatMap(p => p.issues || []);
  const issueCounts = {};
  allIssues.forEach(issue => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
  
  console.log('\n🚨 공통 문제:');
  Object.entries(issueCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach(([issue, count]) => {
      console.log(`  - ${issue}: ${count}개 페이지에서 발견`);
      detailedResults.commonIssues.push({ issue, count });
    });
  
  // 권장사항
  console.log('\n💡 개선 권장사항:');
  
  if (detailedResults.uiConsistencyScore < 80) {
    const recommendation = 'UI 일관성 점수가 낮습니다. 모든 페이지에 통일된 헤더, 로고, 버튼 스타일을 적용하세요.';
    console.log(`  1. ${recommendation}`);
    detailedResults.recommendations.push(recommendation);
  }
  
  if (detailedResults.commonIssues.some(i => i.issue.includes('API'))) {
    const recommendation = 'API 호출이 많은 페이지가 있습니다. 필요한 경우 데이터 캐싱을 고려하세요.';
    console.log(`  2. ${recommendation}`);
    detailedResults.recommendations.push(recommendation);
  }
  
  const pagesWithoutLogo = detailedResults.pages.filter(p => p.uiCheck && !p.uiCheck.logo.found);
  if (pagesWithoutLogo.length > 0) {
    const recommendation = `${pagesWithoutLogo.length}개 페이지에 로고가 없습니다: ${pagesWithoutLogo.map(p => p.name).join(', ')}`;
    console.log(`  3. ${recommendation}`);
    detailedResults.recommendations.push(recommendation);
  }
  
  const pagesWithoutPrimaryButton = detailedResults.pages.filter(p => p.uiCheck && !p.uiCheck.primaryButton.found);
  if (pagesWithoutPrimaryButton.length > 0) {
    const recommendation = `${pagesWithoutPrimaryButton.length}개 페이지에 주요 버튼 스타일(#1631F8)이 없습니다. 통일성을 위해 적용을 권장합니다.`;
    console.log(`  4. ${recommendation}`);
    detailedResults.recommendations.push(recommendation);
  }
  
  // 결과 저장
  await fs.writeFile('test-detailed-analysis.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n\n📁 상세 분석 결과가 test-detailed-analysis.json에 저장되었습니다.');
  
  // 최종 요약
  console.log('\n📊 최종 요약');
  console.log('=' .repeat(80));
  console.log(`✅ 테스트된 페이지: ${detailedResults.pages.length}개`);
  console.log(`🎨 UI 일관성: ${detailedResults.uiConsistencyScore}%`);
  console.log(`⚠️  공통 문제: ${detailedResults.commonIssues.length}개`);
  console.log(`💡 권장사항: ${detailedResults.recommendations.length}개`);
  
  if (detailedResults.uiConsistencyScore >= 80 && detailedResults.commonIssues.length === 0) {
    console.log('\n✅ 전반적으로 양호한 상태입니다!');
  } else {
    console.log('\n⚠️  위의 권장사항을 참고하여 개선이 필요합니다.');
  }
}

// 테스트 실행
runDetailedTest().catch(console.error);