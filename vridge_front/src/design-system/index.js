// VideoPlanet 디자인 시스템 - 통합 인덱스
// 영상 제작 워크플로우에 특화된 디자인 시스템의 메인 엔트리 포인트

// ========================================
// 디자인 토큰 (Design Tokens)
// ========================================
export { default as colors, getPhaseColor, getPriorityColor, getFeedbackColor, withOpacity } from './tokens/colors';
export { default as typography, getTypographyStyle, getResponsiveTypography, getContextualTypography } from './tokens/typography';
export { default as spacing, semanticSpacing, grid, videoProductionSpacing, componentSpacing, responsiveSpacing, multiplySpacing, getContextualSpacing } from './tokens/spacing';
export { default as animations, createAnimation, createDelayedAnimation, responsiveAnimation, accessibleAnimation } from './tokens/animations';
export { default as darkTheme, themeToggle, getThemedColor, getContrastColor, getSystemTheme, watchSystemTheme } from './tokens/dark-theme';

// ========================================
// 핵심 컴포넌트 (Core Components)
// ========================================
export { default as Button } from './components/Button/Button';
export { default as Card, ProjectCard, FeedbackCard } from './components/Card/Card';
export { default as Icon } from './components/Icon/Icon';

// ========================================
// 고급 컴포넌트 (Advanced Components)
// ========================================
export { default as PlanningWizard } from './components/PlanningWizard/PlanningWizard';
export { default as IntegratedDashboard } from './components/IntegratedDashboard/IntegratedDashboard';
export { default as FeedbackTimeline } from './components/FeedbackTimeline/FeedbackTimeline';

// ========================================
// 모바일 우선 패턴 (Mobile-First Patterns)
// ========================================
export {
  useResponsive,
  AdaptiveLayout,
  MobileNavigation,
  TouchCard,
  MobileFormField,
  MobileModal,
  ResponsiveGrid,
  MobileVideoControls
} from './patterns/MobileFirst/MobileFirst';

// ========================================
// 통합 테마 시스템
// ========================================
export const designSystem = {
  // 토큰
  tokens: {
    colors,
    typography,
    spacing,
    animations,
    darkTheme,
  },
  
  // 컴포넌트
  components: {
    Button,
    Card,
    ProjectCard,
    FeedbackCard,
    Icon,
  },
  
  // 유틸리티
  utils: {
    getPhaseColor,
    getPriorityColor,
    getFeedbackColor,
    getTypographyStyle,
    getThemedColor,
    getSystemTheme,
    createAnimation,
    responsiveSpacing,
  },
};

// ========================================
// 빠른 접근을 위한 상수들
// ========================================

// 브랜드 색상
export const BRAND_COLORS = {
  PRIMARY: '#1631F8',
  PRIMARY_DARK: '#0F23C9',
  DANGER: '#dc3545',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
};

// 프로젝트 단계 색상
export const PHASE_COLORS = {
  PLANNING: '#3B82F6',
  PRODUCTION: '#F59E0B',
  POST_PRODUCTION: '#8B5CF6',
  REVIEW: '#06B6D4',
  COMPLETED: '#10B981',
  ON_HOLD: '#6B7280',
};

// 우선순위 색상
export const PRIORITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#059669',
};

// AI 기능 색상
export const AI_COLORS = {
  GENERATE: '#8B5CF6',
  ANALYZE: '#06B6D4',
  RECOMMEND: '#F59E0B',
};

// 공통 간격
export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
};

// 애니메이션 지속시간
export const ANIMATION_DURATION = {
  FAST: '150ms',
  NORMAL: '250ms',
  SLOW: '350ms',
  SLOWER: '500ms',
};

// 브레이크포인트
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1280px',
};

