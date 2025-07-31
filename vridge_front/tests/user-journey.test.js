const { test, expect } = require('@playwright/test');

// 테스트 설정
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
  name: '테스트 사용자'
};

// 테스트 결과 저장
const testResults = [];

test.describe('VideoPlanet 사용자 여정 MECE 테스트', () => {
  
  // Journey 1: 홈페이지 및 네비게이션
  test.describe('Journey 1: 홈페이지 및 네비게이션', () => {
    test('1.1 홈페이지 로드 및 주요 요소 확인', async ({ page }) => {
      const result = { name: '홈페이지 로드', status: '', errors: [] };
      
      try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        // 로고 확인
        const logo = await page.locator('h1.logo img').isVisible();
        expect(logo).toBeTruthy();
        
        // 헤더 버튼 확인
        const loginButton = await page.locator('button.submit:has-text("로그인")').isVisible();
        expect(loginButton).toBeTruthy();
        
        // 섹션별 바로가기 버튼 확인
        const feedbackButton = await page.locator('.feedback button.submit:has-text("바로가기")').isVisible();
        expect(feedbackButton).toBeTruthy();
        
        const projectButton = await page.locator('.project button.submit:has-text("바로가기")').isVisible();
        expect(projectButton).toBeTruthy();
        
        const commentButton = await page.locator('.comment button.submit:has-text("바로가기")').isVisible();
        expect(commentButton).toBeTruthy();
        
        result.status = '✅ 성공';
      } catch (error) {
        result.status = '❌ 실패';
        result.errors.push(error.message);
      }
      
      testResults.push(result);
    });

    test('1.2 홈페이지 버튼 클릭 동작 테스트', async ({ page }) => {
      const result = { name: '홈페이지 버튼 동작', status: '', errors: [] };
      
      try {
        await page.goto(BASE_URL);
        
        // 로그인 버튼 클릭
        await page.locator('button.submit:has-text("로그인")').click();
        await page.waitForURL('**/login');
        expect(page.url()).toContain('/login');
        
        // 홈으로 돌아가기
        await page.goto(BASE_URL);
        
        // 피드백 바로가기 클릭
        await page.locator('.feedback button.submit:has-text("바로가기")').click();
        await page.waitForTimeout(1000);
        
        result.status = '✅ 성공';
      } catch (error) {
        result.status = '❌ 실패';
        result.errors.push(error.message);
      }
      
      testResults.push(result);
    });
  });

  // Journey 2: 인증 플로우
  test.describe('Journey 2: 인증 플로우', () => {
    test('2.1 로그인 페이지 UI 요소 확인', async ({ page }) => {
      const result = { name: '로그인 페이지 UI', status: '', errors: [] };
      
      try {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        // 이메일 입력 필드
        const emailInput = await page.locator('input[type="email"], input[name="email"]').isVisible();
        expect(emailInput).toBeTruthy();
        
        // 비밀번호 입력 필드
        const passwordInput = await page.locator('input[type="password"]').isVisible();
        expect(passwordInput).toBeTruthy();
        
        // 로그인 버튼
        const loginButton = await page.locator('button:has-text("로그인"), button:has-text("Login")').first().isVisible();
        expect(loginButton).toBeTruthy();
        
        // 회원가입 링크
        const signupLink = await page.locator('text=회원가입').isVisible();
        expect(signupLink).toBeTruthy();
        
        result.status = '✅ 성공';
      } catch (error) {
        result.status = '❌ 실패';
        result.errors.push(error.message);
      }
      
      testResults.push(result);
    });

    test('2.2 회원가입 페이지 접근 및 UI 확인', async ({ page }) => {
      const result = { name: '회원가입 페이지 UI', status: '', errors: [] };
      
      try {
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // 이메일 입력 필드
        const emailInput = await page.locator('input[type="email"], input[name="email"]').isVisible();
        expect(emailInput).toBeTruthy();
        
        // 비밀번호 입력 필드들
        const passwordInputs = await page.locator('input[type="password"]').count();
        expect(passwordInputs).toBeGreaterThanOrEqual(2); // 비밀번호와 확인
        
        // 이름 입력 필드
        const nameInput = await page.locator('input[name="name"], input[placeholder*="이름"]').isVisible();
        expect(nameInput).toBeTruthy();
        
        // 가입 버튼
        const signupButton = await page.locator('button:has-text("가입"), button:has-text("회원가입")').first().isVisible();
        expect(signupButton).toBeTruthy();
        
        result.status = '✅ 성공';
      } catch (error) {
        result.status = '❌ 실패';
        result.errors.push(error.message);
      }
      
      testResults.push(result);
    });
  });

  // Journey 3: 주요 페이지 접근성
  test.describe('Journey 3: 주요 페이지 접근성', () => {
    const pages = [
      { name: '캘린더', url: '/calendar' },
      { name: '마이페이지', url: '/mypage' },
      { name: 'CMS 홈', url: '/cmshome' },
      { name: '프로젝트 생성', url: '/project/create' },
      { name: '비디오 플래닝', url: '/videoplanning' }
    ];

    pages.forEach(({ name, url }) => {
      test(`3.${pages.indexOf({ name, url }) + 1} ${name} 페이지 접근`, async ({ page }) => {
        const result = { name: `${name} 페이지 접근`, status: '', errors: [] };
        
        try {
          const response = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
          
          if (response.status() === 200 || response.status() === 304) {
            result.status = '✅ 성공';
          } else if (response.status() === 401 || response.status() === 403) {
            result.status = '⚠️ 인증 필요';
          } else {
            result.status = '❌ 실패';
            result.errors.push(`HTTP ${response.status()}`);
          }
        } catch (error) {
          result.status = '❌ 실패';
          result.errors.push(error.message);
        }
        
        testResults.push(result);
      });
    });
  });

  // Journey 4: 반응형 디자인 테스트
  test.describe('Journey 4: 반응형 디자인', () => {
    const viewports = [
      { name: '모바일', width: 375, height: 812 },
      { name: '태블릿', width: 768, height: 1024 },
      { name: '데스크톱', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`4.${viewports.indexOf({ name, width, height }) + 1} ${name} 뷰포트`, async ({ page }) => {
        const result = { name: `${name} 반응형`, status: '', errors: [] };
        
        try {
          await page.setViewportSize({ width, height });
          await page.goto(BASE_URL);
          
          // 로고 확인
          const logo = await page.locator('h1.logo').isVisible();
          expect(logo).toBeTruthy();
          
          // 주요 콘텐츠 확인
          const mainContent = await page.locator('#container').isVisible();
          expect(mainContent).toBeTruthy();
          
          result.status = '✅ 성공';
        } catch (error) {
          result.status = '❌ 실패';
          result.errors.push(error.message);
        }
        
        testResults.push(result);
      });
    });
  });

  // 테스트 결과 출력
  test.afterAll(async () => {
    console.log('\n========== 테스트 결과 요약 ==========\n');
    
    const successCount = testResults.filter(r => r.status.includes('✅')).length;
    const failCount = testResults.filter(r => r.status.includes('❌')).length;
    const warningCount = testResults.filter(r => r.status.includes('⚠️')).length;
    
    console.log(`총 테스트: ${testResults.length}`);
    console.log(`✅ 성공: ${successCount}`);
    console.log(`❌ 실패: ${failCount}`);
    console.log(`⚠️ 경고: ${warningCount}`);
    
    console.log('\n========== 상세 결과 ==========\n');
    
    testResults.forEach(result => {
      console.log(`${result.status} ${result.name}`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   └─ ${error}`);
        });
      }
    });
    
    // 결과를 파일로 저장
    const fs = require('fs').promises;
    const reportContent = {
      date: new Date().toISOString(),
      summary: {
        total: testResults.length,
        success: successCount,
        failed: failCount,
        warning: warningCount
      },
      details: testResults
    };
    
    await fs.writeFile(
      'test-results.json',
      JSON.stringify(reportContent, null, 2)
    );
  });
});