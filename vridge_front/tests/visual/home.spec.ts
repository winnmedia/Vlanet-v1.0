import { test, expect } from '@playwright/test';
import { stabilizePage } from '../utils/stabilize';

test.describe('홈페이지 Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);
  });

  test('홈페이지 전체 레이아웃', async ({ page }) => {
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 캡처
    await expect(page).toHaveScreenshot('home-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('메인 비주얼 섹션', async ({ page }) => {
    const visual = page.locator('.visual');
    await expect(visual).toBeVisible();
    
    await expect(visual).toHaveScreenshot('home-visual.png', {
      animations: 'disabled'
    });
  });

  test('버튼 스타일', async ({ page }) => {
    const button = page.locator('button').first();
    
    // 기본 상태
    await expect(button).toHaveScreenshot('button-default.png');
    
    // 호버 상태
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');
  });

  test('반응형 - 모바일', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('반응형 - 태블릿', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});