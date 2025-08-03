// 프로젝트 생성 페이지 버튼 활성화 테스트 스크립트

const puppeteer = require('puppeteer')

async function testProjectCreateButton() {
  let browser
  try {
    console.log('🚀 프로젝트 생성 페이지 테스트 시작...')
    
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    
    // 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.text().includes('[ProjectCreate]')) {
        console.log('📝 Console:', msg.text())
      }
    })
    
    console.log('🌐 페이지 로딩 중...')
    await page.goto('http://localhost:3000/ProjectCreate', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    console.log('✅ 페이지 로딩 완료')
    
    // 버튼 초기 상태 확인
    const initialButtonState = await page.evaluate(() => {
      const button = document.querySelector('button.submit')
      return {
        disabled: button?.disabled,
        text: button?.textContent,
        className: button?.className
      }
    })
    console.log('🔘 초기 버튼 상태:', initialButtonState)
    
    // 필수 필드 입력
    console.log('📝 필수 필드 입력 중...')
    
    await page.type('input[name="name"]', '테스트 프로젝트')
    await page.waitForTimeout(500)
    
    await page.type('input[name="manager"]', '테스트 담당자') 
    await page.waitForTimeout(500)
    
    await page.type('input[name="consumer"]', '테스트 고객사')
    await page.waitForTimeout(500)
    
    await page.type('textarea[name="description"]', '테스트 프로젝트 설명입니다.')
    await page.waitForTimeout(500)
    
    // 버튼 상태 재확인
    const finalButtonState = await page.evaluate(() => {
      const button = document.querySelector('button.submit')
      return {
        disabled: button?.disabled,
        text: button?.textContent,
        className: button?.className,
        style: button?.style?.backgroundColor
      }
    })
    console.log('🔘 입력 후 버튼 상태:', finalButtonState)
    
    // 입력 값 확인
    const inputValues = await page.evaluate(() => {
      return {
        name: document.querySelector('input[name="name"]')?.value,
        manager: document.querySelector('input[name="manager"]')?.value,
        consumer: document.querySelector('input[name="consumer"]')?.value,
        description: document.querySelector('textarea[name="description"]')?.value
      }
    })
    console.log('📋 입력된 값들:', inputValues)
    
    if (!finalButtonState.disabled) {
      console.log('✅ 성공: 버튼이 활성화되었습니다!')
    } else {
      console.log('❌ 실패: 버튼이 여전히 비활성화되어 있습니다.')
    }
    
    await page.waitForTimeout(3000)
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

testProjectCreateButton()