const axios = require('axios')

const API_BASE = 'http://localhost:8000'

async function testSimpleFlow() {
  console.log('🧪 간단한 프로젝트 생성 테스트\n')
  
  const timestamp = Date.now()
  
  // 1. 회원가입
  console.log('1️⃣ 회원가입...')
  try {
    const signupData = {
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      nickname: `TestUser${timestamp}`
    }
    
    const signupRes = await axios.post(`${API_BASE}/api/users/signup/`, signupData)
    console.log('   ✅ 회원가입 성공')
    console.log('   📝 응답:', signupRes.data.message)
    
    // JWT 토큰 획득
    const token = signupRes.data.vridge_session
    if (!token) {
      console.log('   ❌ 토큰이 없습니다')
      return
    }
    
    // 2. 프로젝트 생성
    console.log('\n2️⃣ 프로젝트 생성...')
    const projectData = {
      project_name: `테스트 프로젝트 ${new Date().toLocaleString('ko-KR')}`,
      description: '자동화 테스트를 위한 프로젝트입니다.',
      client_name: '테스트 클라이언트',
      reference_link: 'https://example.com'
    }
    
    const projectRes = await axios.post(`${API_BASE}/api/project/create/`, projectData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('   ✅ 프로젝트 생성 성공')
    console.log('   📝 프로젝트 ID:', projectRes.data.id)
    console.log('   📝 프로젝트명:', projectRes.data.project_name)
    
    // 3. 프로젝트 목록 확인
    console.log('\n3️⃣ 프로젝트 목록 확인...')
    const listRes = await axios.get(`${API_BASE}/api/project/list/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('   ✅ 프로젝트 목록 조회 성공')
    console.log('   📝 총 프로젝트 수:', listRes.data.result?.length || 0)
    
    const createdProject = listRes.data.result?.find(p => p.id === projectRes.data.id)
    if (createdProject) {
      console.log('   ✅ 생성한 프로젝트가 목록에 있습니다')
    } else {
      console.log('   ❌ 생성한 프로젝트를 찾을 수 없습니다')
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.response?.data || error.message)
    if (error.response) {
      console.error('   상태 코드:', error.response.status)
      console.error('   응답 데이터:', JSON.stringify(error.response.data, null, 2))
    }
  }
  
  console.log('\n테스트 완료!')
}

testSimpleFlow().catch(console.error)