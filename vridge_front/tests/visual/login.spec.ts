import { test, expect } from '@playwright/test';
import { stabilizePage, waitForPageReady, viewports, snapshotOptions } from '../utils/stabilize';
import AxeBuilder from '@axe-core/playwright';

test.describe('로그인 페이지 UI/UX 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/login');
    await stabilizePage(page);
    await waitForPageReady(page);
  });

  test('데스크톱 뷰 스냅샷', async ({ page }) => {
    await expect(page).toHaveScreenshot('login-desktop.png', snapshotOptions);
  });

  test('태블릿 뷰 스냅샷', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('login-tablet.png', snapshotOptions);
  });

  test('모바일 뷰 스냅샷', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('login-mobile.png', snapshotOptions);
  });

  test('접근성 검사', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('입력 필드 포커스 상태', async ({ page }) => {
    // 이메일 입력 필드 포커스
    await page.locator('input[type="email"]').focus();
    await expect(page).toHaveScreenshot('login-email-focus.png', snapshotOptions);

    // 비밀번호 입력 필드 포커스
    await page.locator('input[type="password"]').focus();
    await expect(page).toHaveScreenshot('login-password-focus.png', snapshotOptions);
  });

  test('에러 메시지 표시', async ({ page }) => {
    // 잘못된 로그인 시도
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 표시 대기
    await page.waitForSelector('.error-message', { timeout: 5000 }).catch(() => {});
    
    await expect(page).toHaveScreenshot('login-error-state.png', snapshotOptions);
  });

  test('키보드 네비게이션', async ({ page }) => {
    // Tab 키로 순차적 이동 확인
    await page.keyboard.press('Tab'); // 이메일 필드
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 비밀번호 필드
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 로그인 버튼
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();
  });

  test('색상 대비 검사', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});