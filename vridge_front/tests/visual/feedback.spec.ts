import { test, expect } from '@playwright/test';
import { stabilizePage, waitForPageReady, viewports, snapshotOptions } from '../utils/stabilize';
import AxeBuilder from '@axe-core/playwright';

test.describe('영상 피드백 페이지 UI/UX 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태 모의
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: '테스트 사용자'
      }));
    });
    
    // 피드백 페이지로 이동 (프로젝트 ID는 실제 환경에 맞게 수정)
    await page.goto('/feedback?id=1');
    await stabilizePage(page);
    await waitForPageReady(page);
  });

  test('피드백 페이지 전체 레이아웃', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('feedback-desktop.png', snapshotOptions);
  });

  test('비디오 플레이어 영역', async ({ page }) => {
    const videoPlayer = page.locator('.video-player-section');
    if (await videoPlayer.isVisible()) {
      await expect(videoPlayer).toHaveScreenshot('feedback-video-player.png', snapshotOptions);
    }
  });

  test('피드백 입력 섹션', async ({ page }) => {
    const feedbackInput = page.locator('.feedback-input-section');
    if (await feedbackInput.isVisible()) {
      await expect(feedbackInput).toHaveScreenshot('feedback-input-section.png', snapshotOptions);
    }
  });

  test('탭 네비게이션', async ({ page }) => {
    // 피드백 관리 탭
    const feedbackTab = page.locator('button:has-text("피드백 관리")');
    if (await feedbackTab.isVisible()) {
      await feedbackTab.click();
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot('feedback-manage-tab.png', snapshotOptions);
    }

    // 코멘트 탭
    const commentTab = page.locator('button:has-text("코멘트")');
    if (await commentTab.isVisible()) {
      await commentTab.click();
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot('feedback-comment-tab.png', snapshotOptions);
    }

    // 멤버 탭
    const memberTab = page.locator('button:has-text("멤버")');
    if (await memberTab.isVisible()) {
      await memberTab.click();
      await waitForPageReady(page);
      await expect(page).toHaveScreenshot('feedback-member-tab.png', snapshotOptions);
    }
  });

  test('모바일 반응형', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('feedback-mobile.png', snapshotOptions);

    // 모바일에서 비디오 플레이어
    const videoPlayer = page.locator('.video-player-section');
    if (await videoPlayer.isVisible()) {
      await expect(videoPlayer).toHaveScreenshot('feedback-mobile-player.png', snapshotOptions);
    }
  });

  test('버튼 스타일 일관성', async ({ page }) => {
    // 좋아요/싫어요 버튼
    const actionButtons = page.locator('.action-btn');
    const buttonCount = await actionButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = actionButtons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        // 버튼 크기가 고정되어 있는지 확인
        const buttonText = await button.textContent();
        if (buttonText?.includes('좋아요') || buttonText?.includes('싫어요')) {
          expect(box.width).toBeCloseTo(60, 5);
        } else if (buttonText?.includes('추가설명필요')) {
          expect(box.width).toBeCloseTo(110, 5);
        } else if (buttonText?.includes('중요')) {
          expect(box.width).toBeCloseTo(70, 5);
        }
      }
    }
  });

  test('접근성 검사', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.video-js') // 비디오 플레이어는 별도 검사
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('코멘트 작성 UI', async ({ page }) => {
    // 코멘트 탭으로 이동
    const commentTab = page.locator('button:has-text("코멘트")');
    if (await commentTab.isVisible()) {
      await commentTab.click();
      await waitForPageReady(page);
      
      // 코멘트 타입 버튼들이 한 줄에 있는지 확인
      const typeButtons = page.locator('.type-toggle-group');
      if (await typeButtons.isVisible()) {
        await expect(typeButtons).toHaveScreenshot('feedback-comment-types.png', snapshotOptions);
      }
    }
  });

  test('색상 대비 및 브랜드 컬러', async ({ page }) => {
    // 주요 액션 버튼의 브랜드 컬러 확인
    const primaryButton = page.locator('.feedbackButtonPrimary').first();
    if (await primaryButton.isVisible()) {
      const styles = await primaryButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          color: computed.color
        };
      });
      
      // 브랜드 블루 그라데이션 확인
      expect(styles.background).toContain('1631F8');
    }
  });
});