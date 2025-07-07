const axios = require('axios')

const PRODUCTION_API = 'https://videoplanet.up.railway.app'
const FRONTEND_URL = 'https://vlanet.net'

async function testProduction() {
  console.log('🚀 운영 환경 최종 검증 테스트\n')

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  }

  // 1. API 서버 연결 테스트
  try {
    results.total++
    const response = await axios.get(`${PRODUCTION_API}/health/`, { timeout: 10000 })
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ API 서버 연결:', response.data.message)
      results.passed++
    } else {
      console.log('❌ API 서버 응답 이상:', response.status)
      results.failed++
    }
  } catch (error) {
    console.log('❌ API 서버 연결 실패:', error.message)
    results.failed++
  }

  // 2. 프론트엔드 사이트 연결 테스트
  try {
    results.total++
    const response = await axios.get(FRONTEND_URL, { timeout: 10000 })
    if (response.status === 200 && response.data.includes('브이래닛')) {
      console.log('✅ 프론트엔드 사이트 연결: 정상')
      results.passed++
    } else {
      console.log('❌ 프론트엔드 사이트 응답 이상')
      results.failed++
    }
  } catch (error) {
    console.log('❌ 프론트엔드 연결 실패:', error.message)
    results.failed++
  }

  // 3. 회원가입 API 테스트
  try {
    results.total++
    const testUser = {
      username: `prodtest${Date.now()}@example.com`,
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      nickname: `ProdUser${Date.now()}`
    }
    
    const response = await axios.post(`${PRODUCTION_API}/api/users/signup/`, testUser, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ 회원가입 API: 정상 동작')
      results.passed++
    } else {
      console.log('❌ 회원가입 API 응답 이상:', response.status)
      results.failed++
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('⚠️ 회원가입 API 테스트:', error.response.status, error.response.data.message || 'API 응답')
    } else {
      console.log('❌ 회원가입 API 연결 실패:', error.message)
    }
    results.failed++
  }

  // 4. 입력 검증 API 테스트
  try {
    results.total++
    const invalidEmail = 'invalid-email'
    const response = await axios.post(`${PRODUCTION_API}/api/users/check-email/`, 
      { email: invalidEmail },
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
    if (response.data.message && response.data.message.includes('올바른 이메일')) {
      console.log('✅ 입력 검증 시스템: 정상 동작')
      results.passed++
    } else {
      console.log('❌ 입력 검증 미작동')
      results.failed++
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message && error.response.data.message.includes('올바른 이메일')) {
      console.log('✅ 입력 검증 시스템: 정상 동작')
      results.passed++
    } else {
      console.log('❌ 입력 검증 API 오류:', error.message)
      results.failed++
    }
  }

  // 결과 출력
  console.log('\n============================================================')
  console.log('🎯 운영 환경 검증 결과')
  console.log('============================================================')
  console.log(`총 테스트: ${results.total}개`)
  console.log(`성공: ${results.passed}개`)
  console.log(`실패: ${results.failed}개`)
  console.log(`성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`)
  
  if (results.passed >= results.total * 0.8) {
    console.log('\n🎉 배포 성공!')
    console.log('✅ 운영 환경이 정상적으로 작동하고 있습니다.')
    console.log('\n📋 주요 기능 상태:')
    console.log('   🌐 API 서버: 정상')
    console.log('   🖥️ 프론트엔드: 정상')
    console.log('   🔐 사용자 인증: 정상')
    console.log('   🛡️ 입력 검증: 정상')
    
    console.log('\n🔗 접속 링크:')
    console.log(`   프론트엔드: ${FRONTEND_URL}`)
    console.log(`   API 서버: ${PRODUCTION_API}`)
  } else {
    console.log('\n⚠️ 일부 기능에 문제가 있을 수 있습니다.')
    console.log('추가 점검이 필요합니다.')
  }
  
  console.log('\n============================================================')
}

testProduction().catch(console.error)