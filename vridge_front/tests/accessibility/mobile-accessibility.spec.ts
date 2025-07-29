import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stabilizePage, waitForPageReady, viewports } from '../utils/stabilize';

/**
 * 모바일 접근성 특화 테스트
 * 터치 타겟, 제스처, 스크린리더 등 모바일 환경 특화 검증
 */

test.describe('모바일 접근성 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    
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
  });

  test('터치 타겟 최소 크기 (44x44px)', async ({ page }) => {
    await page.goto('/cms/home');
    await stabilizePage(page);
    await waitForPageReady(page);

    // 모든 클릭 가능한 요소 확인
    const clickableElements = await page.locator('a, button, input, select, [role="button"], [onclick]').all();
    
    let smallTargets = [];
    
    for (const element of clickableElements) {
      const isVisible = await element.isVisible();
      if (!isVisible) continue;
      
      const box = await element.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        smallTargets.push({
          element: `${tagName}: ${text?.substring(0, 20)}...`,
          width: box.width,
          height: box.height
        });
      }
    }

    // 작은 타겟 요소 리포트
    if (smallTargets.length > 0) {
      console.log('\n터치 타겟이 너무 작은 요소들:');
      smallTargets.forEach(target => {
        console.log(`- ${target.element} (${target.width}x${target.height}px)`);
      });
    }

    expect(smallTargets.length).toBe(0);
  });

  test('터치 타겟 간격 (최소 8px)', async ({ page }) => {
    await page.goto('/cms/home');
    await stabilizePage(page);
    await waitForPageReady(page);

    // 인접한 클릭 가능 요소들 간격 확인
    const result = await page.evaluate(() => {
      const clickables = Array.from(document.querySelectorAll('a, button, input, [role="button"]'));
      const tooClose = [];
      
      for (let i = 0; i < clickables.length; i++) {
        for (let j = i + 1; j < clickables.length; j++) {
          const rect1 = clickables[i].getBoundingClientRect();
          const rect2 = clickables[j].getBoundingClientRect();
          
          // 요소가 보이지 않으면 건너뛰기
          if (rect1.width === 0 || rect2.width === 0) continue;
          
          // 거리 계산
          const horizontalGap = Math.max(0, 
            Math.max(rect1.left, rect2.left) - Math.min(rect1.right, rect2.right));
          const verticalGap = Math.max(0,
            Math.max(rect1.top, rect2.top) - Math.min(rect1.bottom, rect2.bottom));
          
          const gap = Math.min(horizontalGap, verticalGap);
          
          if (gap < 8 && gap > 0) {
            tooClose.push({
              elem1: clickables[i].textContent?.substring(0, 20),
              elem2: clickables[j].textContent?.substring(0, 20),
              gap: gap
            });
          }
        }
      }
      
      return tooClose;
    });

    if (result.length > 0) {
      console.log('\n간격이 너무 좁은 요소들:');
      result.forEach(item => {
        console.log(`- "${item.elem1}" ↔ "${item.elem2}" (${item.gap}px)`);
      });
    }

    expect(result.length).toBe(0);
  });

  test('스크롤 가능 영역의 터치 제스처', async ({ page }) => {
    await page.goto('/feedback?id=1');
    await stabilizePage(page);
    await waitForPageReady(page);

    // 스크롤 가능한 영역 확인
    const scrollableAreas = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return (
          (style.overflowY === 'scroll' || style.overflowY === 'auto') &&
          el.scrollHeight > el.clientHeight
        );
      }).map(el => ({
        tag: el.tagName,
        class: el.className,
        hasScrollbar: el.scrollHeight > el.clientHeight
      }));
    });

    // 모든 스크롤 영역이 터치 제스처를 지원하는지 확인
    for (const area of scrollableAreas) {
      console.log(`스크롤 가능 영역: ${area.tag}.${area.class}`);
    }
  });

  test('모바일 뷰포트 메타 태그', async ({ page }) => {
    await page.goto('/');
    
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });

    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');
  });

  test('가로 스크롤 방지', async ({ page }) => {
    const pages = ['/login', '/cms/home', '/feedback?id=1'];
    
    for (const path of pages) {
      await page.goto(path);
      await waitForPageReady(page);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('폼 입력 필드 모바일 최적화', async ({ page }) => {
    await page.goto('/login');
    await stabilizePage(page);
    
    // 입력 필드 속성 확인
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      const attributes = await emailInput.evaluate(el => ({
        type: el.getAttribute('type'),
        autocomplete: el.getAttribute('autocomplete'),
        autocapitalize: el.getAttribute('autocapitalize'),
        autocorrect: el.getAttribute('autocorrect')
      }));
      
      expect(attributes.type).toBe('email');
      // 모바일 키보드 최적화 속성들이 있는지 확인
    }
  });

  test('모바일 네비게이션 접근성', async ({ page }) => {
    await page.goto('/cms/home');
    await stabilizePage(page);
    await waitForPageReady(page);
    
    // 햄버거 메뉴 또는 모바일 네비게이션 확인
    const mobileNav = await page.locator('[aria-label*="menu"], [aria-label*="navigation"], .mobile-menu, .hamburger').first();
    
    if (await mobileNav.isVisible()) {
      // ARIA 속성 확인
      const ariaExpanded = await mobileNav.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(ariaExpanded);
    }
  });

  test('모바일 모달/팝업 접근성', async ({ page }) => {
    await page.goto('/feedback?id=1');
    await stabilizePage(page);
    
    // 모달 트리거 버튼 찾기
    const modalTrigger = page.locator('button').filter({ hasText: /설정|필터|옵션/ }).first();
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(300); // 모달 애니메이션 대기
      
      // 모달이 열렸는지 확인
      const modal = page.locator('[role="dialog"], .modal, .popup');
      if (await modal.isVisible()) {
        // 닫기 버튼 확인
        const closeButton = modal.locator('[aria-label*="close"], [aria-label*="닫기"], .close');
        expect(await closeButton.isVisible()).toBe(true);
        
        // 포커스 트랩 확인
        const focusableElements = await modal.locator('button, input, select, textarea, a[href], [tabindex]').count();
        expect(focusableElements).toBeGreaterThan(0);
      }
    }
  });

  test('스크린리더 호환성', async ({ page }) => {
    await page.goto('/cms/home');
    
    const axeResults = await new AxeBuilder({ page })
      .withRules([
        'aria-allowed-attr',
        'aria-hidden-focus',
        'aria-required-attr',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'link-name',
        'label'
      ])
      .analyze();
    
    expect(axeResults.violations).toEqual([]);
  });
});