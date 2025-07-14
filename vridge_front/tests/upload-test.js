const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const API_BASE = 'http://localhost:8000'

async function testVideoUpload() {
  console.log('🎥 영상 업로드 테스트\n')
  
  // 1. 로그인
  console.log('1️⃣ 로그인...')
  const timestamp = Date.now()
  let token = null
  
  try {
    // 테스트 계정 생성
    const user = {
      email: `upload_test${timestamp}@example.com`,
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      nickname: `UploadTest${timestamp}`
    }
    
    await axios.post(`${API_BASE}/api/users/signup/`, user)
    console.log('   ✅ 회원가입 성공')
    
    // 로그인
    const loginRes = await axios.post(`${API_BASE}/api/users/login/`, {
      email: user.email,
      password: user.password
    })
    
    token = loginRes.data.vridge_session || loginRes.data.access
    console.log('   ✅ 로그인 성공')
  } catch (error) {
    console.error('   ❌ 로그인 실패:', error.response?.data || error.message)
    return
  }
  
  // 2. 프로젝트 생성
  console.log('\n2️⃣ 프로젝트 생성...')
  let projectId = null
  
  try {
    const projectData = {
      project_name: `업로드 테스트 프로젝트 ${new Date().toLocaleString('ko-KR')}`,
      description: '영상 업로드 테스트를 위한 프로젝트',
      client_name: '테스트 클라이언트'
    }
    
    const projectRes = await axios.post(`${API_BASE}/api/project/create/`, projectData, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    projectId = projectRes.data.id
    console.log('   ✅ 프로젝트 생성 성공')
    console.log('   📝 프로젝트 ID:', projectId)
  } catch (error) {
    console.error('   ❌ 프로젝트 생성 실패:', error.response?.data || error.message)
    return
  }
  
  // 3. OPTIONS preflight 테스트
  console.log('\n3️⃣ CORS preflight 테스트...')
  try {
    const optionsRes = await axios.options(`${API_BASE}/api/projects/${projectId}/feedback/upload/`, {
      headers: {
        'Origin': 'https://vlanet.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    })
    
    console.log('   ✅ OPTIONS 요청 성공')
    console.log('   📝 CORS 헤더:')
    console.log('      Allow-Origin:', optionsRes.headers['access-control-allow-origin'])
    console.log('      Allow-Methods:', optionsRes.headers['access-control-allow-methods'])
    console.log('      Allow-Headers:', optionsRes.headers['access-control-allow-headers'])
  } catch (error) {
    console.error('   ❌ OPTIONS 요청 실패:', error.response?.status, error.response?.statusText)
  }
  
  // 4. 파일 업로드 테스트 (더미 파일 생성)
  console.log('\n4️⃣ 파일 업로드 테스트...')
  try {
    const form = new FormData()
    
    // 작은 더미 비디오 파일 생성
    const dummyVideo = Buffer.from('dummy video content for testing')
    form.append('files', dummyVideo, {
      filename: 'test_video.mp4',
      contentType: 'video/mp4'
    })
    
    const uploadRes = await axios.post(
      `${API_BASE}/api/projects/${projectId}/feedback/upload/`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        }
      }
    )
    
    console.log('   ✅ 파일 업로드 성공')
    console.log('   📝 응답:', uploadRes.data)
  } catch (error) {
    console.error('   ❌ 파일 업로드 실패:', error.response?.data || error.message)
    if (error.response) {
      console.error('   상태 코드:', error.response.status)
      console.error('   헤더:', error.response.headers)
    }
  }
  
  // 5. 업로드된 파일 확인
  console.log('\n5️⃣ 업로드된 파일 확인...')
  try {
    const feedbackRes = await axios.get(`${API_BASE}/api/projects/${projectId}/feedback/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (feedbackRes.data.result?.files) {
      console.log('   ✅ 파일이 업로드되었습니다')
      console.log('   📝 파일 URL:', feedbackRes.data.result.files)
    } else {
      console.log('   ❌ 파일이 없습니다')
    }
  } catch (error) {
    console.error('   ❌ 피드백 조회 실패:', error.response?.data || error.message)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('테스트 완료!')
}

testVideoUpload().catch(console.error)