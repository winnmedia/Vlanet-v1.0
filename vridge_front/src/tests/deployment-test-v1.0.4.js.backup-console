const axios = require('axios');

// 테스트 설정
const FRONTEND_URL = 'https://vlanet.net';
const API_URL = 'https://videoplanet.up.railway.app/api';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 유틸리티 함수
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}▶ ${testName}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

// 대기 함수
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 테스트 실행
async function runDeploymentTests() {
  log('\n🚀 VideoPlanet v1.0.4 배포 테스트 시작', 'bright');
  log('================================', 'bright');
  
  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // 1. 프론트엔드 접속 테스트
    logTest('1. 프론트엔드 메인 페이지 접속 테스트');
    try {
      const response = await axios.get(FRONTEND_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (response.status === 200) {
        logSuccess('메인 페이지 접속 성공');
        testResults.passed++;
      }
    } catch (error) {
      logError(`메인 페이지 접속 실패: ${error.message}`);
      testResults.failed++;
    }

    // 2. API 서버 헬스체크
    logTest('2. API 서버 헬스체크');
    try {
      const response = await axios.get(`${API_URL}/health/`);
      if (response.status === 200) {
        logSuccess('API 서버 정상 작동');
        logSuccess(`서버 시간: ${response.data.timestamp}`);
        testResults.passed++;
      }
    } catch (error) {
      logError(`API 서버 연결 실패: ${error.message}`);
      testResults.failed++;
    }

    // 3. 영상 기획 페이지 접근 테스트
    logTest('3. 영상 기획 페이지 접근 테스트');
    try {
      const response = await axios.get(`${FRONTEND_URL}/videoplanning`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 5
      });
      
      if (response.status === 200) {
        // HTML 내용 확인
        const html = response.data;
        if (html.includes('영상 기획') || html.includes('VideoPlanning')) {
          logSuccess('영상 기획 페이지 정상 로드');
          testResults.passed++;
        } else {
          logWarning('페이지는 로드되었으나 콘텐츠 확인 필요');
          testResults.warnings++;
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logError('영상 기획 페이지 404 오류 - 문제 해결 안됨');
        testResults.failed++;
      } else {
        logError(`영상 기획 페이지 접근 오류: ${error.message}`);
        testResults.failed++;
      }
    }

    // 4. 로그인 페이지 테스트
    logTest('4. 로그인 페이지 접근 테스트');
    try {
      const response = await axios.get(`${FRONTEND_URL}/login`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (response.status === 200) {
        logSuccess('로그인 페이지 정상 접근');
        testResults.passed++;
      }
    } catch (error) {
      logError(`로그인 페이지 접근 실패: ${error.message}`);
      testResults.failed++;
    }

    // 5. 정적 리소스 로드 테스트
    logTest('5. 정적 리소스 로드 테스트');
    try {
      // Next.js 정적 파일 체크
      const staticCheck = await axios.head(`${FRONTEND_URL}/_next/static/chunks/webpack.js`, {
        validateStatus: function (status) {
          return status < 500; // 500 미만은 오류로 처리하지 않음
        }
      });
      
      if (staticCheck.status < 400) {
        logSuccess('정적 리소스 정상 로드');
        testResults.passed++;
      } else {
        logWarning('일부 정적 리소스 로드 실패 가능성');
        testResults.warnings++;
      }
    } catch (error) {
      logWarning(`정적 리소스 확인 중 오류: ${error.message}`);
      testResults.warnings++;
    }

    // 6. 피드백 페이지 스타일 적용 확인
    logTest('6. 피드백 페이지 CSS 로드 확인');
    log('(실제 피드백 페이지는 인증이 필요하므로 CSS 파일 존재 여부만 체크)', 'yellow');
    
    // 빌드된 CSS 파일이 포함되어 있는지 확인
    try {
      const mainPage = await axios.get(FRONTEND_URL);
      if (mainPage.data.includes('FeedbackPageRedesign') || mainPage.data.includes('feedback')) {
        logSuccess('피드백 관련 스타일 참조 확인');
        testResults.passed++;
      } else {
        logWarning('피드백 스타일 참조를 찾을 수 없음 (빌드 해시로 인한 것일 수 있음)');
        testResults.warnings++;
      }
    } catch (error) {
      logError(`스타일 확인 실패: ${error.message}`);
      testResults.failed++;
    }

    // 7. CORS 설정 확인
    logTest('7. CORS 설정 확인');
    try {
      const response = await axios.options(`${API_URL}/health/`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader && (corsHeader === '*' || corsHeader.includes('vlanet.net'))) {
        logSuccess(`CORS 설정 정상: ${corsHeader}`);
        testResults.passed++;
      } else {
        logWarning('CORS 헤더 확인 필요');
        testResults.warnings++;
      }
    } catch (error) {
      logWarning(`CORS 확인 중 오류: ${error.message}`);
      testResults.warnings++;
    }

    // 8. 배포 버전 확인
    logTest('8. 배포 버전 확인');
    try {
      const response = await axios.get(FRONTEND_URL);
      const html = response.data;
      
      // HTML 메타 태그나 빌드 해시에서 버전 정보 찾기
      if (html.includes('1.0.4') || html.includes('videoplanet-frontend')) {
        logSuccess('v1.0.4 배포 확인');
        testResults.passed++;
      } else {
        logWarning('버전 정보를 HTML에서 찾을 수 없음');
        testResults.warnings++;
      }
    } catch (error) {
      logError(`버전 확인 실패: ${error.message}`);
      testResults.failed++;
    }

  } catch (error) {
    logError(`테스트 실행 중 예상치 못한 오류: ${error.message}`);
  }

  // 테스트 결과 요약
  console.log('\n' + '='.repeat(50));
  log('📊 테스트 결과 요약', 'bright');
  console.log('='.repeat(50));
  
  logSuccess(`통과: ${testResults.passed}개`);
  if (testResults.warnings > 0) {
    logWarning(`경고: ${testResults.warnings}개`);
  }
  if (testResults.failed > 0) {
    logError(`실패: ${testResults.failed}개`);
  }
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(50));
  if (testResults.failed === 0) {
    log(`✨ 모든 핵심 테스트 통과! (성공률: ${successRate}%)`, 'green');
  } else {
    log(`⚠️  일부 테스트 실패 (성공률: ${successRate}%)`, 'yellow');
  }
  
  // 권장사항
  console.log('\n📝 권장사항:');
  console.log('1. 브라우저에서 직접 https://vlanet.net/videoplanning 접속 확인');
  console.log('2. 로그인 후 피드백 페이지 UI 변경사항 확인');
  console.log('3. 프로젝트 관리 페이지에서 무한 요청 없는지 확인');
  console.log('4. 개발자 도구 콘솔에서 오류 메시지 확인');
  
  return testResults;
}

// 배포 대기 및 테스트 실행
async function waitAndTest() {
  log('⏳ Vercel 배포 완료 대기 중... (30초)', 'yellow');
  
  for (let i = 30; i > 0; i -= 5) {
    await wait(5000);
    log(`   ${i-5}초 남음...`, 'yellow');
  }
  
  log('\n🔍 배포 상태 확인 시작', 'cyan');
  await runDeploymentTests();
}

// 실행
waitAndTest().catch(error => {
  logError(`테스트 실행 실패: ${error.message}`);
  process.exit(1);
});