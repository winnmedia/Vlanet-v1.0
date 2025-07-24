// 프로젝트 디렉토리에서 실행
const { spawn } = require('child_process')
const axios = require('axios')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function runDebugTest() {
  console.log('\n=== 페이지 로딩 디버그 테스트 ===\n')
  
  // 1. 프론트엔드 서버 시작
  console.log('1. 프론트엔드 개발 서버 시작...')
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: './vridge_front',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  
  let frontendReady = false
  
  frontend.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('ready')) {
      frontendReady = true
    }
    if (output.includes('error') || output.includes('Error')) {
      console.error('❌ 프론트엔드 에러:', output)
    }
  })
  
  frontend.stderr.on('data', (data) => {
    console.error('❌ 프론트엔드 stderr:', data.toString())
  })
  
  // 서버 준비 대기
  console.log('\n서버 시작 대기 중...')
  let attempts = 0
  while (!frontendReady && attempts < 30) {
    await delay(1000)
    attempts++
    
    // 포트 확인
    try {
      const response = await axios.get('http://localhost:3000', { timeout: 1000 })
      if (response.status === 200) {
        frontendReady = true
        console.log('✅ 프론트엔드 서버 준비 완료')
        break
      }
    } catch (error) {
      // 아직 준비 중
    }
  }
  
  if (!frontendReady) {
    console.error('❌ 프론트엔드 서버 시작 실패')
    frontend.kill()
    process.exit(1)
  }
  
  // 2. 페이지 접근 테스트
  console.log('\n2. 페이지 접근 테스트...')
  
  const testPages = [
    { name: '메인 페이지', url: 'http://localhost:3000/' },
    { name: '로그인 페이지', url: 'http://localhost:3000/login' },
    { name: '영상기획 페이지', url: 'http://localhost:3000/videoplanning' },
    { name: '프로젝트 생성 페이지', url: 'http://localhost:3000/project/create' },
  ]
  
  for (const page of testPages) {
    console.log(`\n🔍 ${page.name} 테스트...`)
    try {
      const response = await axios.get(page.url, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // 500 미만은 성공으로 처리
      })
      
      if (response.status === 200) {
        console.log(`  ✅ ${page.name}: 성공 (${response.status})`)
        
        // HTML 내용 확인
        const html = response.data
        if (html.includes('__next')) {
          console.log('  ✅ Next.js 앱 감지됨')
        }
        
        if (html.includes('error') || html.includes('Error')) {
          console.log('  ⚠️  HTML에 에러 키워드 포함됨')
        }
      } else {
        console.log(`  ⚠️  ${page.name}: HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`  ❌ ${page.name}: ${error.message}`)
    }
  }
  
  // 3. API 연결 테스트
  console.log('\n3. API 연결 테스트...')
  try {
    const apiResponse = await axios.get('http://localhost:8000/api/health/', {
      timeout: 5000
    })
    console.log('✅ 백엔드 API 연결 성공')
  } catch (error) {
    console.error('❌ 백엔드 API 연결 실패:', error.message)
  }
  
  // 테스트 종료
  console.log('\n테스트 종료 중...')
  frontend.kill()
  
  console.log('\n=== 디버그 테스트 완료 ===')
}

runDebugTest().catch(error => {
  console.error('\n❌ 테스트 실행 중 오류:', error)
  process.exit(1)
})