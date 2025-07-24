const puppeteer = require('puppeteer')
const axios = require('axios')

const API_URL = 'http://localhost:8000'
const FRONTEND_URL = 'http://localhost:3000'

async function testPageLoading() {
  console.log('\n=== 페이지 로딩 테스트 시작 ===')
  console.log(`API URL: ${API_URL}`)
  console.log(`Frontend URL: ${FRONTEND_URL}`)
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    if (type === 'error') {
      console.error('❌ 브라우저 오류:', text)
    } else if (type === 'warning') {
      console.warn('⚠️  브라우저 경고:', text)
    } else {
      console.log('📝 브라우저 로그:', text)
    }
  })
  
  // 페이지 오류 캡처
  page.on('pageerror', error => {
    console.error('❌ 페이지 오류:', error.message)
  })
  
  // 네트워크 요청 모니터링
  page.on('requestfailed', request => {
    console.error('❌ 요청 실패:', request.url(), request.failure().errorText)
  })
  
  try {
    // 1. 로그인
    console.log('\n1. 로그인 시도...')
    await page.goto(`${FRONTEND_URL}/login`)
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    
    await page.type('input[name="email"]', 'test@example.com')
    await page.type('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    
    // 로그인 성공 대기
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log('✅ 로그인 성공')
    
    // 토큰 확인
    const cookies = await page.cookies()
    const sessionCookie = cookies.find(c => c.name === 'vridge_session')
    if (sessionCookie) {
      console.log('✅ 세션 쿠키 확인됨')
    }
    
    // 2. 영상기획 페이지 테스트
    console.log('\n2. 영상기획 페이지 테스트...')
    try {
      await page.goto(`${FRONTEND_URL}/videoplanning`, { waitUntil: 'networkidle0' })
      await page.waitForSelector('.video-planning-page, .main', { timeout: 10000 })
      
      // 페이지 내용 확인
      const pageContent = await page.evaluate(() => {
        return {
          title: document.querySelector('h1')?.textContent,
          bodyText: document.body.textContent.substring(0, 200),
          hasContent: document.querySelector('.video-planning-page') !== null
        }
      })
      
      console.log('페이지 내용:', pageContent)
      
      if (pageContent.hasContent) {
        console.log('✅ 영상기획 페이지 로드 성공')
      } else {
        console.log('❌ 영상기획 페이지 콘텐츠 없음')
      }
    } catch (error) {
      console.error('❌ 영상기획 페이지 로드 실패:', error.message)
    }
    
    // 3. 프로젝트 관리 페이지 테스트
    console.log('\n3. 프로젝트 관리 페이지 테스트...')
    try {
      // 먼저 프로젝트 목록을 가져옴
      const projectsResponse = await axios.get(`${API_URL}/api/project/`, {
        headers: {
          'Authorization': `Bearer ${sessionCookie?.value || ''}`
        }
      })
      
      if (projectsResponse.data && projectsResponse.data.result && projectsResponse.data.result.length > 0) {
        const projectId = projectsResponse.data.result[0].id
        console.log(`첫 번째 프로젝트 ID: ${projectId}`)
        
        await page.goto(`${FRONTEND_URL}/project/${projectId}`, { waitUntil: 'networkidle0' })
        await page.waitForSelector('.main, .contents', { timeout: 10000 })
        
        const projectContent = await page.evaluate(() => {
          return {
            hasContent: document.querySelector('.main') !== null,
            errorMessage: document.querySelector('.error-message')?.textContent
          }
        })
        
        if (projectContent.hasContent) {
          console.log('✅ 프로젝트 관리 페이지 로드 성공')
        } else {
          console.log('❌ 프로젝트 관리 페이지 콘텐츠 없음')
          if (projectContent.errorMessage) {
            console.log('오류 메시지:', projectContent.errorMessage)
          }
        }
      } else {
        console.log('⚠️  프로젝트가 없어서 테스트 스킵')
      }
    } catch (error) {
      console.error('❌ 프로젝트 관리 페이지 로드 실패:', error.message)
    }
    
    // 4. 피드백 페이지 테스트
    console.log('\n4. 피드백 페이지 테스트...')
    try {
      // 먼저 피드백이 있는 프로젝트를 찾음
      const feedbacksResponse = await axios.get(`${API_URL}/api/feedbacks/`, {
        headers: {
          'Authorization': `Bearer ${sessionCookie?.value || ''}`
        }
      })
      
      if (feedbacksResponse.data && feedbacksResponse.data.results && feedbacksResponse.data.results.length > 0) {
        const feedbackProjectId = feedbacksResponse.data.results[0].project
        console.log(`피드백이 있는 프로젝트 ID: ${feedbackProjectId}`)
        
        await page.goto(`${FRONTEND_URL}/feedback/${feedbackProjectId}`, { waitUntil: 'networkidle0' })
        await page.waitForSelector('.main, .contents', { timeout: 10000 })
        
        const feedbackContent = await page.evaluate(() => {
          return {
            hasContent: document.querySelector('.main') !== null,
            hasVideo: document.querySelector('video, .video-js') !== null
          }
        })
        
        if (feedbackContent.hasContent) {
          console.log('✅ 피드백 페이지 로드 성공')
          if (feedbackContent.hasVideo) {
            console.log('✅ 비디오 플레이어 확인됨')
          }
        } else {
          console.log('❌ 피드백 페이지 콘텐츠 없음')
        }
      } else {
        console.log('⚠️  피드백이 없어서 테스트 스킵')
      }
    } catch (error) {
      console.error('❌ 피드백 페이지 로드 실패:', error.message)
    }
    
    console.log('\n=== 테스트 완료 ===')
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error)
  } finally {
    await browser.close()
  }
}

// 테스트 실행
testPageLoading().catch(console.error)