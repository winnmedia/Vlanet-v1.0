import { Page } from '@playwright/test';

/**
 * 스냅샷 테스트를 위한 안정화 유틸리티
 * 애니메이션, 폰트 로딩, 시간 변동 등을 제거하여 일관된 스냅샷 생성
 */

export async function stabilizePage(page: Page) {
  // 애니메이션과 트랜지션 비활성화
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        animation-iteration-count: 1 !important;
        caret-color: transparent !important;
      }
      
      /* 스크롤바 숨기기 (OS별 차이 제거) */
      ::-webkit-scrollbar {
        display: none !important;
      }
      
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      
      /* 포커스 스타일 통일 */
      *:focus {
        outline: 2px solid #1631F8 !important;
        outline-offset: 2px !important;
      }
    `
  });

  // 시간 고정
  await page.addInitScript(() => {
    // Date.now() mock
    const fixedTime = new Date('2025-01-01T00:00:00Z').getTime();
    Date.now = () => fixedTime;
    
    // Math.random() seed
    let seed = 0.123456789;
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    // setTimeout/setInterval을 즉시 실행
    window.setTimeout = ((originalSetTimeout) => {
      return (callback: any, delay?: number, ...args: any[]) => {
        if (delay && delay > 0) {
          callback(...args);
          return 0;
        }
        return originalSetTimeout(callback, delay, ...args);
      };
    })(window.setTimeout);
  });
}

/**
 * 페이지가 완전히 로드될 때까지 대기
 */
export async function waitForPageReady(page: Page) {
  // 네트워크 유휴 상태 대기
  await page.waitForLoadState('networkidle');
  
  // 폰트 로딩 대기
  await page.evaluate(() => {
    return document.fonts.ready;
  });
  
  // React/Next.js 하이드레이션 대기
  await page.waitForTimeout(500);
  
  // 이미지 로딩 대기
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(
      images
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        }))
    );
  });
}

/**
 * 뷰포트 설정
 */
export const viewports = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 }
};

/**
 * 스냅샷 옵션
 */
export const snapshotOptions = {
  maxDiffPixels: 100,
  threshold: 0.2,
  animations: 'disabled' as const,
  caret: 'hide' as const
};