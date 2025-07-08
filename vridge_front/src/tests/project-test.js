const axios = require('axios')

const API_BASE = 'http://localhost:8000'

async function testProjectCreation() {
  console.log('🔧 프로젝트 생성 및 연동 테스트\n')

  // 1. 테스트 계정으로 로그인
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123!'
  }

  let token = null

  try {
    console.log('1️⃣ 로그인 시도...')
    const loginRes = await axios.post(`${API_BASE}/api/users/login/`, testUser)
    token = loginRes.data.access
    console.log('   ✅ 로그인 성공')
  } catch (error) {
    console.log('   ❌ 로그인 실패. 새 계정을 생성합니다.')
    
    // 회원가입
    const timestamp = Date.now()
    const newUser = {
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      nickname: `TestUser${timestamp}`
    }
    
    try {
      await axios.post(`${API_BASE}/api/users/signup/`, newUser)
      console.log('   ✅ 회원가입 성공')
      
      // 다시 로그인
      const loginRes = await axios.post(`${API_BASE}/api/users/login/`, {
        email: newUser.email,
        password: newUser.password
      })
      token = loginRes.data.access
      console.log('   ✅ 로그인 성공')
    } catch (err) {
      console.error('   ❌ 회원가입/로그인 실패:', err.response?.data || err.message)
      return
    }
  }

  // 2. 프로젝트 생성
  console.log('\n2️⃣ 프로젝트 생성...')
  const projectData = {
    project_name: `테스트 프로젝트 ${new Date().toLocaleString('ko-KR')}`,
    description: '자동화 테스트를 위한 프로젝트입니다.',
    client_name: '테스트 클라이언트',
    reference_link: 'https://example.com'
  }

  let createdProject = null

  try {
    const createRes = await axios.post(`${API_BASE}/api/project/create/`, projectData, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    createdProject = createRes.data
    console.log('   ✅ 프로젝트 생성 성공')
    console.log('   📋 프로젝트 ID:', createdProject.id)
    console.log('   📋 프로젝트명:', createdProject.project_name)
  } catch (error) {
    console.error('   ❌ 프로젝트 생성 실패:', error.response?.data || error.message)
    return
  }

  // 3. 프로젝트가 각 페이지에서 보이는지 확인
  console.log('\n3️⃣ 프로젝트 연동 확인...')

  // 3.1 프로젝트 목록
  try {
    const listRes = await axios.get(`${API_BASE}/api/project/list/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const foundInList = listRes.data.result?.some(p => p.id === createdProject.id)
    console.log(`   ${foundInList ? '✅' : '❌'} 프로젝트 관리 페이지에서 확인`)
  } catch (error) {
    console.error('   ❌ 프로젝트 목록 조회 실패:', error.response?.data || error.message)
  }

  // 3.2 전체일정
  try {
    const scheduleRes = await axios.get(`${API_BASE}/api/project/schedule/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const foundInSchedule = scheduleRes.data.projects?.some(p => p.id === createdProject.id)
    console.log(`   ${foundInSchedule ? '✅' : '❌'} 전체일정 페이지에서 확인`)
  } catch (error) {
    // 전체일정 API가 다를 수 있음
    console.log('   ⚠️  전체일정 API 엔드포인트 확인 필요')
  }

  // 3.3 영상 피드백
  try {
    const feedbackRes = await axios.get(`${API_BASE}/api/feedback/view/${createdProject.id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('   ✅ 영상 피드백 페이지 접근 가능')
  } catch (error) {
    console.error('   ❌ 영상 피드백 페이지 접근 실패:', error.response?.data || error.message)
  }

  // 4. 중복 생성 방지 테스트
  console.log('\n4️⃣ 중복 생성 방지 테스트...')
  try {
    await axios.post(`${API_BASE}/api/project/create/`, projectData, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('   ❌ 중복 생성이 허용됨 (문제 발생)')
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('   ✅ 중복 생성 방지 정상 작동')
    } else {
      console.error('   ❌ 예상하지 못한 오류:', error.response?.data || error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('테스트 완료!')
  console.log('='.repeat(50))
}

testProjectCreation().catch(console.error)