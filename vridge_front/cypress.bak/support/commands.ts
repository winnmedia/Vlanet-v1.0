/// <reference types="cypress" />

// 커스텀 명령어 타입 정의
declare namespace Cypress {
  interface Chainable {
    login(email?: string, password?: string): Chainable<void>
    logout(): Chainable<void>
    createProject(projectData: any): Chainable<void>
    uploadVideo(projectId: string, videoFile: string): Chainable<void>
    checkAccessibility(context?: any, options?: any): Chainable<void>
    waitForLoadingToFinish(): Chainable<void>
  }
}

// 로그인 명령어
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/Login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/Home')
  cy.window().its('localStorage.token').should('exist')
})

// 로그아웃 명령어
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token')
    win.localStorage.removeItem('user')
  })
  cy.visit('/Login')
})

// 프로젝트 생성 명령어
Cypress.Commands.add('createProject', (projectData) => {
  const defaultData = {
    name: 'Test Project',
    client: 'Test Client',
    description: 'Test Description',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  const data = { ...defaultData, ...projectData }
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/projects/create/`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: data
  })
})

// 비디오 업로드 명령어
Cypress.Commands.add('uploadVideo', (projectId, videoFile) => {
  cy.get('input[type="file"]').selectFile(videoFile, { force: true })
  cy.get('button').contains('업로드').click()
  cy.wait('@uploadVideo')
})

// 접근성 검사 명령어 (cypress-axe 사용)
Cypress.Commands.add('checkAccessibility', (context, options) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

// 로딩 완료 대기 명령어
Cypress.Commands.add('waitForLoadingToFinish', () => {
  cy.get('.loading-spinner', { timeout: 10000 }).should('not.exist')
  cy.get('[aria-busy="true"]', { timeout: 10000 }).should('not.exist')
})