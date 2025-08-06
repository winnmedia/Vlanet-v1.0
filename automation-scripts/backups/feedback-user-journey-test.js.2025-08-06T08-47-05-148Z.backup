const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// Railway 백엔드 URL 사용
const BASE_URL = 'https://videoplanet.up.railway.app'
const FRONTEND_URL = 'http://localhost:3004'

// 테스트 사용자 정보
const testUser = {
  email: 'demo@test.com',
  password: 'demo1234'
}

// 테스트 프로젝트 ID (기존 프로젝트 사용)
const TEST_PROJECT_ID = 1014

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
}

// 로그 헬퍼
const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}📋 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

// 테스트 결과 저장
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  warnings: []
}

// 토큰 저장
let authToken = null

// 테스트 실행 함수
async function runTest(testName, testFn) {
  testResults.totalTests++
  try {
    await testFn()
    testResults.passedTests++
    log.success(testName)
  } catch (error) {
    testResults.failedTests++
    log.error(`${testName}: ${error.message}`)
    testResults.errors.push({ test: testName, error: error.message })
    // 상세 에러 정보 출력
    if (error.response) {
      console.log('  Response data:', error.response.data)
      console.log('  Response status:', error.response.status)
    }
  }
}

// 1. 로그인
async function testLogin() {
  const response = await axios.post(`${BASE_URL}/api/accounts/login/`, {
    username: testUser.email,
    password: testUser.password
  })
  
  authToken = response.data.data.token
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  
  return response.data
}

// 2. 프로젝트 정보 조회
async function testGetProject() {
  const response = await axios.get(`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/`)
  return response.data
}

// 3. 피드백 목록 조회
async function testGetFeedbacks() {
  const response = await axios.get(`${BASE_URL}/api/feedbacks/project/${TEST_PROJECT_ID}/`)
  return response.data
}

// 4. 새 피드백 등록
async function testCreateFeedback() {
  const feedbackData = {
    project: TEST_PROJECT_ID,
    content: `테스트 피드백 - ${new Date().toLocaleString('ko-KR')}`,
    time: '00:30', // 30초 시점
    category: 'general'
  }
  
  const response = await axios.post(`${BASE_URL}/api/feedbacks/create/`, feedbackData)
  return response.data
}

