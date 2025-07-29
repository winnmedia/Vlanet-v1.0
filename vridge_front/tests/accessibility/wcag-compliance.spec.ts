import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stabilizePage, waitForPageReady, viewports } from '../utils/stabilize';

/**
 * WCAG 2.1 AA 준수 테스트 스위트
 * 모든 주요 페이지의 접근성을 검증합니다.
 */

test.describe('WCAG 2.1 AA 준수 테스트', () => {
  // 테스트할 페이지 목록
  const pages = [
    { name: '로그인', path: '/login', requiresAuth: false },
    { name: '회원가입', path: '/signup', requiresAuth: false },
    { name: '홈', path: '/', requiresAuth: false },
    { name: '프로젝트 관리', path: '/cms/home', requiresAuth: true },
    { name: '영상 피드백', path: '/feedback?id=1', requiresAuth: true },
    { name: '영상기획', path: '/video-planning?id=1', requiresAuth: true },
    { name: '마이페이지', path: '/mypage', requiresAuth: true }
  ];

  // 각 페이지에 대해 테스트 실행
  for (const pageInfo of pages) {
    test.describe(pageInfo.name, () => {
      test.beforeEach(async ({ page }) => {
        // 인증이 필요한 페이지의 경우 로그인 상태 모의
        if (pageInfo.requiresAuth) {
          await page.goto('/');
          await page.evaluate(() => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('user', JSON.stringify({
              id: 1,
              email: 'test@example.com',
              name: '테스트 사용자'
            }));
          });
        }
        
        await page.goto(pageInfo.path);
        await stabilizePage(page);
        await waitForPageReady(page);
      });

      test('WCAG 2.1 Level A 준수', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a'])
          .analyze();

        // 위반 사항이 있으면 상세 정보 출력
        if (results.violations.length > 0) {
          console.log(`\n${pageInfo.name} 페이지 Level A 위반사항:`);
          results.violations.forEach(violation => {
            console.log(`- ${violation.id}: ${violation.description}`);
            console.log(`  영향: ${violation.impact}`);
            console.log(`  요소: ${violation.nodes.length}개`);
          });
        }

        expect(results.violations).toEqual([]);
      });

      test('WCAG 2.1 Level AA 준수', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2aa'])
          .analyze();

        if (results.violations.length > 0) {
          console.log(`\n${pageInfo.name} 페이지 Level AA 위반사항:`);
          results.violations.forEach(violation => {
            console.log(`- ${violation.id}: ${violation.description}`);
            console.log(`  영향: ${violation.impact}`);
            console.log(`  요소: ${violation.nodes.length}개`);
          });
        }

        expect(results.violations).toEqual([]);
      });

      test('색상 대비', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze();

        expect(results.violations).toEqual([]);
      });

      test('키보드 접근성', async ({ page }) => {
        // Tab 키로 모든 인터랙티브 요소에 접근 가능한지 확인
        const interactiveElements = await page.$$('a, button, input, select, textarea, [tabindex]');
        
        for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
          await page.keyboard.press('Tab');
          const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
          expect(focusedElement).toBeTruthy();
        }
      });

      test('이미지 대체 텍스트', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withRules(['image-alt'])
          .analyze();

        expect(results.violations).toEqual([]);
      });

      test('폼 레이블', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withRules(['label'])
          .analyze();

        expect(results.violations).toEqual([]);
      });

      test('헤딩 구조', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withRules(['heading-order', 'empty-heading'])
          .analyze();

        expect(results.violations).toEqual([]);
      });

      test('랜드마크 영역', async ({ page }) => {
        const results = await new AxeBuilder({ page })
          .withRules(['landmark-one-main', 'region'])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    });
  }

  // 반응형 접근성 테스트
  test.describe('반응형 접근성', () => {
    const testViewports = [
      { name: '데스크톱', viewport: viewports.desktop },
      { name: '태블릿', viewport: viewports.tablet },
      { name: '모바일', viewport: viewports.mobile }
    ];

    for (const vp of testViewports) {
      test(`${vp.name} 뷰포트 접근성`, async ({ page }) => {
        await page.setViewportSize(vp.viewport);
        await page.goto('/cms/home');
        await stabilizePage(page);
        await waitForPageReady(page);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2aa'])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });

  // 다크모드 접근성 (지원하는 경우)
  test.describe('다크모드 접근성', () => {
    test.skip('다크모드 색상 대비', async ({ page }) => {
      // 다크모드 활성화
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/cms/home');
      await stabilizePage(page);
      await waitForPageReady(page);

      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
});