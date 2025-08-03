// VideoPlanet 디자인 시스템 - 다크 테마
// 영상 제작 환경에 최적화된 다크모드 색상 체계

import { colors as lightColors } from './colors';

export const darkTheme = {
  // ========================================
  // 브랜드 색상 (변경 없음)
  // ========================================
  brand: {
    ...lightColors.brand,
  },

  // ========================================
  // 프로젝트 단계별 색상 (다크모드 조정)
  // ========================================
  phase: {
    planning: {
      main: '#60A5FA',       // 기획 단계 - 밝은 파란색
      light: '#1E3A8A',
      dark: '#3B82F6',
      bg: 'rgba(96, 165, 250, 0.1)',
    },
    production: {
      main: '#FBBF24',       // 제작 단계 - 밝은 주황색
      light: '#92400E',
      dark: '#F59E0B',
      bg: 'rgba(251, 191, 36, 0.1)',
    },
    postproduction: {
      main: '#A78BFA',       // 후반작업 - 밝은 보라색
      light: '#581C87',
      dark: '#8B5CF6',
      bg: 'rgba(167, 139, 250, 0.1)',
    },
    review: {
      main: '#22D3EE',       // 검토 단계 - 밝은 청록색
      light: '#0E7490',
      dark: '#06B6D4',
      bg: 'rgba(34, 211, 238, 0.1)',
    },
    completed: {
      main: '#34D399',       // 완료 - 밝은 초록색
      light: '#065F46',
      dark: '#10B981',
      bg: 'rgba(52, 211, 153, 0.1)',
    },
    onhold: {
      main: '#9CA3AF',       // 보류 - 밝은 회색
      light: '#374151',
      dark: '#6B7280',
      bg: 'rgba(156, 163, 175, 0.1)',
    },
  },

  // ========================================
  // 피드백 상태 색상 (다크모드 조정)
  // ========================================
  feedback: {
    pending: {
      main: '#FBBF24',
      light: '#92400E',
      bg: 'rgba(251, 191, 36, 0.1)',
    },
    inProgress: {
      main: '#60A5FA',
      light: '#1E3A8A',
      bg: 'rgba(96, 165, 250, 0.1)',
    },
    resolved: {
      main: '#34D399',
      light: '#065F46',
      bg: 'rgba(52, 211, 153, 0.1)',
    },
    rejected: {
      main: '#F87171',
      light: '#7F1D1D',
      bg: 'rgba(248, 113, 113, 0.1)',
    },
  },

  // ========================================
  // 우선순위 색상 (다크모드 조정)
  // ========================================
  priority: {
    critical: {
      main: '#F87171',       // 긴급 - 밝은 빨간색
      light: '#7F1D1D',
      bg: 'rgba(248, 113, 113, 0.1)',
    },
    high: {
      main: '#FB923C',       // 높음 - 밝은 주황빨간색
      light: '#9A3412',
      bg: 'rgba(251, 146, 60, 0.1)',
    },
    medium: {
      main: '#FBBF24',       // 보통 - 밝은 주황색
      light: '#92400E',
      bg: 'rgba(251, 191, 36, 0.1)',
    },
    low: {
      main: '#34D399',       // 낮음 - 밝은 초록색
      light: '#065F46',
      bg: 'rgba(52, 211, 153, 0.1)',
    },
  },

  // ========================================
  // AI 기능 색상 (다크모드 조정)
  // ========================================
  ai: {
    generate: {
      main: '#A78BFA',       // AI 생성 - 밝은 보라색
      light: '#581C87',
      gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
      bg: 'rgba(167, 139, 250, 0.1)',
    },
    analyze: {
      main: '#22D3EE',       // AI 분석 - 밝은 청록색
      light: '#0E7490',
      gradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
      bg: 'rgba(34, 211, 238, 0.1)',
    },
    recommend: {
      main: '#FBBF24',       // AI 추천 - 밝은 주황색
      light: '#92400E',
      gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
      bg: 'rgba(251, 191, 36, 0.1)',
    },
  },

  // ========================================
  // 시맨틱 색상 (다크모드 조정)
  // ========================================
  semantic: {
    success: {
      main: '#34D399',
      light: '#065F46',
      dark: '#10B981',
      bg: 'rgba(52, 211, 153, 0.1)',
    },
    warning: {
      main: '#FBBF24',
      light: '#92400E',
      dark: '#F59E0B',
      bg: 'rgba(251, 191, 36, 0.1)',
    },
    error: {
      main: '#F87171',
      light: '#7F1D1D',
      dark: '#EF4444',
      bg: 'rgba(248, 113, 113, 0.1)',
    },
    info: {
      main: '#60A5FA',
      light: '#1E3A8A',
      dark: '#3B82F6',
      bg: 'rgba(96, 165, 250, 0.1)',
    },
  },

  // ========================================
  // 다크모드 뉴트럴 색상
  // ========================================
  neutral: {
    50: '#18181B',   // 가장 어두운 배경
    100: '#27272A',  // 어두운 배경
    200: '#3F3F46',  // 중간 어두운 배경
    300: '#52525B',  // 중간 배경
    400: '#71717A',  // 중간 밝은 배경
    500: '#A1A1AA',  // 밝은 배경
    600: '#D4D4D8',  // 매우 밝은 배경
    700: '#E4E4E7',  // 거의 흰색
    800: '#F4F4F5',  // 흰색에 가까움
    900: '#FAFAFA',  // 가장 밝은 색
    950: '#FFFFFF',  // 순수 흰색
  },

  // ========================================
  // 다크모드 텍스트 색상
  // ========================================
  text: {
    primary: '#FAFAFA',      // 메인 텍스트 - 밝은 흰색
    secondary: '#D4D4D8',    // 보조 텍스트 - 중간 밝기
    tertiary: '#A1A1AA',     // 3차 텍스트 - 중간
    quaternary: '#71717A',   // 4차 텍스트 - 어두운 회색
    disabled: '#52525B',     // 비활성화 - 더 어두운 회색
    inverse: '#18181B',      // 역전 텍스트 (밝은 배경용)
    link: '#60A5FA',         // 링크 텍스트 - 밝은 파란색
    linkHover: '#3B82F6',    // 링크 호버 - 진한 파란색
  },

  // ========================================
  // 다크모드 배경 색상
  // ========================================
  background: {
    primary: '#09090B',      // 메인 배경 - 거의 검은색
    secondary: '#18181B',    // 보조 배경 - 어두운 회색
    tertiary: '#27272A',     // 3차 배경 - 중간 어두운 회색
    elevated: '#18181B',     // 떠있는 요소 배경 - 카드 등
    overlay: 'rgba(0, 0, 0, 0.7)', // 오버레이 배경 - 더 진한 오버레이
    gradient: {
      primary: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
      danger: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
      success: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
      warning: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    },
  },

  // ========================================
  // 다크모드 보더 색상
  // ========================================
  border: {
    light: '#27272A',       // 가벼운 보더
    default: '#3F3F46',     // 기본 보더
    medium: '#52525B',      // 중간 보더
    strong: '#71717A',      // 강한 보더
    focus: '#60A5FA',       // 포커스 보더
    error: '#F87171',       // 에러 보더
    success: '#34D399',     // 성공 보더
  },

  // ========================================
  // 다크모드 그림자 (조정된 투명도)
  // ========================================
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    default: '0 4px 6px rgba(0, 0, 0, 0.4)',
    md: '0 6px 12px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 24px rgba(0, 0, 0, 0.6)',
    xl: '0 20px 48px rgba(0, 0, 0, 0.7)',
    button: '0 2px 4px rgba(0, 0, 0, 0.4)',
    buttonHover: '0 4px 8px rgba(0, 0, 0, 0.5)',
    primary: '0 4px 14px 0 rgba(96, 165, 250, 0.3)',
    success: '0 4px 14px 0 rgba(52, 211, 153, 0.3)',
    danger: '0 4px 14px 0 rgba(248, 113, 113, 0.3)',
  },
};