// ========================================
// CSS 변수 생성 헬퍼
// ========================================
export const generateCSSVariables = (theme = 'light') => {
  const isDark = theme === 'dark';
  const colorTheme = isDark ? darkTheme : colors;
  
  return {
    // 브랜드 색상
    '--brand-primary': colorTheme.brand?.primary || BRAND_COLORS.PRIMARY,
    '--brand-primary-dark': colorTheme.brand?.primaryDark || BRAND_COLORS.PRIMARY_DARK,
    
    // 배경 색상
    '--bg-primary': colorTheme.background?.primary || (isDark ? '#09090B' : '#FFFFFF'),
    '--bg-secondary': colorTheme.background?.secondary || (isDark ? '#18181B' : '#FAFAFA'),
    '--bg-tertiary': colorTheme.background?.tertiary || (isDark ? '#27272A' : '#F4F4F5'),
    
    // 텍스트 색상
    '--text-primary': colorTheme.text?.primary || (isDark ? '#FAFAFA' : '#18181B'),
    '--text-secondary': colorTheme.text?.secondary || (isDark ? '#D4D4D8' : '#52525B'),
    '--text-tertiary': colorTheme.text?.tertiary || (isDark ? '#A1A1AA' : '#71717A'),
    
    // 보더 색상
    '--border-light': colorTheme.border?.light || (isDark ? '#27272A' : '#F4F4F5'),
    '--border-default': colorTheme.border?.default || (isDark ? '#3F3F46' : '#E4E4E7'),
    '--border-medium': colorTheme.border?.medium || (isDark ? '#52525B' : '#D4D4D8'),
    
    // 그림자
    '--shadow-sm': isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.075)',
    '--shadow-md': isDark ? '0 6px 12px rgba(0, 0, 0, 0.5)' : '0 6px 12px rgba(0, 0, 0, 0.15)',
    '--shadow-lg': isDark ? '0 10px 24px rgba(0, 0, 0, 0.6)' : '0 10px 24px rgba(0, 0, 0, 0.2)',
    
    // 간격
    '--spacing-xs': SPACING.XS,
    '--spacing-sm': SPACING.SM,
    '--spacing-md': SPACING.MD,
    '--spacing-lg': SPACING.LG,
    '--spacing-xl': SPACING.XL,
    '--spacing-xxl': SPACING.XXL,
    
    // 애니메이션
    '--duration-fast': ANIMATION_DURATION.FAST,
    '--duration-normal': ANIMATION_DURATION.NORMAL,
    '--duration-slow': ANIMATION_DURATION.SLOW,
    '--duration-slower': ANIMATION_DURATION.SLOWER,
    
    // 이징
    '--easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    '--easing-decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
    '--easing-accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
  };
};

// ========================================
// 초기화 함수
// ========================================
export const initializeDesignSystem = (options = {}) => {
  const {
    theme = 'light',
    applyGlobalStyles = true,
    rootElement = document.documentElement,
  } = options;
  
  if (typeof window === 'undefined') return;
  
  // CSS 변수 적용
  const cssVars = generateCSSVariables(theme);
  Object.entries(cssVars).forEach(([key, value]) => {
    rootElement.style.setProperty(key, value);
  });
  
  // 테마 클래스 적용
  rootElement.setAttribute('data-theme', theme);
  
  // 글로벌 스타일 적용 (선택적)
  if (applyGlobalStyles) {
    const globalStyles = `
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--font-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        background-color: var(--bg-primary);
        color: var(--text-primary);
        transition: background-color var(--duration-normal) var(--easing-standard),
                    color var(--duration-normal) var(--easing-standard);
      }
      
      button, input, select, textarea {
        font-family: inherit;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
  }
  
  return {
    updateTheme: (newTheme) => initializeDesignSystem({ ...options, theme: newTheme }),
    getCSSVariables: () => cssVars,
  };
};

// ========================================
// 컴포넌트 팩토리 함수들
// ========================================

/**
 * 프로젝트 카드 생성 헬퍼
 */
export const createProjectCard = (projectData) => {
  return {
    ...projectData,
    phaseColor: getPhaseColor(projectData.phase),
    priorityColor: getPriorityColor(projectData.priority),
    statusColor: getFeedbackColor(projectData.status),
  };
};

/**
 * 테마별 스타일 생성 헬퍼
 */
export const createThemedStyles = (lightStyles, darkStyles) => {
  return {
    light: lightStyles,
    dark: darkStyles,
    get: (theme) => theme === 'dark' ? darkStyles : lightStyles,
  };
};

// ========================================
// 검증 함수들
// ========================================

/**
 * 색상 대비 검증
 */
export const validateColorContrast = (foreground, background) => {
  // 간단한 대비 계산 (실제 구현에서는 더 정확한 알고리즘 사용)
  const getLuminance = (color) => {
    const rgb = color.replace('#', '');
    const r = parseInt(rgb.substr(0, 2), 16) / 255;
    const g = parseInt(rgb.substr(2, 2), 16) / 255;
    const b = parseInt(rgb.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio: contrast,
    isAccessible: contrast >= 4.5,
    isEnhanced: contrast >= 7,
  };
};

/**
 * 반응형 값 계산
 */
export const calculateResponsiveValue = (baseValue, breakpoint) => {
  const multipliers = {
    mobile: 0.875,   // 87.5%
    tablet: 0.9375,  // 93.75%
    desktop: 1,      // 100%
  };
  
  const multiplier = multipliers[breakpoint] || 1;
  const numericValue = parseInt(baseValue) || 0;
  
  return `${Math.round(numericValue * multiplier)}px`;
};

export default designSystem;