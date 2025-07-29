import { test, expect } from '@playwright/test'
import { stabilizePage } from '../utils/stabilize'

test.describe('Button Style Migration', () => {
  test.beforeEach(async ({ page }) => {
    await stabilizePage(page)
  })

  test('compare old vs new button styles', async ({ page }) => {
    // 테스트용 비교 페이지로 이동
    await page.goto('/style-comparison/buttons')
    
    // 기존 버튼과 새 버튼 비교
    const comparisons = [
      { old: '.feedbackButtonPrimary', new: '[data-testid="new-button-primary"]' },
      { old: '.feedbackButtonSecondary', new: '[data-testid="new-button-secondary"]' },
      { old: '.feedbackButtonDanger', new: '[data-testid="new-button-danger"]' },
      { old: '.feedbackButtonIconOnly', new: '[data-testid="new-button-icon"]' },
    ]

    for (const { old, new: newSelector } of comparisons) {
      // 기존 버튼 스타일 캡처
      const oldButton = await page.locator(old).first()
      const oldStyles = await oldButton.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
        }
      })

      // 새 버튼 스타일 캡처
      const newButton = await page.locator(newSelector).first()
      const newStyles = await newButton.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
        }
      })

      // 스타일 비교
      expect(newStyles).toEqual(oldStyles)
    }
  })

  test('feedback page button visual regression', async ({ page }) => {
    await page.goto('/Feedback?projectId=test')
    
    // 주요 버튼 영역 스크린샷
    await expect(page.locator('.action-buttons-container')).toHaveScreenshot('feedback-buttons.png')
    await expect(page.locator('.video-controls')).toHaveScreenshot('video-control-buttons.png')
    await expect(page.locator('.member-invite-section')).toHaveScreenshot('invite-buttons.png')
  })

  test('button interaction states', async ({ page }) => {
    await page.goto('/style-comparison/buttons')
    
    const button = page.locator('[data-testid="interactive-button"]')
    
    // Normal state
    await expect(button).toHaveScreenshot('button-normal.png')
    
    // Hover state
    await button.hover()
    await expect(button).toHaveScreenshot('button-hover.png')
    
    // Active state
    await button.click({ force: true })
    await expect(button).toHaveScreenshot('button-active.png')
    
    // Disabled state
    await button.evaluate((el) => el.setAttribute('disabled', 'true'))
    await expect(button).toHaveScreenshot('button-disabled.png')
  })

  test('responsive button behavior', async ({ page }) => {
    await page.goto('/style-comparison/buttons')
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-desktop.png')
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-tablet.png')
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-mobile.png')
  })
})