describe('인증 테스트', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('로그인', () => {
    it('올바른 자격 증명으로 로그인 성공', () => {
      cy.visit('/Login')
      
      // 로그인 폼 확인
      cy.get('h1').contains('로그인').should('be.visible')
      
      // 이메일 입력
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="email"]').should('have.value', 'test@example.com')
      
      // 비밀번호 입력
      cy.get('input[type="password"]').type('password123')
      cy.get('input[type="password"]').should('have.value', 'password123')
      
      // 로그인 버튼 클릭
      cy.intercept('POST', '**/api/users/login/', {
        statusCode: 200,
        body: {
          token: 'fake-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            nickname: 'Test User'
          }
        }
      }).as('login')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@login')
      
      // 홈 페이지로 리다이렉트 확인
      cy.url().should('include', '/Home')
      cy.get('h1').contains('대시보드').should('be.visible')
    })

    it('잘못된 자격 증명으로 로그인 실패', () => {
      cy.visit('/Login')
      
      cy.get('input[type="email"]').type('wrong@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      
      cy.intercept('POST', '**/api/users/login/', {
        statusCode: 401,
        body: {
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        }
      }).as('loginFail')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@loginFail')
      
      // 에러 메시지 확인
      cy.get('[role="alert"]').contains('이메일 또는 비밀번호가 올바르지 않습니다.').should('be.visible')
      cy.url().should('include', '/Login')
    })

    it('필수 필드 유효성 검사', () => {
      cy.visit('/Login')
      
      // 빈 폼으로 제출
      cy.get('button[type="submit"]').click()
      
      // HTML5 유효성 검사 메시지 확인
      cy.get('input[type="email"]:invalid').should('exist')
      cy.get('input[type="password"]:invalid').should('exist')
    })

    it('비밀번호 표시/숨기기 토글', () => {
      cy.visit('/Login')
      
      const password = 'mySecretPassword'
      cy.get('input[type="password"]').type(password)
      
      // 비밀번호 표시 버튼 클릭
      cy.get('button[aria-label="비밀번호 표시"]').click()
      cy.get('input[type="text"]').should('have.value', password)
      
      // 비밀번호 숨기기 버튼 클릭
      cy.get('button[aria-label="비밀번호 숨기기"]').click()
      cy.get('input[type="password"]').should('have.value', password)
    })
  })

  describe('로그아웃', () => {
    beforeEach(() => {
      // 로그인 상태 설정
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'fake-jwt-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: '1',
          email: 'test@example.com',
          nickname: 'Test User'
        }))
      })
    })

    it('로그아웃 성공', () => {
      cy.visit('/Home')
      
      // 사이드바에서 로그아웃 버튼 클릭
      cy.get('button').contains('로그아웃').click()
      
      // 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/Login')
      
      // 로컬 스토리지 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
        expect(win.localStorage.getItem('user')).to.be.null
      })
    })
  })

  describe('인증 보호 라우트', () => {
    it('로그인하지 않은 사용자는 로그인 페이지로 리다이렉트', () => {
      // 보호된 페이지 접근 시도
      cy.visit('/Home')
      cy.url().should('include', '/Login')
      
      cy.visit('/Project/1')
      cy.url().should('include', '/Login')
      
      cy.visit('/VideoPlanning')
      cy.url().should('include', '/Login')
    })

    it('로그인한 사용자는 보호된 페이지 접근 가능', () => {
      // 로그인 상태 설정
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'fake-jwt-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: '1',
          email: 'test@example.com',
          nickname: 'Test User'
        }))
      })
      
      cy.visit('/Home')
      cy.url().should('include', '/Home')
      cy.get('h1').contains('대시보드').should('be.visible')
    })
  })
})