// 5. AI 피드백 분석
async function testAIAnalysis() {
  try {
    const response = await axios.post(`${BASE_URL}/api/video-analysis/analyze/`, {
      project_id: TEST_PROJECT_ID
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 500) {
      log.warning('AI 분석 API가 서버 오류를 반환했습니다 (API 키 문제일 수 있음)')
      testResults.warnings.push('AI 분석 기능은 API 키 설정이 필요합니다')
    }
    throw error
  }
}

// 6. 코멘트 등록
async function testCreateComment() {
  const commentData = {
    project: TEST_PROJECT_ID,
    type: 'opinion',
    comment: `테스트 코멘트 - ${new Date().toLocaleString('ko-KR')}`,
    is_public: true
  }
  
  const response = await axios.post(`${BASE_URL}/api/feedbacks/opinion/create/`, commentData)
  return response.data
}

// 7. 피드백 수정
async function testUpdateFeedback(feedbackId) {
  const updateData = {
    content: `수정된 피드백 - ${new Date().toLocaleString('ko-KR')}`,
    time: '00:45'
  }
  
  const response = await axios.put(`${BASE_URL}/api/feedbacks/update/${feedbackId}/`, updateData)
  return response.data
}

// 8. 피드백 삭제
async function testDeleteFeedback(feedbackId) {
  const response = await axios.delete(`${BASE_URL}/api/feedbacks/delete/${feedbackId}/`)
  return response.data
}

// 9. 피드백 전체보기
async function testGetAllFeedbacks() {
  const response = await axios.get(`${BASE_URL}/api/feedbacks/project/${TEST_PROJECT_ID}/all/`)
  return response.data
}

// 10. 프로젝트 초대 테스트
async function testProjectInvite() {
  const inviteData = {
    project: TEST_PROJECT_ID,
    email: 'test@example.com',
    role: 'viewer'
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/projects/invite/`, inviteData)
    return response.data
  } catch (error) {
    if (error.response?.status === 400) {
      log.info('이미 초대된 사용자이거나 유효하지 않은 이메일입니다')
    }
    throw error
  }
}

// 메인 테스트 실행
async function runFeedbackUserJourneyTest() {
  log.title('영상 피드백 페이지 사용자 여정 테스트')
  console.log(`백엔드: ${BASE_URL}`)
  console.log(`프론트엔드: ${FRONTEND_URL}`)
  console.log(`테스트 프로젝트 ID: ${TEST_PROJECT_ID}`)
  
  let createdFeedbackId = null
  
  try {
    // === 1단계: 인증 및 접근 ===
    log.section('1단계: 인증 및 접근')
    
    await runTest('1-1. 로그인', async () => {
      const result = await testLogin()
      if (!result.data.token) throw new Error('토큰이 없습니다')
    })
    
    await runTest('1-2. 프로젝트 정보 조회', async () => {
      const result = await testGetProject()
      if (!result.data.project) throw new Error('프로젝트 정보가 없습니다')
      log.info(`프로젝트: ${result.data.project.name}`)
    })
    
    // === 2단계: 피드백 등록 탭 ===
    log.section('2단계: 피드백 등록 탭')
    
    await runTest('2-1. 피드백 목록 조회', async () => {
      const result = await testGetFeedbacks()
      log.info(`현재 피드백 수: ${result.data.feedbacks.length}개`)
    })
    
    await runTest('2-2. 새 피드백 등록', async () => {
      const result = await testCreateFeedback()
      if (!result.data.feedback) throw new Error('피드백 생성 실패')
      createdFeedbackId = result.data.feedback.id
      log.info(`생성된 피드백 ID: ${createdFeedbackId}`)
    })
    
    await runTest('2-3. AI 피드백 분석', async () => {
      try {
        const result = await testAIAnalysis()
        log.info('AI 분석 시작됨')
      } catch (error) {
        if (error.message.includes('API 키')) {
          log.warning('AI 분석은 Railway 환경에서만 작동합니다')
        } else {
          throw error
        }
      }
    })
    
    // === 3단계: 코멘트 탭 ===
    log.section('3단계: 코멘트 탭')
    
    await runTest('3-1. 코멘트 등록', async () => {
      const result = await testCreateComment()
      if (!result.data.opinion) throw new Error('코멘트 생성 실패')
      log.info(`코멘트 ID: ${result.data.opinion.id}`)
    })
    
    // === 4단계: 피드백 관리 탭 ===
    log.section('4단계: 피드백 관리 탭')
    
    await runTest('4-1. 피드백 전체보기', async () => {
      const result = await testGetAllFeedbacks()
      log.info(`전체 피드백 수: ${result.data.feedbacks.length}개`)
    })
    
    if (createdFeedbackId) {
      await runTest('4-2. 피드백 수정', async () => {
        const result = await testUpdateFeedback(createdFeedbackId)
        if (!result.data.feedback) throw new Error('피드백 수정 실패')
      })
      
      await runTest('4-3. 피드백 삭제', async () => {
        const result = await testDeleteFeedback(createdFeedbackId)
        if (result.status !== 'success') throw new Error('피드백 삭제 실패')
      })
    }
    
    // === 5단계: 추가 기능 ===
    log.section('5단계: 추가 기능')
    
    await runTest('5-1. 프로젝트 초대', async () => {
      try {
        const result = await testProjectInvite()
        log.info('초대 이메일 발송됨')
      } catch (error) {
        if (error.message.includes('이미 초대된')) {
          log.info('이미 초대된 사용자입니다')
        } else {
          throw error
        }
      }
    })
    
  } catch (error) {
    log.error(`테스트 중 예상치 못한 오류: ${error.message}`)
  }
  
  // === 테스트 결과 요약 ===
  log.title('테스트 결과 요약')
  
  const successRate = Math.round((testResults.passedTests / testResults.totalTests) * 100)
  
  console.log(`\n총 테스트: ${testResults.totalTests}개`)
  console.log(`${colors.green}성공: ${testResults.passedTests}개${colors.reset}`)
  console.log(`${colors.red}실패: ${testResults.failedTests}개${colors.reset}`)
  console.log(`성공률: ${successRate}%`)
  
  if (testResults.warnings.length > 0) {
    console.log(`\n${colors.yellow}경고사항:${colors.reset}`)
    testResults.warnings.forEach(warning => {
      console.log(`  - ${warning}`)
    })
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}오류 상세:${colors.reset}`)
    testResults.errors.forEach(({ test, error }) => {
      console.log(`  ${test}: ${error}`)
    })
  }
  
  // 프론트엔드 체크리스트
  log.title('프론트엔드 수동 테스트 체크리스트')
  console.log('\n브라우저에서 다음 항목들을 확인하세요:')
  console.log('1. [ ] 비디오 플레이어가 정상적으로 로드되는가?')
  console.log('2. [ ] 재생/일시정지 버튼이 작동하는가?')
  console.log('3. [ ] 타임라인 슬라이더가 작동하는가?')
  console.log('4. [ ] 피드백 등록 시 현재 재생 시간이 자동으로 입력되는가?')
  console.log('5. [ ] 탭 전환이 부드럽게 작동하는가?')
  console.log('6. [ ] 피드백 목록이 시간순으로 정렬되어 표시되는가?')
  console.log('7. [ ] 피드백 클릭 시 해당 시점으로 이동하는가?')
  console.log('8. [ ] 그리기 도구가 정상 작동하는가?')
  console.log('9. [ ] 실시간 업데이트가 작동하는가?')
  console.log('10. [ ] 모바일 반응형 디자인이 적용되는가?')
  
  console.log(`\n${colors.cyan}테스트 페이지: ${FRONTEND_URL}/feedback/${TEST_PROJECT_ID}${colors.reset}`)
  
  // 테스트 결과를 파일로 저장
  const reportPath = path.join(__dirname, `feedback-test-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.totalTests,
      passed: testResults.passedTests,
      failed: testResults.failedTests,
      successRate: `${successRate}%`
    },
    warnings: testResults.warnings,
    errors: testResults.errors
  }, null, 2))
  
  log.info(`테스트 리포트 저장됨: ${reportPath}`)
}

// 테스트 실행
runFeedbackUserJourneyTest()