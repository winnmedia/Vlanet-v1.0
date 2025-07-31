/**
 * VideoPlanet 사용자 여정 통합 테스트
 * 실제 HTTP 요청으로 모든 핵심 기능을 MECE 방식으로 검증
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// 설정
const CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'https://videoplanet.up.railway.app',
  testUser: {
    email: 'test_journey@example.com',
    password: 'Test123!',
    name: '여정 테스트'
  }
};

// 테스트 결과 저장
const results = {
  timestamp: new Date().toISOString(),
  journeys: {},
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// 오류 패턴 분석
const errorPatterns = {
  connection: [],
  authentication: [],
  validation: [],
  notFound: [],
  serverError: [],
  clientError: []
};

// 유틸리티: 테스트 단계 실행
async function testStep(name, testFn) {
  console.log(`\n📍 테스트: ${name}`);
  results.summary.total++;
  
  try {
    const start = Date.now();
    const result = await testFn();
    const duration = Date.now() - start;
    
    console.log(`✅ 성공 (${duration}ms)`);
    results.summary.passed++;
    
    return { success: true, result, duration };
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
    results.summary.failed++;
    
    // 오류 패턴 분류
    const errorInfo = {
      step: name,
      message: error.message,
      code: error.response?.status,
      timestamp: new Date().toISOString()
    };
    
    results.errors.push(errorInfo);
    categorizeError(error, errorInfo);
    
    return { success: false, error: errorInfo };
  }
}

// 오류 분류
function categorizeError(error, errorInfo) {
  if (!error.response) {
    errorPatterns.connection.push(errorInfo);
  } else if (error.response.status === 401 || error.response.status === 403) {
    errorPatterns.authentication.push(errorInfo);
  } else if (error.response.status === 400) {
    errorPatterns.validation.push(errorInfo);
  } else if (error.response.status === 404) {
    errorPatterns.notFound.push(errorInfo);
  } else if (error.response.status >= 500) {
    errorPatterns.serverError.push(errorInfo);
  } else {
    errorPatterns.clientError.push(errorInfo);
  }
}

// Journey 1: 홈페이지 및 기본 페이지 접근성
async function testHomeJourney() {
  console.log('\n🚀 Journey 1: 홈페이지 및 기본 페이지 접근성');
  const journey = { name: 'home', steps: {} };
  
  // 홈페이지
  journey.steps.homepage = await testStep('홈페이지 접근', async () => {
    const response = await axios.get(CONFIG.baseURL);
    return { 
      status: response.status,
      hasContent: response.data.length > 0
    };
  });
  
  // 주요 페이지 접근성
  const pages = ['/login', '/signup', '/privacy', '/terms'];
  for (const page of pages) {
    journey.steps[page] = await testStep(`${page} 페이지 접근`, async () => {
      const response = await axios.get(CONFIG.baseURL + page);
      return { 
        status: response.status,
        url: page
      };
    });
  }
  
  results.journeys.home = journey;
  return journey;
}

// Journey 2: 인증 플로우
async function testAuthJourney() {
  console.log('\n🚀 Journey 2: 인증 플로우');
  const journey = { name: 'auth', steps: {} };
  
  // API 헬스체크
  journey.steps.apiHealth = await testStep('API 서버 상태 확인', async () => {
    const response = await axios.get(CONFIG.apiURL + '/api/health/');
    return response.data;
  });
  
  // 회원가입 시도
  journey.steps.signup = await testStep('회원가입 API 테스트', async () => {
    try {
      const response = await axios.post(CONFIG.apiURL + '/api/auth/signup/', {
        email: CONFIG.testUser.email,
        password: CONFIG.testUser.password,
        name: CONFIG.testUser.name
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.email) {
        // 이미 존재하는 이메일
        return { exists: true, message: '이메일 이미 존재' };
      }
      throw error;
    }
  });
  
  // 로그인 시도
  journey.steps.login = await testStep('로그인 API 테스트', async () => {
    const response = await axios.post(CONFIG.apiURL + '/api/auth/login/', {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password
    });
    
    // 토큰 저장
    if (response.data.access) {
      CONFIG.token = response.data.access;
    }
    
    return { 
      status: response.status,
      hasToken: !!response.data.access
    };
  });
  
  results.journeys.auth = journey;
  return journey;
}

// Journey 3: 프로젝트 관리
async function testProjectJourney() {
  console.log('\n🚀 Journey 3: 프로젝트 관리');
  const journey = { name: 'project', steps: {} };
  
  if (!CONFIG.token) {
    console.log('⚠️ 토큰 없음 - 인증 필요');
    return journey;
  }
  
  const authHeaders = {
    headers: { Authorization: `Bearer ${CONFIG.token}` }
  };
  
  // 프로젝트 목록 조회
  journey.steps.list = await testStep('프로젝트 목록 조회', async () => {
    const response = await axios.get(CONFIG.apiURL + '/api/projects/', authHeaders);
    return { 
      status: response.status,
      count: response.data.length
    };
  });
  
  // 프로젝트 생성
  journey.steps.create = await testStep('프로젝트 생성', async () => {
    const response = await axios.post(CONFIG.apiURL + '/api/projects/', {
      name: '테스트 프로젝트 ' + Date.now(),
      description: '사용자 여정 테스트용 프로젝트'
    }, authHeaders);
    
    if (response.data.id) {
      CONFIG.projectId = response.data.id;
    }
    
    return { 
      status: response.status,
      projectId: response.data.id
    };
  });
  
  results.journeys.project = journey;
  return journey;
}

// Journey 4: 피드백 시스템
async function testFeedbackJourney() {
  console.log('\n🚀 Journey 4: 피드백 시스템');
  const journey = { name: 'feedback', steps: {} };
  
  if (!CONFIG.projectId) {
    console.log('⚠️ 프로젝트 ID 없음 - 피드백 테스트 스킵');
    return journey;
  }
  
  // 피드백 페이지 접근
  journey.steps.feedbackPage = await testStep('피드백 페이지 접근', async () => {
    const response = await axios.get(CONFIG.baseURL + `/feedback/${CONFIG.projectId}`);
    return { 
      status: response.status,
      url: `/feedback/${CONFIG.projectId}`
    };
  });
  
  results.journeys.feedback = journey;
  return journey;
}

// 모든 엔드포인트 MECE 분석
async function analyzeAllEndpoints() {
  console.log('\n🔍 MECE 기반 전체 엔드포인트 분석');
  
  const endpoints = {
    pages: [
      '/', '/login', '/signup', '/cmshome', '/mypage',
      '/calendar', '/videoplanning', '/admin', '/feedbackall'
    ],
    api: {
      auth: ['/api/auth/login/', '/api/auth/signup/', '/api/auth/logout/'],
      projects: ['/api/projects/', '/api/projects/recent/'],
      feedbacks: ['/api/feedbacks/'],
      users: ['/api/users/me/', '/api/users/profile/']
    }
  };
  
  const analysis = {
    pages: { total: 0, accessible: 0, errors: [] },
    api: { total: 0, accessible: 0, errors: [] }
  };
  
  // 페이지 접근성 테스트
  for (const page of endpoints.pages) {
    analysis.pages.total++;
    try {
      await axios.get(CONFIG.baseURL + page, { timeout: 5000 });
      analysis.pages.accessible++;
    } catch (error) {
      analysis.pages.errors.push({
        page,
        status: error.response?.status || 'CONNECTION_ERROR'
      });
    }
  }
  
  // API 엔드포인트 테스트
  for (const [category, apis] of Object.entries(endpoints.api)) {
    for (const api of apis) {
      analysis.api.total++;
      try {
        const response = await axios.get(CONFIG.apiURL + api, { 
          timeout: 5000,
          headers: CONFIG.token ? { Authorization: `Bearer ${CONFIG.token}` } : {}
        });
        if (response.status < 400) {
          analysis.api.accessible++;
        }
      } catch (error) {
        if (error.response?.status === 401 && api.includes('auth')) {
          // 인증 필요한 엔드포인트는 401이 정상
          analysis.api.accessible++;
        } else {
          analysis.api.errors.push({
            api,
            category,
            status: error.response?.status || 'CONNECTION_ERROR'
          });
        }
      }
    }
  }
  
  return analysis;
}

// 근본 원인 분석
function analyzeRootCause() {
  console.log('\n🔬 근본 원인 분석');
  
  const patterns = Object.entries(errorPatterns)
    .map(([type, errors]) => ({ type, count: errors.length, errors }))
    .sort((a, b) => b.count - a.count);
  
  const rootCause = {
    primaryPattern: patterns[0] || { type: 'none', count: 0 },
    totalErrors: results.errors.length,
    errorDistribution: patterns.reduce((acc, p) => {
      acc[p.type] = p.count;
      return acc;
    }, {})
  };
  
  // 가장 자주 실패하는 단계 찾기
  const stepFailures = {};
  results.errors.forEach(error => {
    stepFailures[error.step] = (stepFailures[error.step] || 0) + 1;
  });
  
  rootCause.mostFailedSteps = Object.entries(stepFailures)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return rootCause;
}

// 메인 실행
async function runAllTests() {
  console.log('🏁 VideoPlanet 사용자 여정 통합 테스트 시작');
  console.log(`시간: ${new Date().toLocaleString()}`);
  console.log(`설정: ${JSON.stringify(CONFIG, null, 2)}`);
  
  try {
    // 각 여정 테스트
    await testHomeJourney();
    await testAuthJourney();
    await testProjectJourney();
    await testFeedbackJourney();
    
    // MECE 분석
    const meceAnalysis = await analyzeAllEndpoints();
    results.meceAnalysis = meceAnalysis;
    
    // 근본 원인 분석
    const rootCause = analyzeRootCause();
    results.rootCause = rootCause;
    
  } catch (error) {
    console.error('치명적 오류:', error);
    results.fatalError = error.message;
  }
  
  // 결과 저장
  const resultsPath = path.join(__dirname, '../test-results');
  await fs.mkdir(resultsPath, { recursive: true });
  
  const resultFile = path.join(resultsPath, `journey-test-${Date.now()}.json`);
  await fs.writeFile(resultFile, JSON.stringify(results, null, 2));
  
  // 요약 출력
  console.log('\n' + '='.repeat(70));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(70));
  console.log(`총 테스트: ${results.summary.total}`);
  console.log(`성공: ${results.summary.passed} (${(results.summary.passed/results.summary.total*100).toFixed(1)}%)`);
  console.log(`실패: ${results.summary.failed} (${(results.summary.failed/results.summary.total*100).toFixed(1)}%)`);
  
  if (results.meceAnalysis) {
    console.log('\n📍 MECE 분석:');
    console.log(`- 페이지: ${results.meceAnalysis.pages.accessible}/${results.meceAnalysis.pages.total} 접근 가능`);
    console.log(`- API: ${results.meceAnalysis.api.accessible}/${results.meceAnalysis.api.total} 접근 가능`);
  }
  
  if (results.rootCause && results.rootCause.totalErrors > 0) {
    console.log('\n🔴 주요 오류 패턴:');
    console.log(`- 주 패턴: ${results.rootCause.primaryPattern.type} (${results.rootCause.primaryPattern.count}건)`);
    console.log('- 오류 분포:', JSON.stringify(results.rootCause.errorDistribution));
    
    if (results.rootCause.mostFailedSteps.length > 0) {
      console.log('- 자주 실패하는 단계:');
      results.rootCause.mostFailedSteps.forEach(([step, count]) => {
        console.log(`  * ${step}: ${count}건`);
      });
    }
  }
  
  console.log(`\n💾 상세 결과: ${resultFile}`);
  console.log('='.repeat(70));
  
  // 심각한 문제 발견 시 경고
  if (results.summary.failed > results.summary.total * 0.3) {
    console.log('\n⚠️  경고: 30% 이상의 테스트가 실패했습니다!');
    console.log('근본적인 시스템 문제가 있을 가능성이 높습니다.');
  }
}

// 실행
runAllTests().catch(console.error);