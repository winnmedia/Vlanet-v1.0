/**
 * VideoPlanet Design Tokens
 * 디자인 시스템의 기본 토큰 정의
 * 2025년 최신 표준 적용
 */

const tokens = {
  // 색상 토큰
  colors: {
    // 브랜드 색상 (CLAUDE.md 기준)
    primary: {
      50: '#E3E8FF',
      100: '#C6D1FF',
      200: '#8FA3FF',
      300: '#5876FF',
      400: '#2548FF',
      500: '#1631F8', // 주요 액션 버튼
      600: '#0F23C9',
      700: '#0A1897',
      800: '#060D65',
      900: '#030633',
    },
    
    // 시맨틱 색상
    semantic: {
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
    },
    
    // 중립 색상
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      1000: '#000000',
    },
    
    // 기능별 색상
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      inverse: '#111827',
    },
    
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
      link: '#1631F8',
      danger: '#dc3545',
    },
  },
  
  // 타이포그래피
  typography: {
    fontFamily: {
      sans: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"JetBrains Mono", "SF Mono", Monaco, Consolas, "Courier New", monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // 간격
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },
  
  // 브레이크포인트
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // 반지름
  borderRadius: {
    none: '0px',
    sm: '0.125rem',  // 2px
    base: '0.25rem', // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // 그림자
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // 애니메이션
  animation: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Z-인덱스
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
    toast: 1600,
  },
};

// CSS 변수로 내보내기 함수
export function generateCSSVariables() {
  const cssVars = [];
  
  // 색상 변수
  Object.entries(tokens.colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        cssVars.push(`--color-${category}-${key}: ${value};`);
      });
    }
  });
  
  // 간격 변수
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });
  
  // 폰트 크기 변수
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value};`);
  });
  
  // 그림자 변수
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  return cssVars.join('\n  ');
}

// 다크 모드 토큰
export const darkTokens = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
      inverse: '#FFFFFF',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#111827',
      link: '#5876FF',
      danger: '#EF4444',
    },
  },
};

export default tokens;