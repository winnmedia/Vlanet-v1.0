import { test, expect } from '@playwright/test';
import { stabilizePage, waitForPageReady, viewports, snapshotOptions } from '../utils/stabilize';
import AxeBuilder from '@axe-core/playwright';

test.describe('영상기획 페이지 UI/UX 테스트', () => {
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
    
    // 영상기획 페이지로 이동
    await page.goto('/video-planning?id=1');
    await stabilizePage(page);
    await waitForPageReady(page);
  });

  test('영상기획 페이지 전체 레이아웃', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('video-planning-desktop.png', snapshotOptions);
  });

  test('섹션 타이틀 일관성', async ({ page }) => {
    // 모든 섹션 타이틀 수집
    const sectionTitles = await page.locator('.section-title').all();
    
    for (const title of sectionTitles) {
      const styles = await title.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          color: computed.color,
          paddingLeft: computed.paddingLeft
        };
      });
      
      // 통일된 스타일 확인
      expect(styles.fontSize).toBe('20px');
      expect(styles.fontWeight).toBe('700');
      expect(styles.paddingLeft).toBe('16px');
    }
  });

  test('스토리 프레임워크 섹션', async ({ page }) => {
    const storySection = page.locator('.story-framework-section');
    if (await storySection.isVisible()) {
      await expect(storySection).toHaveScreenshot('video-planning-story.png', snapshotOptions);
    }
  });

  test('주인공 설정 섹션', async ({ page }) => {
    const characterSection = page.locator('.character-setting-section');
    if (await characterSection.isVisible()) {
      await expect(characterSection).toHaveScreenshot('video-planning-character.png', snapshotOptions);
      
      // 이미지 업로드 UI 크기 확인
      const imageUpload = characterSection.locator('.image-upload-area').first();
      if (await imageUpload.isVisible()) {
        const box = await imageUpload.boundingBox();
        if (box) {
          expect(box.width).toBeCloseTo(180, 10);
          expect(box.height).toBeCloseTo(180, 10);
        }
      }
    }
  });

  test('모바일 반응형', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot('video-planning-mobile.png', snapshotOptions);
  });

  test('PDF 내보내기 버튼', async ({ page }) => {
    const exportButton = page.locator('button:has-text("PDF")');
    if (await exportButton.isVisible()) {
      await exportButton.hover();
      await expect(page).toHaveScreenshot('video-planning-export-hover.png', snapshotOptions);
    }
  });

  test('입력 필드 스타일 일관성', async ({ page }) => {
    const inputFields = await page.locator('input[type="text"], textarea').all();
    
    for (const field of inputFields.slice(0, 3)) { // 처음 3개만 확인
      const styles = await field.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          border: computed.border,
          borderRadius: computed.borderRadius,
          padding: computed.padding
        };
      });
      
      // 미니멀 디자인 확인
      expect(styles.border).toContain('1px');
      expect(styles.borderRadius).toBe('8px');
    }
  });

  test('접근성 검사', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('탭 이동 시 포커스 스타일', async ({ page }) => {
    // 첫 번째 입력 필드로 포커스
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // 헤더 건너뛰기
    
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    if (focusedElement) {
      await expect(page).toHaveScreenshot('video-planning-focus.png', snapshotOptions);
    }
  });

  test('저장 버튼 상태', async ({ page }) => {
    const saveButton = page.locator('button:has-text("저장")');
    if (await saveButton.isVisible()) {
      // 정상 상태
      await expect(saveButton).toHaveScreenshot('video-planning-save-normal.png', snapshotOptions);
      
      // 호버 상태
      await saveButton.hover();
      await expect(saveButton).toHaveScreenshot('video-planning-save-hover.png', snapshotOptions);
    }
  });
});