// E2E 테스트 지원 파일
import './commands'

// Cypress 에러 처리
Cypress.on('uncaught:exception', (err, runnable) => {
  // Next.js hydration 에러 무시
  if (err.message.includes('Hydration')) {
    return false
  }
  // 기타 예상치 못한 에러는 테스트 실패로 처리
  return true
})

// 각 테스트 전 실행
beforeEach(() => {
  // 로컬 스토리지 초기화
  cy.clearLocalStorage()
  // 쿠키 초기화
  cy.clearCookies()
  // 인터셉트 설정
  cy.intercept('GET', '/api/**', { statusCode: 200 }).as('api')
})

// 테스트 후 정리
afterEach(() => {
  // 스크린샷 자동 저장 (실패 시)
  if (Cypress.currentTest.state === 'failed') {
    cy.screenshot(`failed-${Cypress.currentTest.title}`)
  }
})