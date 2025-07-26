describe('프로젝트 관리 테스트', () => {
  beforeEach(() => {
    // 로그인
    cy.login()
    
    // API 모킹
    cy.intercept('GET', '**/api/projects/', {
      statusCode: 200,
      body: {
        projects: [
          {
            id: '1',
            name: '테스트 프로젝트 1',
            client: '클라이언트 A',
            status: 'active',
            color: '#1631F8',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            is_important: true
          },
          {
            id: '2',
            name: '테스트 프로젝트 2',
            client: '클라이언트 B',
            status: 'active',
            color: '#34C759',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            is_important: false
          }
        ]
      }
    }).as('getProjects')
  })

  describe('프로젝트 목록', () => {
    it('프로젝트 목록 표시', () => {
      cy.visit('/Home')
      cy.wait('@getProjects')
      
      // 프로젝트 카드 확인
      cy.get('[role="article"]').should('have.length', 2)
      cy.contains('테스트 프로젝트 1').should('be.visible')
      cy.contains('테스트 프로젝트 2').should('be.visible')
      cy.contains('클라이언트 A').should('be.visible')
      cy.contains('클라이언트 B').should('be.visible')
    })

    it('프로젝트 검색', () => {
      cy.visit('/Home')
      cy.wait('@getProjects')
      
      // 검색어 입력
      cy.get('input[type="search"]').type('프로젝트 1')
      
      // 검색 결과 확인
      cy.get('[role="article"]').should('have.length', 1)
      cy.contains('테스트 프로젝트 1').should('be.visible')
      cy.contains('테스트 프로젝트 2').should('not.exist')
    })

    it('프로젝트 필터링 (이번 달/다음 달)', () => {
      cy.visit('/Home')
      cy.wait('@getProjects')
      
      // 이번 달 탭 클릭
      cy.get('[role="tab"]').contains('이번 달').click()
      cy.get('[role="tab"][aria-selected="true"]').should('contain', '이번 달')
      
      // 다음 달 탭 클릭
      cy.get('[role="tab"]').contains('다음 달').click()
      cy.get('[role="tab"][aria-selected="true"]').should('contain', '다음 달')
      
      // 전체 탭으로 돌아가기
      cy.get('[role="tab"]').contains('전체').click()
      cy.get('[role="article"]').should('have.length', 2)
    })
  })

  describe('프로젝트 생성', () => {
    it('새 프로젝트 생성 성공', () => {
      cy.visit('/Home')
      
      // 새 프로젝트 버튼 클릭
      cy.get('button').contains('새 프로젝트').click()
      cy.url().should('include', '/Create')
      
      // 프로젝트 정보 입력
      cy.get('input[name="name"]').type('신규 프로젝트')
      cy.get('input[name="client"]').type('신규 클라이언트')
      cy.get('textarea[name="description"]').type('프로젝트 설명입니다.')
      
      // 마감일 선택
      cy.get('input[type="date"]').type('2025-12-31')
      
      // 색상 선택
      cy.get('[data-testid="color-picker"]').click()
      cy.get('[data-color="#FF3B30"]').click()
      
      // API 모킹
      cy.intercept('POST', '**/api/projects/create/', {
        statusCode: 201,
        body: {
          id: '3',
          name: '신규 프로젝트',
          client: '신규 클라이언트',
          description: '프로젝트 설명입니다.',
          color: '#FF3B30',
          deadline: '2025-12-31T00:00:00Z'
        }
      }).as('createProject')
      
      // 생성 버튼 클릭
      cy.get('button[type="submit"]').contains('생성').click()
      cy.wait('@createProject')
      
      // 프로젝트 상세 페이지로 이동 확인
      cy.url().should('include', '/Project/3')
    })

    it('필수 필드 검증', () => {
      cy.visit('/Create')
      
      // 빈 폼 제출
      cy.get('button[type="submit"]').contains('생성').click()
      
      // 에러 메시지 확인
      cy.get('[role="alert"]').should('contain', '프로젝트 이름은 필수입니다')
    })
  })

  describe('프로젝트 상세', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/projects/1/', {
        statusCode: 200,
        body: {
          id: '1',
          name: '테스트 프로젝트 1',
          client: '클라이언트 A',
          description: '프로젝트 설명',
          status: 'active',
          color: '#1631F8',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          videos: [],
          feedback: [],
          members: []
        }
      }).as('getProjectDetail')
    })

    it('프로젝트 상세 정보 표시', () => {
      cy.visit('/Project/1')
      cy.wait('@getProjectDetail')
      
      // 프로젝트 정보 확인
      cy.contains('테스트 프로젝트 1').should('be.visible')
      cy.contains('클라이언트 A').should('be.visible')
      cy.contains('프로젝트 설명').should('be.visible')
    })

    it('프로젝트 수정', () => {
      cy.visit('/Project/1')
      cy.wait('@getProjectDetail')
      
      // 수정 버튼 클릭
      cy.get('button').contains('수정').click()
      
      // 프로젝트 이름 수정
      cy.get('input[name="name"]').clear().type('수정된 프로젝트')
      
      // API 모킹
      cy.intercept('PUT', '**/api/projects/1/update/', {
        statusCode: 200,
        body: {
          id: '1',
          name: '수정된 프로젝트',
          client: '클라이언트 A'
        }
      }).as('updateProject')
      
      // 저장 버튼 클릭
      cy.get('button').contains('저장').click()
      cy.wait('@updateProject')
      
      // 수정된 내용 확인
      cy.contains('수정된 프로젝트').should('be.visible')
    })

    it('프로젝트 삭제', () => {
      cy.visit('/Project/1')
      cy.wait('@getProjectDetail')
      
      // 삭제 버튼 클릭
      cy.get('button').contains('삭제').click()
      
      // 확인 모달
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('정말로 이 프로젝트를 삭제하시겠습니까?').should('be.visible')
      
      // API 모킹
      cy.intercept('DELETE', '**/api/projects/1/delete/', {
        statusCode: 204
      }).as('deleteProject')
      
      // 확인 버튼 클릭
      cy.get('[role="dialog"] button').contains('삭제').click()
      cy.wait('@deleteProject')
      
      // 홈으로 리다이렉트 확인
      cy.url().should('include', '/Home')
    })
  })

  describe('프로젝트 초대', () => {
    it('팀원 초대', () => {
      cy.visit('/Project/1')
      cy.wait('@getProjectDetail')
      
      // 팀원 초대 버튼 클릭
      cy.get('button').contains('팀원 초대').click()
      
      // 이메일 입력
      cy.get('input[type="email"]').type('newmember@example.com')
      
      // 역할 선택
      cy.get('select[name="role"]').select('editor')
      
      // API 모킹
      cy.intercept('POST', '**/api/invitations/send/', {
        statusCode: 200,
        body: {
          id: '1',
          email: 'newmember@example.com',
          role: 'editor',
          status: 'pending'
        }
      }).as('sendInvitation')
      
      // 초대 보내기 버튼 클릭
      cy.get('button').contains('초대 보내기').click()
      cy.wait('@sendInvitation')
      
      // 성공 메시지 확인
      cy.contains('초대를 보냈습니다').should('be.visible')
    })
  })
})