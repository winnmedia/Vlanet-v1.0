/**
 * 새로운 피드백 시스템 V2 테스트 스크립트
 * 백엔드 API와의 통합 테스트
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 설정
const BASE_URL = process.env.API_URL || 'https://videoplanet.up.railway.app'
const TEST_EMAIL = 'demo@test.com'
const TEST_PASSWORD = 'demo1234'
const PROJECT_ID = 1 // 테스트할 프로젝트 ID

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// 테스트 결과 저장
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: new Date(),
  endTime: null
}

// 헬퍼 함수
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name, success, error = null) {
  testResults.total++
  if (success) {
    testResults.passed++
    log(`  ✅ ${name}`, 'green')
  } else {
    testResults.failed++
    log(`  ❌ ${name}`, 'red')
    if (error) {
      log(`     Error: ${error}`, 'yellow')
      testResults.errors.push({ test: name, error: error.toString() })
    }
  }
}

// 로그인 함수
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/signin/`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    if (response.data && response.data.access) {
      return {
        access: response.data.access,
        refresh: response.data.refresh,
        user: response.data.user
      }
    }
    throw new Error('토큰을 받지 못했습니다')
  } catch (error) {
    throw new Error(`로그인 실패: ${error.message}`)
  }
}

// API 테스트 함수들
async function testGetFeedbackList(token, projectId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/projects/${projectId}/feedbacks/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.status === 200) {
      const feedbacks = Array.isArray(response.data) ? response.data : response.data.results || []
      logTest('피드백 목록 조회', true)
      log(`     Found ${feedbacks.length} feedbacks`, 'cyan')
      return feedbacks
    } else {
      logTest('피드백 목록 조회', false, `Status: ${response.status}`)
      return []
    }
  } catch (error) {
    logTest('피드백 목록 조회', false, error.response?.data?.detail || error.message)
    return []
  }
}

async function testCreateFeedback(token, projectId) {
  try {
    const feedbackData = {
      title: `테스트 피드백 ${Date.now()}`,
      description: '새로운 백엔드 API 테스트용 피드백입니다.',
      video_url: 'https://example.com/test-video.mp4',
      status: 'pending',
      metadata: {
        timestamp: 30,
        type: 'technical',
        priority: 'high'
      }
    }
    
    const response = await axios.post(
      `${BASE_URL}/api/projects/${projectId}/feedbacks/`,
      feedbackData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.status === 201 || response.status === 200) {
      logTest('피드백 생성', true)
      log(`     Created feedback ID: ${response.data.id}`, 'cyan')
      return response.data
    } else {
      logTest('피드백 생성', false, `Status: ${response.status}`)
      return null
    }
  } catch (error) {
    logTest('피드백 생성', false, error.response?.data?.detail || error.message)
    return null
  }
}

async function testGetFeedbackDetail(token, feedbackId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/feedbacks/${feedbackId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.status === 200) {
      logTest('피드백 상세 조회', true)
      log(`     Feedback title: ${response.data.title}`, 'cyan')
      return response.data
    } else {
      logTest('피드백 상세 조회', false, `Status: ${response.status}`)
      return null
    }
  } catch (error) {
    logTest('피드백 상세 조회', false, error.response?.data?.detail || error.message)
    return null
  }
}

async function testUpdateFeedback(token, feedbackId) {
  try {
    const updateData = {
      title: `수정된 피드백 ${Date.now()}`,
      description: '이 피드백은 수정되었습니다.',
      metadata: {
        timestamp: 45,
        type: 'creative',
        priority: 'urgent'
      }
    }
    
    const response = await axios.put(
      `${BASE_URL}/api/feedbacks/${feedbackId}/`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.status === 200) {
      logTest('피드백 수정', true)
      log(`     Updated title: ${response.data.title}`, 'cyan')
      return response.data
    } else {
      logTest('피드백 수정', false, `Status: ${response.status}`)
      return null
    }
  } catch (error) {
    logTest('피드백 수정', false, error.response?.data?.detail || error.message)
    return null
  }
}

async function testAddMessage(token, feedbackId) {
  try {
    const messageData = {
      content: '이것은 테스트 메시지입니다.',
      timestamp: 60,
      type: 'comment',
      metadata: {
        important: true
      }
    }
    
    const response = await axios.post(
      `${BASE_URL}/api/feedbacks/${feedbackId}/messages/`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.status === 201 || response.status === 200) {
      logTest('메시지 추가', true)
      log(`     Added message ID: ${response.data.id}`, 'cyan')
      return response.data
    } else {
      logTest('메시지 추가', false, `Status: ${response.status}`)
      return null
    }
  } catch (error) {
    logTest('메시지 추가', false, error.response?.data?.detail || error.message)
    return null
  }
}

async function testDeleteFeedback(token, feedbackId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/feedbacks/${feedbackId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.status === 204 || response.status === 200) {
      logTest('피드백 삭제', true)
      return true
    } else {
      logTest('피드백 삭제', false, `Status: ${response.status}`)
      return false
    }
  } catch (error) {
    logTest('피드백 삭제', false, error.response?.data?.detail || error.message)
    return false
  }
}

// 메인 테스트 실행 함수
async function runTests() {
  log('\n🚀 피드백 시스템 V2 테스트 시작', 'magenta')
  log(`📍 API URL: ${BASE_URL}`, 'cyan')
  log(`📧 Test User: ${TEST_EMAIL}`, 'cyan')
  log(`📁 Project ID: ${PROJECT_ID}`, 'cyan')
  log('─'.repeat(50), 'cyan')
  
  try {
    // 1. 로그인
    log('\n1️⃣ 인증 테스트', 'blue')
    const authData = await login()
    logTest('로그인', true)
    log(`     User ID: ${authData.user?.id}`, 'cyan')
    
    // 2. 피드백 목록 조회
    log('\n2️⃣ 피드백 목록 조회 테스트', 'blue')
    const feedbacks = await testGetFeedbackList(authData.access, PROJECT_ID)
    
    // 3. 피드백 생성
    log('\n3️⃣ 피드백 생성 테스트', 'blue')
    const newFeedback = await testCreateFeedback(authData.access, PROJECT_ID)
    
    if (newFeedback) {
      // 4. 피드백 상세 조회
      log('\n4️⃣ 피드백 상세 조회 테스트', 'blue')
      await testGetFeedbackDetail(authData.access, newFeedback.id)
      
      // 5. 피드백 수정
      log('\n5️⃣ 피드백 수정 테스트', 'blue')
      await testUpdateFeedback(authData.access, newFeedback.id)
      
      // 6. 메시지 추가
      log('\n6️⃣ 메시지 추가 테스트', 'blue')
      await testAddMessage(authData.access, newFeedback.id)
      
      // 7. 피드백 삭제
      log('\n7️⃣ 피드백 삭제 테스트', 'blue')
      await testDeleteFeedback(authData.access, newFeedback.id)
    }
    
  } catch (error) {
    log(`\n치명적 오류: ${error.message}`, 'red')
    testResults.errors.push({ test: 'System', error: error.message })
  }
  
  // 테스트 결과 요약
  testResults.endTime = new Date()
  const duration = (testResults.endTime - testResults.startTime) / 1000
  
  log('\n' + '═'.repeat(50), 'magenta')
  log('📊 테스트 결과 요약', 'magenta')
  log('─'.repeat(50), 'cyan')
  log(`✅ 성공: ${testResults.passed}/${testResults.total}`, 'green')
  log(`❌ 실패: ${testResults.failed}/${testResults.total}`, testResults.failed > 0 ? 'red' : 'gray')
  log(`⏱️  소요 시간: ${duration.toFixed(2)}초`, 'cyan')
  log(`📈 성공률: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
    testResults.passed === testResults.total ? 'green' : 'yellow')
  
  // 오류 상세 출력
  if (testResults.errors.length > 0) {
    log('\n📝 오류 상세:', 'red')
    testResults.errors.forEach((err, index) => {
      log(`  ${index + 1}. ${err.test}: ${err.error}`, 'yellow')
    })
  }
  
  // 결과 파일 저장
  const reportPath = path.join(__dirname, `feedback-v2-test-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  log(`\n📄 상세 리포트: ${reportPath}`, 'cyan')
  
  // 성공/실패 반환
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// 테스트 실행
runTests().catch(error => {
  log(`테스트 실행 실패: ${error.message}`, 'red')
  process.exit(1)
})