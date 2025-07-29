import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stabilizePage, waitForPageReady } from '../utils/stabilize';

/**
 * 폼 접근성 특화 테스트
 * 입력 필드, 에러 메시지, 유효성 검사 등
 */

test.describe('폼 접근성 테스트', () => {
  test.describe('로그인 폼', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await stabilizePage(page);
      await waitForPageReady(page);
    });

    test('폼 레이블 연결', async ({ page }) => {
      // 모든 입력 필드가 레이블과 연결되어 있는지 확인
      const inputs = await page.locator('input, select, textarea').all();
      
      for (const input of inputs) {
        const inputId = await input.getAttribute('id');
        const inputName = await input.getAttribute('name');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        // 레이블 연결 방법 중 하나는 있어야 함
        const hasLabel = inputId ? 
          await page.locator(`label[for="${inputId}"]`).count() > 0 : false;
        
        const hasAriaLabel = !!ariaLabel || !!ariaLabelledby;
        
        expect(hasLabel || hasAriaLabel).toBe(true);
      }
    });

    test('필수 필드 표시', async ({ page }) => {
      const requiredInputs = await page.locator('input[required], select[required], textarea[required]').all();
      
      for (const input of requiredInputs) {
        const ariaRequired = await input.getAttribute('aria-required');
        const required = await input.getAttribute('required');
        
        // required 속성이나 aria-required가 설정되어 있어야 함
        expect(required !== null || ariaRequired === 'true').toBe(true);
      }
    });

    test('에러 메시지 접근성', async ({ page }) => {
      // 잘못된 입력으로 에러 유발
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', '');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(500); // 에러 메시지 표시 대기
      
      // 에러 메시지 확인
      const errorMessages = await page.locator('.error-message, .error, [role="alert"]').all();
      
      for (const error of errorMessages) {
        if (await error.isVisible()) {
          // 에러 메시지가 관련 입력 필드와 연결되어 있는지 확인
          const role = await error.getAttribute('role');
          const ariaLive = await error.getAttribute('aria-live');
          
          // 에러는 role="alert" 또는 aria-live 속성을 가져야 함
          expect(role === 'alert' || ariaLive !== null).toBe(true);
        }
      }
    });

    test('키보드 네비게이션', async ({ page }) => {
      // Tab 키로 순차 이동
      await page.keyboard.press('Tab'); // 첫 번째 입력 필드
      let focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('INPUT');
      
      await page.keyboard.press('Tab'); // 두 번째 입력 필드
      focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('INPUT');
      
      await page.keyboard.press('Tab'); // 제출 버튼
      focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT']).toContain(focused);
    });

    test('자동완성 속성', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      // 적절한 autocomplete 속성 확인
      const emailAutocomplete = await emailInput.getAttribute('autocomplete');
      const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');
      
      expect(['email', 'username']).toContain(emailAutocomplete);
      expect(['current-password', 'password']).toContain(passwordAutocomplete);
    });
  });

  test.describe('회원가입 폼', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
      await stabilizePage(page);
      await waitForPageReady(page);
    });

    test('비밀번호 강도 표시기 접근성', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('weak');
        
        // 비밀번호 강도 표시기 확인
        const strengthIndicator = page.locator('[role="status"], .password-strength, [aria-live]');
        if (await strengthIndicator.isVisible()) {
          const ariaLive = await strengthIndicator.getAttribute('aria-live');
          expect(['polite', 'assertive']).toContain(ariaLive);
        }
      }
    });

    test('이용약관 체크박스 레이블', async ({ page }) => {
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      
      for (const checkbox of checkboxes) {
        const id = await checkbox.getAttribute('id');
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).textContent();
          expect(label).toBeTruthy();
        }
      }
    });
  });

  test.describe('프로젝트 생성 폼', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인 상태 설정
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('access_token', 'mock-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'test@example.com',
          name: '테스트 사용자'
        }));
      });
      
      await page.goto('/project/create');
      await stabilizePage(page);
      await waitForPageReady(page);
    });

    test('멀티스텝 폼 진행률 표시', async ({ page }) => {
      // 진행률 표시기 확인
      const progressIndicator = page.locator('[role="progressbar"], .progress-indicator, .step-indicator');
      
      if (await progressIndicator.isVisible()) {
        const ariaValueNow = await progressIndicator.getAttribute('aria-valuenow');
        const ariaValueMin = await progressIndicator.getAttribute('aria-valuemin');
        const ariaValueMax = await progressIndicator.getAttribute('aria-valuemax');
        
        // 진행률 ARIA 속성 확인
        if (ariaValueNow) {
          expect(ariaValueMin).toBeTruthy();
          expect(ariaValueMax).toBeTruthy();
        }
      }
    });

    test('파일 업로드 접근성', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        // 파일 입력 레이블 확인
        const id = await fileInput.getAttribute('id');
        if (id) {
          const label = await page.locator(`label[for="${id}"]`);
          expect(await label.isVisible()).toBe(true);
        }
        
        // accept 속성 확인
        const accept = await fileInput.getAttribute('accept');
        expect(accept).toBeTruthy();
      }
    });
  });

  test('폼 필드 그룹화', async ({ page }) => {
    await page.goto('/video-planning?id=1');
    await stabilizePage(page);
    
    // fieldset과 legend 사용 확인
    const fieldsets = await page.locator('fieldset').all();
    
    for (const fieldset of fieldsets) {
      const legend = await fieldset.locator('legend').first();
      if (await legend.isVisible()) {
        const legendText = await legend.textContent();
        expect(legendText).toBeTruthy();
      }
    }
  });

  test('인라인 유효성 검사 메시지', async ({ page }) => {
    await page.goto('/login');
    
    // 이메일 필드에 잘못된 형식 입력
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('invalid@');
    await emailInput.blur(); // 포커스 아웃
    
    await page.waitForTimeout(300);
    
    // 인라인 에러 메시지 확인
    const errorMessage = page.locator('.field-error, .input-error, [role="alert"]').first();
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent();
      expect(text).toBeTruthy();
      
      // 에러가 입력 필드와 연결되어 있는지 확인
      const describedBy = await emailInput.getAttribute('aria-describedby');
      if (describedBy) {
        const errorId = await errorMessage.getAttribute('id');
        expect(describedBy).toContain(errorId || '');
      }
    }
  });

  test('폼 제출 후 성공 메시지', async ({ page }) => {
    // 피드백 제출 테스트
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: '테스트 사용자'
      }));
    });
    
    await page.goto('/feedback?id=1');
    await stabilizePage(page);
    
    // 피드백 입력
    const feedbackInput = page.locator('textarea').first();
    if (await feedbackInput.isVisible()) {
      await feedbackInput.fill('테스트 피드백입니다.');
      
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // 성공 메시지 확인
        await page.waitForTimeout(1000);
        const successMessage = page.locator('[role="status"], .success-message, .toast');
        
        if (await successMessage.isVisible()) {
          const ariaLive = await successMessage.getAttribute('aria-live');
          expect(['polite', 'assertive']).toContain(ariaLive);
        }
      }
    }
  });
});