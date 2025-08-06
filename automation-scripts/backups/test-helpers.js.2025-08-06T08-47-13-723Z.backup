/**
 * VideoPlanet E2E Test Helpers
 * 테스트 자동화를 위한 유틸리티 함수들
 */

const { expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

class TestHelpers {
  constructor(page) {
    this.page = page;
    this.testData = null;
  }
  
  /**
   * 테스트 데이터 로드
   */
  async loadTestData() {
    if (!this.testData) {
      const dataPath = path.join(__dirname, '../config/test-data.json');
      const data = await fs.readFile(dataPath, 'utf-8');
      this.testData = JSON.parse(data);
    }
    return this.testData;
  }
  
  /**
   * 로그인 헬퍼
   */
  async login(email, password) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"], input[type="email"]', email);
    await this.page.fill('input[name="password"], input[type="password"]', password);
    
    // 로그인 버튼 클릭
    await Promise.race([
      this.page.click('button[type="submit"]:has-text("로그인")'),
      this.page.click('button:has-text("로그인")'),
      this.page.click('button[type="submit"]')
    ].map(p => p.catch(() => {})));
    
    // 로그인 성공 대기
    await this.page.waitForURL(/\/(dashboard|cms|mypage)/i, { 
      timeout: 10000,
      waitUntil: 'networkidle' 
    });
    
    // JWT 토큰 확인
    const cookies = await this.page.context().cookies();
    const hasToken = cookies.some(c => c.name.includes('token') || c.name.includes('auth'));
    
    return hasToken;
  }
  
  /**
   * 로그아웃 헬퍼
   */
  async logout() {
    // 로그아웃 버튼 찾기 및 클릭
    const logoutButton = await this.page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.page.waitForURL('/login', { timeout: 5000 });
    }
  }
  
  /**
   * 네비게이션 헬퍼
   */
  async navigateTo(section) {
    const routes = {
      'dashboard': '/dashboard',
      'projects': '/cms/project',
      'video-planning': '/cms/video-planning',
      'feedback': '/cms/feedback',
      'mypage': '/mypage',
      'admin': '/admin'
    };
    
    const route = routes[section.toLowerCase()];
    if (route) {
      await this.page.goto(route);
      await this.page.waitForLoadState('networkidle');
    } else {
      throw new Error(`Unknown section: ${section}`);
    }
  }
  
  /**
   * 폼 유효성 검증 헬퍼
   */
  async validateForm(formSelector) {
    const form = await this.page.locator(formSelector);
    const errors = [];
    
    // 필수 필드 확인
    const requiredFields = await form.locator('[required], [aria-required="true"]').all();
    for (const field of requiredFields) {
      const value = await field.inputValue().catch(() => '');
      const name = await field.getAttribute('name');
      if (!value) {
        errors.push(`필수 필드 '${name}'이(가) 비어있습니다`);
      }
    }
    
    // 에러 메시지 확인
    const errorMessages = await form.locator('.error-message, .ant-form-item-explain-error').all();
    for (const error of errorMessages) {
      const text = await error.textContent();
      if (text) errors.push(text);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * API 응답 모니터링 헬퍼
   */
  async monitorAPICall(urlPattern, action) {
    const responsePromise = this.page.waitForResponse(
      response => response.url().includes(urlPattern),
      { timeout: 10000 }
    );
    
    await action();
    
    const response = await responsePromise;
    const status = response.status();
    const body = await response.json().catch(() => null);
    
    return {
      status,
      success: status >= 200 && status < 300,
      body,
      headers: response.headers()
    };
  }
  
  /**
   * 스크린샷 캡처 헬퍼
   */
  async captureScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}_${timestamp}.png`;
    const filePath = path.join(__dirname, '../screenshots', fileName);
    
    await this.page.screenshot({ 
      path: filePath,
      fullPage: true 
    });
    
    return filePath;
  }
  
  /**
   * 성능 메트릭 수집
   */
  async collectPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      return {
        // 페이지 로드 메트릭
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        
        // 리소스 메트릭
        totalResources: resources.length,
        totalSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0),
        slowestResource: resources.sort((a, b) => b.duration - a.duration)[0],
        
        // 메모리 사용량 (Chrome only)
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    return metrics;
  }
  
  /**
   * 접근성 검사
   */
  async checkAccessibility() {
    const violations = await this.page.evaluate(() => {
      const issues = [];
      
      // 이미지 alt 텍스트 확인
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach(img => {
        issues.push({
          type: 'missing-alt',
          element: img.src,
          message: '이미지에 alt 텍스트가 없습니다'
        });
      });
      
      // 버튼 텍스트 확인
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
          issues.push({
            type: 'missing-button-text',
            element: btn.outerHTML.substring(0, 100),
            message: '버튼에 텍스트나 aria-label이 없습니다'
          });
        }
      });
      
      // 폼 레이블 확인
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        if (!label && !input.getAttribute('aria-label')) {
          issues.push({
            type: 'missing-label',
            element: input.name || input.id,
            message: '입력 필드에 레이블이 없습니다'
          });
        }
      });
      
      return issues;
    });
    
    return violations;
  }
  
  /**
   * 데이터 생성 헬퍼
   */
  generateTestData(type) {
    const timestamp = Date.now();
    
    switch (type) {
      case 'user':
        return {
          email: `test_${timestamp}@videoplanet.test`,
          password: 'Test1234!@#$',
          name: `테스트사용자_${timestamp}`,
          phone: '010-0000-0000',
          company: '테스트 회사'
        };
        
      case 'project':
        return {
          name: `테스트 프로젝트 ${timestamp}`,
          description: `자동 생성된 테스트 프로젝트입니다. (${new Date().toLocaleString()})`,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: Math.floor(Math.random() * 10000000) + 1000000,
          client: '테스트 클라이언트'
        };
        
      case 'feedback':
        return {
          content: `테스트 피드백 내용 ${timestamp}`,
          timestamp: Math.floor(Math.random() * 300), // 0-300초 사이
          type: ['general', 'technical', 'creative'][Math.floor(Math.random() * 3)],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        };
        
      default:
        return {};
    }
  }
  
  /**
   * 대기 헬퍼
   */
  async waitForElement(selector, options = {}) {
    const defaultOptions = {
      state: 'visible',
      timeout: 10000
    };
    
    try {
      await this.page.waitForSelector(selector, { ...defaultOptions, ...options });
      return true;
    } catch (error) {
      console.error(`Element not found: ${selector}`);
      return false;
    }
  }
  
  /**
   * 토스트 메시지 확인
   */
  async checkToastMessage(expectedText) {
    const toastSelectors = [
      '.toast-message',
      '.ant-message',
      '.notification',
      '[role="alert"]'
    ];
    
    for (const selector of toastSelectors) {
      const toast = await this.page.locator(selector).first();
      if (await toast.isVisible()) {
        const text = await toast.textContent();
        return text.includes(expectedText);
      }
    }
    
    return false;
  }
  
  /**
   * 파일 업로드 헬퍼
   */
  async uploadFile(selector, filePath) {
    const fileInput = await this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
    
    // 업로드 완료 대기
    await this.page.waitForTimeout(1000);
    
    // 업로드 성공 확인
    const uploadSuccess = await this.page.locator('.upload-success, .ant-upload-list-item-done').isVisible();
    return uploadSuccess;
  }
  
  /**
   * 테이블 데이터 추출
   */
  async extractTableData(tableSelector) {
    return await this.page.evaluate((selector) => {
      const table = document.querySelector(selector);
      if (!table) return null;
      
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
        return cells;
      });
      
      return { headers, rows };
    }, tableSelector);
  }
}

module.exports = TestHelpers;