import { test, expect } from '@playwright/test';
import { stabilizePage, waitForPageReady, viewports, snapshotOptions } from '../utils/stabilize';
import AxeBuilder from '@axe-core/playwright';

test.describe('프로젝트 관리 페이지 UI/UX 테스트', () => {
  // 로그인 상태 모의
  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지에 인증 토큰 설정 (실제 환경에 맞게 수정 필요)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: '테스트 사용자'
      }));
    });
    
    await page.goto('/cms/home');
    await stabilizePage(page);
    await waitForPageReady(page);
  });

  test('프로젝트 목록 데스크톱 뷰', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('cms-home-desktop.png', snapshotOptions);
  });

  test('프로젝트 목록 모바일 뷰', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('cms-home-mobile.png', snapshotOptions);
  });

  test('프로젝트 상태 필터 버튼', async ({ page }) => {
    // 진행중 필터 클릭
    const inProgressFilter = page.locator('button:has-text("진행중")');
    if (await inProgressFilter.isVisible()) {
      await inProgressFilter.click();
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot('cms-home-filter-inprogress.png', snapshotOptions);
    }
  });

  test('프로젝트 정보 토글', async ({ page }) => {
    // 첫 번째 프로젝트 카드의 토글 버튼 클릭
    const toggleButton = page.locator('.toggle-button').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(300); // 애니메이션 대기
      await expect(page).toHaveScreenshot('cms-home-project-expanded.png', snapshotOptions);
    }
  });

  test('새 프로젝트 생성 버튼 호버', async ({ page }) => {
    const newProjectBtn = page.locator('button:has-text("새 프로젝트")');
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.hover();
      await expect(page).toHaveScreenshot('cms-home-new-project-hover.png', snapshotOptions);
    }
  });

  test('접근성 검사', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.sidebar') // 사이드바는 별도 테스트
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('빈 상태 UI', async ({ page }) => {
    // 프로젝트가 없는 상태 모의
    await page.evaluate(() => {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-state';
      emptyMessage.textContent = '프로젝트가 없습니다.';
      const content = document.querySelector('.content');
      if (content) {
        content.innerHTML = '';
        content.appendChild(emptyMessage);
      }
    });
    
    await expect(page).toHaveScreenshot('cms-home-empty-state.png', snapshotOptions);
  });

  test('반응형 레이아웃 브레이크포인트', async ({ page }) => {
    // 태블릿과 데스크톱 사이 크기
    await page.setViewportSize({ width: 900, height: 700 });
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('cms-home-medium.png', snapshotOptions);
  });

  test('터치 타겟 크기 검증', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    
    // 모든 버튼과 클릭 가능한 요소의 크기 확인
    const clickableElements = await page.locator('button, a, [role="button"]').all();
    
    for (const element of clickableElements) {
      const box = await element.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});