// ========================================
// 테마 토글 시스템
// ========================================
export const themeToggle = {
  // CSS 변수 매핑
  cssVariables: {
    light: {
      '--bg-primary': lightColors.background.primary,
      '--bg-secondary': lightColors.background.secondary,
      '--bg-tertiary': lightColors.background.tertiary,
      '--text-primary': lightColors.text.primary,
      '--text-secondary': lightColors.text.secondary,
      '--border-default': lightColors.border.default,
      '--shadow-default': '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    dark: {
      '--bg-primary': darkTheme.background.primary,
      '--bg-secondary': darkTheme.background.secondary,
      '--bg-tertiary': darkTheme.background.tertiary,
      '--text-primary': darkTheme.text.primary,
      '--text-secondary': darkTheme.text.secondary,
      '--border-default': darkTheme.border.default,
      '--shadow-default': darkTheme.shadows.default,
    },
  },
  
  // 테마 전환 애니메이션
  transition: {
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    properties: ['background-color', 'border-color', 'color', 'box-shadow'],
  },
};

// ========================================
// 다크모드 헬퍼 함수들
// ========================================

/**
 * 테마별 색상 반환
 */
export const getThemedColor = (colorPath, isDark = false) => {
  const theme = isDark ? darkTheme : lightColors;
  const path = colorPath.split('.');
  
  let result = theme;
  for (const key of path) {
    result = result?.[key];
    if (!result) break;
  }
  
  return result || colorPath;
};

/**
 * 자동 대비 색상 선택
 */
export const getContrastColor = (backgroundColor, isDark = false) => {
  const theme = isDark ? darkTheme : lightColors;
  
  // 간단한 대비 계산 (실제로는 더 복잡한 알고리즘 사용 가능)
  const isLight = backgroundColor.includes('#F') || backgroundColor.includes('rgb(2');
  
  if (isDark) {
    return isLight ? theme.text.inverse : theme.text.primary;
  } else {
    return isLight ? lightColors.text.primary : lightColors.text.inverse;
  }
};

/**
 * 시스템 다크모드 감지
 */
export const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 테마 변경 이벤트 리스너
 */
export const watchSystemTheme = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e) => callback(e.matches ? 'dark' : 'light');
  
  mediaQuery.addEventListener('change', handler);
  
  return () => mediaQuery.removeEventListener('change', handler);
};

export default darkTheme;