const axios = require('axios')

const API_BASE = 'https://videoplanet.up.railway.app'  // Production API for testing

async function testJWT() {
  console.log('🔐 JWT 토큰 테스트 (Production API)\n')
  
  // 프로덕션에서 이미 존재하는 테스트 계정 사용
  const testCredentials = {
    email: 'test@example.com',
    password: 'test1234'
  }
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 시도...')
    const loginRes = await axios.post(`${API_BASE}/api/users/login/`, testCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('   ✅ 로그인 성공')
    const token = loginRes.data.access || loginRes.data.vridge_session
    console.log('   📝 토큰 타입:', loginRes.data.access ? 'access' : 'vridge_session')
    console.log('   📝 토큰 획득:', token ? '성공' : '실패')
    
    if (!token) {
      console.log('   ❌ 토큰이 없습니다')
      return
    }
    
    // 2. 인증된 요청 테스트
    console.log('\n2️⃣ 인증된 요청 테스트...')
    
    // 프로젝트 목록 조회
    const projectsRes = await axios.get(`${API_BASE}/api/project/list/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('   ✅ 프로젝트 목록 조회 성공')
    console.log('   📝 프로젝트 수:', projectsRes.data.result?.length || 0)
    
    // 3. 프로필 조회
    console.log('\n3️⃣ 프로필 조회...')
    const profileRes = await axios.get(`${API_BASE}/api/users/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('   ✅ 프로필 조회 성공')
    console.log('   📝 사용자:', profileRes.data.username || profileRes.data.email)
    console.log('   📝 닉네임:', profileRes.data.nickname)
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.response?.data?.message || error.message)
    if (error.response) {
      console.error('   상태 코드:', error.response.status)
      console.error('   응답:', JSON.stringify(error.response.data, null, 2))
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('테스트 완료!')
}

testJWT().catch(console.error)