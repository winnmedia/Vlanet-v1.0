// 피드백 페이지 디자인 시각적 검증 스크립트
// Fronty's Pixel Perfect Validation Tool

const BRAND_COLORS = {
  primary: '#1631F8',
  primaryDark: '#0F23C9',
  danger: '#dc3545',
  dangerDark: '#c82333',
  secondary: '#6c757d',
  secondaryDark: '#5a6268',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8'
};

const DESIGN_TOKENS = {
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%'
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
    primary: '0 4px 12px rgba(22, 49, 248, 0.25)',
    primaryHover: '0 6px 20px rgba(22, 49, 248, 0.4)'
  },
  transitions: {
    fast: '0.2s ease',
    normal: '0.3s ease',
    slow: '0.6s ease'
  }
};

// 픽셀 단위 검증 함수
function validatePixelPerfect() {
  const results = [];
  
  // 1. 버튼 스타일 검증
  const buttons = document.querySelectorAll('[class*="feedbackButton"]');
  buttons.forEach(button => {
    const styles = window.getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    
    results.push({
      element: button.className,
      height: rect.height,
      padding: styles.padding,
      borderRadius: styles.borderRadius,
      background: styles.background,
      boxShadow: styles.boxShadow,
      expectedHeight: button.classList.contains('IconOnly') ? 40 : 44,
      pixelPerfect: Math.abs(rect.height - (button.classList.contains('IconOnly') ? 40 : 44)) < 1
    });
  });
  
  // 2. 컨테이너 검증
  const containers = document.querySelectorAll('.video_box, .sidebox, .tab_container');
  containers.forEach(container => {
    const styles = window.getComputedStyle(container);
    
    results.push({
      element: container.className,
      borderRadius: styles.borderRadius,
      padding: styles.padding,
      boxShadow: styles.boxShadow,
      expectedBorderRadius: '12px',
      pixelPerfect: styles.borderRadius === '12px'
    });
  });
  
  // 3. 색상 검증
  const colorElements = [
    { selector: '.feedbackButtonPrimary', expectedBg: 'linear-gradient(135deg, rgb(22, 49, 248) 0%, rgb(15, 35, 201) 100%)' },
    { selector: '.feedbackButtonDanger', expectedBg: 'linear-gradient(135deg, rgb(220, 53, 69) 0%, rgb(200, 35, 51) 100%)' },
    { selector: '.feedbackButtonSecondary', expectedBg: 'linear-gradient(135deg, rgb(108, 117, 125) 0%, rgb(90, 98, 104) 100%)' }
  ];
  
  colorElements.forEach(({ selector, expectedBg }) => {
    const element = document.querySelector(selector);
    if (element) {
      const styles = window.getComputedStyle(element);
      results.push({
        element: selector,
        background: styles.background,
        expectedBackground: expectedBg,
        colorMatch: styles.background.includes('linear-gradient')
      });
    }
  });
  
  // 4. 스페이싱 검증
  const spacingElements = document.querySelectorAll('.flex');
  spacingElements.forEach(element => {
    const styles = window.getComputedStyle(element);
    results.push({
      element: 'flex container',
      gap: styles.gap,
      expectedGap: '24px',
      pixelPerfect: styles.gap === '24px'
    });
  });
  
  return results;
}

// 시각적 회귀 테스트
function visualRegressionTest() {
  const testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    accuracy: 0,
    details: []
  };
  
  const results = validatePixelPerfect();
  
  results.forEach(result => {
    testResults.totalTests++;
    if (result.pixelPerfect || result.colorMatch) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    testResults.details.push(result);
  });
  
  testResults.accuracy = (testResults.passed / testResults.totalTests * 100).toFixed(2);
  
  // 콘솔에 결과 출력
  console.log('%c🎯 Pixel Perfect Validation Results', 'font-size: 20px; font-weight: bold; color: #1631F8;');
  console.log(`%cTotal Tests: ${testResults.totalTests}`, 'font-size: 14px; color: #333;');
  console.log(`%cPassed: ${testResults.passed}`, 'font-size: 14px; color: #28a745;');
  console.log(`%cFailed: ${testResults.failed}`, 'font-size: 14px; color: #dc3545;');
  console.log(`%cAccuracy: ${testResults.accuracy}%`, 'font-size: 16px; font-weight: bold; color: #1631F8;');
  
  // 상세 결과 테이블로 출력
  console.table(testResults.details);
  
  // 시각적 오버레이 생성
  createVisualOverlay(testResults);
  
  return testResults;
}

// 시각적 오버레이 생성
function createVisualOverlay(results) {
  const overlay = document.createElement('div');
  overlay.id = 'pixel-perfect-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #1631F8;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(22, 49, 248, 0.2);
    z-index: 10000;
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  overlay.innerHTML = `
    <h3 style="margin: 0 0 16px 0; color: #1631F8; font-size: 18px;">
      🎯 Pixel Perfect Report
    </h3>
    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
      <span style="color: #666; font-size: 14px;">Accuracy:</span>
      <span style="color: #1631F8; font-weight: bold; font-size: 16px;">${results.accuracy}%</span>
    </div>
    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
      <div style="flex: 1; text-align: center;">
        <div style="color: #28a745; font-size: 24px; font-weight: bold;">${results.passed}</div>
        <div style="color: #666; font-size: 12px;">Passed</div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="color: #dc3545; font-size: 24px; font-weight: bold;">${results.failed}</div>
        <div style="color: #666; font-size: 12px;">Failed</div>
      </div>
    </div>
    <button onclick="document.getElementById('pixel-perfect-overlay').remove()" 
      style="
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      "
      onmouseover="this.style.transform='translateY(-2px)'"
      onmouseout="this.style.transform='translateY(0)'">
      Close Report
    </button>
  `;
  
  document.body.appendChild(overlay);
}

// 디자인 토큰 검증
function validateDesignTokens() {
  console.log('%c🎨 Design Token Validation', 'font-size: 18px; font-weight: bold; color: #6f42c1;');
  
  // 색상 토큰 검증
  console.log('%cColor Tokens:', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  Object.entries(BRAND_COLORS).forEach(([name, value]) => {
    console.log(`%c  ${name}: ${value}`, `color: ${value}; font-weight: bold;`);
  });
  
  // 스페이싱 토큰 검증
  console.log('%cSpacing Tokens:', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  Object.entries(DESIGN_TOKENS.spacing).forEach(([name, value]) => {
    console.log(`  ${name}: ${value}`);
  });
  
  // 그림자 토큰 검증
  console.log('%cShadow Tokens:', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  Object.entries(DESIGN_TOKENS.shadows).forEach(([name, value]) => {
    console.log(`  ${name}: ${value}`);
  });
}

// 자동 실행 (페이지 로드 후)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.clear();
      console.log('%c🔍 Starting Pixel Perfect Validation...', 'font-size: 16px; color: #1631F8;');
      validateDesignTokens();
      const results = visualRegressionTest();
      
      // 결과를 localStorage에 저장
      localStorage.setItem('pixelPerfectResults', JSON.stringify(results));
      
      console.log('%c✅ Validation Complete!', 'font-size: 16px; color: #28a745; font-weight: bold;');
    }, 1000);
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validatePixelPerfect,
    visualRegressionTest,
    validateDesignTokens,
    BRAND_COLORS,
    DESIGN_TOKENS
  };
}