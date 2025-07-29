import { test, expect } from '@playwright/test';
import { stabilizePage } from './utils/stabilize';

// 주요 페이지의 현재 디자인을 스냅샷으로 저장
test.describe('Visual Baseline - 현재 디자인 보존', () => {
  test.beforeEach(async ({ page }) => {
    // 애니메이션, 트랜지션 비활성화
    await stabilizePage(page);
  });

  test('홈페이지 디자인 베이스라인', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 전체 페이지 스크린샷
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('로그인 페이지 디자인 베이스라인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('CMS 홈 디자인 베이스라인', async ({ page }) => {
    // 로그인이 필요한 경우 mock 또는 실제 로그인 수행
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('cms-home.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('피드백 페이지 디자인 베이스라인', async ({ page }) => {
    await page.goto('/cms/feedback');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('feedback-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('영상기획 페이지 디자인 베이스라인', async ({ page }) => {
    await page.goto('/cms/video-planning');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('video-planning-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // 주요 컴포넌트 스냅샷
  test('버튼 스타일 베이스라인', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    
    // 주요 버튼들 캡처
    const primaryButton = page.locator('.feedbackButtonPrimary').first();
    if (await primaryButton.isVisible()) {
      await expect(primaryButton).toHaveScreenshot('button-primary.png');
    }
    
    const dangerButton = page.locator('.feedbackButtonDanger').first();
    if (await dangerButton.isVisible()) {
      await expect(dangerButton).toHaveScreenshot('button-danger.png');
    }
  });

  // 반응형 디자인 체크
  test('모바일 뷰 베이스라인', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('태블릿 뷰 베이스라인', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});