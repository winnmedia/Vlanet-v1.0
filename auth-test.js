const axios = require('axios')

const API_BASE = 'http://localhost:8000'

async function testAuthFlow() {
  console.log('🔐 JWT 인증 플로우 테스트\n')

  // 1. 회원가입 테스트
  console.log('1️⃣ 회원가입 테스트...')
  const testUser = {
    username: `authtest${Date.now()}@example.com`,
    password: 'TestPass123!',
    password_confirm: 'TestPass123!',
    nickname: `AuthUser${Date.now()}`
  }

  try {
    const signupResponse = await axios.post(`${API_BASE}/api/users/signup/`, testUser, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    })
    
    console.log('   ✅ 회원가입 성공:', signupResponse.status)
    
    // 2. 로그인 테스트
    console.log('\n2️⃣ 로그인 테스트...')
    const loginResponse = await axios.post(`${API_BASE}/api/users/login/`, {
      username: testUser.username,
      password: testUser.password
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    })
    
    console.log('   ✅ 로그인 성공:', loginResponse.status)
    const token = loginResponse.data.access
    console.log('   📝 받은 토큰:', token ? 'JWT 토큰 획득' : '토큰 없음')
    
    if (token) {
      // 3. 인증이 필요한 API 테스트
      console.log('\n3️⃣ 인증 API 테스트...')
      const authResponse = await axios.get(`${API_BASE}/api/project/list/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      console.log('   ✅ 인증 API 호출 성공:', authResponse.status)
      console.log('   📋 프로젝트 수:', authResponse.data.result?.length || 0)
      
      // 4. 프로필 업로드 API 테스트 (엔드포인트만)
      console.log('\n4️⃣ 프로필 업로드 API 엔드포인트 테스트...')
      try {
        const uploadResponse = await axios.post(`${API_BASE}/api/users/profile/upload-image/`, 
          new FormData(), // 빈 FormData
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
            },
            timeout: 10000
          }
        )
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('   ✅ 프로필 업로드 API 엔드포인트 정상 (파일 누락 에러 예상됨)')
          console.log('   📝 응답:', error.response.data.message)
        } else {
          console.log('   ❌ 프로필 업로드 API 오류:', error.response?.data || error.message)
        }
      }
    }
    
  } catch (error) {
    console.log('   ❌ 인증 플로우 실패:', error.response?.data || error.message)
    if (error.response) {
      console.log('   📊 상태 코드:', error.response.status)
      console.log('   📋 응답 데이터:', error.response.data)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('JWT 인증 플로우 테스트 완료')
  console.log('='.repeat(50))
}

testAuthFlow().catch(console.error)