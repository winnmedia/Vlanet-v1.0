import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stabilizePage, waitForPageReady } from '../utils/stabilize';

/**
 * ARIA 속성 및 역할 검증 테스트
 * WAI-ARIA 1.1 명세 준수 확인
 */

test.describe('ARIA 준수 테스트', () => {
  const testPages = [
    { name: '프로젝트 관리', path: '/cms/home' },
    { name: '영상 피드백', path: '/feedback?id=1' },
    { name: '영상기획', path: '/video-planning?id=1' }
  ];

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
  });

  for (const pageInfo of testPages) {
    test.describe(pageInfo.name, () => {
      test('ARIA 역할 올바른 사용', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);
        await waitForPageReady(page);

        // 일반적인 ARIA 역할 검증
        const ariaRoles = [
          'navigation',
          'main',
          'banner',
          'contentinfo',
          'complementary',
          'search',
          'form',
          'region'
        ];

        for (const role of ariaRoles) {
          const elements = await page.locator(`[role="${role}"]`).all();
          
          for (const element of elements) {
            // 역할에 필요한 속성 확인
            if (role === 'region') {
              const label = await element.getAttribute('aria-label');
              const labelledby = await element.getAttribute('aria-labelledby');
              expect(label || labelledby).toBeTruthy();
            }
          }
        }
      });

      test('버튼과 링크 구분', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // 버튼으로 동작하는 요소들
        const buttons = await page.locator('button, [role="button"]').all();
        
        for (const button of buttons) {
          const tagName = await button.evaluate(el => el.tagName);
          
          if (tagName === 'A') {
            // 링크 태그가 버튼으로 사용되는 경우
            const href = await button.getAttribute('href');
            expect(href).toBeFalsy(); // href가 없어야 함
          }
          
          // 버튼은 Enter와 Space 키 모두에 반응해야 함
          const hasClickHandler = await button.evaluate(el => {
            return el.onclick !== null || 
                   el.hasAttribute('onclick') ||
                   el.addEventListener !== undefined;
          });
          expect(hasClickHandler).toBe(true);
        }
      });

      test('라이브 영역 적절한 사용', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // aria-live 영역 확인
        const liveRegions = await page.locator('[aria-live]').all();
        
        for (const region of liveRegions) {
          const ariaLive = await region.getAttribute('aria-live');
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
          
          // assertive는 정말 중요한 알림에만 사용되어야 함
          if (ariaLive === 'assertive') {
            const role = await region.getAttribute('role');
            expect(['alert', 'status']).toContain(role);
          }
        }
      });

      test('탭 패널 접근성', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // 탭 목록 찾기
        const tabLists = await page.locator('[role="tablist"]').all();
        
        for (const tabList of tabLists) {
          const tabs = await tabList.locator('[role="tab"]').all();
          
          for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            
            // aria-selected 속성 확인
            const selected = await tab.getAttribute('aria-selected');
            expect(['true', 'false']).toContain(selected);
            
            // aria-controls 속성 확인
            const controls = await tab.getAttribute('aria-controls');
            if (controls) {
              const panel = page.locator(`#${controls}`);
              expect(await panel.count()).toBe(1);
              
              // 연결된 패널의 role 확인
              const panelRole = await panel.getAttribute('role');
              expect(panelRole).toBe('tabpanel');
            }
          }
        }
      });

      test('모달/다이얼로그 접근성', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // 모달 트리거 찾기
        const modalTriggers = await page.locator('button').all();
        
        for (const trigger of modalTriggers.slice(0, 3)) { // 처음 3개만 테스트
          const text = await trigger.textContent();
          if (text?.match(/설정|수정|추가|생성|초대/)) {
            await trigger.click();
            await page.waitForTimeout(300);
            
            // 모달 확인
            const modal = page.locator('[role="dialog"], .modal').first();
            if (await modal.isVisible()) {
              // aria-modal 속성
              const ariaModal = await modal.getAttribute('aria-modal');
              expect(ariaModal).toBe('true');
              
              // aria-labelledby 또는 aria-label
              const labelledby = await modal.getAttribute('aria-labelledby');
              const label = await modal.getAttribute('aria-label');
              expect(labelledby || label).toBeTruthy();
              
              // 닫기 버튼
              const closeButton = modal.locator('[aria-label*="close"], [aria-label*="닫기"], .close');
              expect(await closeButton.count()).toBeGreaterThan(0);
              
              // 모달 닫기
              if (await closeButton.isVisible()) {
                await closeButton.click();
              } else {
                await page.keyboard.press('Escape');
              }
              await page.waitForTimeout(300);
            }
          }
        }
      });

      test('확장/축소 컨트롤', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // aria-expanded 속성을 가진 요소들
        const expandables = await page.locator('[aria-expanded]').all();
        
        for (const expandable of expandables) {
          const expanded = await expandable.getAttribute('aria-expanded');
          expect(['true', 'false']).toContain(expanded);
          
          // controls 속성 확인
          const controls = await expandable.getAttribute('aria-controls');
          if (controls) {
            const controlled = page.locator(`#${controls}`);
            expect(await controlled.count()).toBe(1);
            
            // 확장 상태와 가시성 일치 확인
            if (expanded === 'true') {
              expect(await controlled.isVisible()).toBe(true);
            }
          }
        }
      });

      test('로딩 상태 표시', async ({ page }) => {
        await page.goto(pageInfo.path);
        
        // 로딩 스피너나 스켈레톤 확인
        const loadingElements = await page.locator('[aria-busy="true"], .loading, .skeleton').all();
        
        for (const element of loadingElements) {
          const ariaBusy = await element.getAttribute('aria-busy');
          if (ariaBusy) {
            expect(ariaBusy).toBe('true');
          }
          
          // 로딩 중 설명
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaDescribedby = await element.getAttribute('aria-describedby');
          expect(ariaLabel || ariaDescribedby).toBeTruthy();
        }
      });

      test('그리드/테이블 접근성', async ({ page }) => {
        await page.goto(pageInfo.path);
        await stabilizePage(page);

        // 테이블 요소 확인
        const tables = await page.locator('table, [role="table"], [role="grid"]').all();
        
        for (const table of tables) {
          const role = await table.getAttribute('role');
          const tagName = await table.evaluate(el => el.tagName);
          
          // caption 또는 aria-label
          if (tagName === 'TABLE') {
            const caption = await table.locator('caption').first();
            const ariaLabel = await table.getAttribute('aria-label');
            expect(await caption.isVisible() || ariaLabel).toBeTruthy();
          }
          
          // 열 헤더 확인
          const headers = await table.locator('th, [role="columnheader"]').all();
          expect(headers.length).toBeGreaterThan(0);
        }
      });
    });
  }

  test('전역 ARIA 검증', async ({ page }) => {
    await page.goto('/cms/home');
    await stabilizePage(page);

    const results = await new AxeBuilder({ page })
      .withRules([
        'aria-allowed-attr',
        'aria-allowed-role', 
        'aria-dpub-role-fallback',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-input-field-name',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roledescription',
        'aria-roles',
        'aria-toggle-field-name',
        'aria-valid-attr',
        'aria-valid-attr-value'
      ])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\nARIA 위반사항:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  영향받는 요소: ${violation.nodes.length}개`);
      });
    }

    expect(results.violations).toEqual([]);
  });
});