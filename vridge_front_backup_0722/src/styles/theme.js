// VideoPlanet 테마 시스템
// CLAUDE.md에 정의된 디자인 가이드를 따름

export const colors = {
  // 주요 액션 버튼 (파란색)
  primary: {
    main: '#1631F8',
    gradient: {
      start: '#1631F8',
      end: '#0F23C9'
    },
    hover: '#0F23C9',
    disabled: 'rgba(22, 49, 248, 0.6)'
  },
  
  // 위험/취소 액션 (빨간색)
  danger: {
    main: '#dc3545',
    gradient: {
      start: '#dc3545',
      end: '#c82333'
    },
    hover: '#c82333',
    disabled: 'rgba(220, 53, 69, 0.6)'
  },
  
  // 성공 상태 (초록색)
  success: {
    main: '#28a745',
    light: '#34ce57',
    dark: '#218838'
  },
  
  // 경고 상태 (노란색)
  warning: {
    main: '#ffc107',
    light: '#ffca2c',
    dark: '#e0a800'
  },
  
  // 정보 상태 (하늘색)
  info: {
    main: '#17a2b8',
    light: '#1fc8e3',
    dark: '#117a8b'
  },
  
  // 회색 계열
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529'
  },
  
  // 배경색
  background: {
    default: '#ffffff',
    paper: '#f8f9fa',
    dark: '#1a1a1a'
  },
  
  // 텍스트 색상
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    disabled: '#adb5bd',
    hint: '#adb5bd'
  },
  
  // 보더 색상
  border: {
    light: '#dee2e6',
    main: '#ced4da',
    dark: '#adb5bd'
  }
};

// 그림자 효과
export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.075)',
  default: '0 4px 6px rgba(0, 0, 0, 0.1)',
  md: '0 6px 12px rgba(0, 0, 0, 0.15)',
  lg: '0 10px 24px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 48px rgba(0, 0, 0, 0.25)',
  button: '0 2px 4px rgba(0, 0, 0, 0.1)',
  buttonHover: '0 4px 8px rgba(0, 0, 0, 0.15)'
};

// 전환 효과
export const transitions = {
  fast: '150ms ease-in-out',
  default: '300ms ease-in-out',
  slow: '500ms ease-in-out',
  button: 'all 0.3s ease'
};

// 반응형 브레이크포인트
export const breakpoints = {
  xs: '480px',
  sm: '768px',
  md: '1024px',
  lg: '1280px',
  xl: '1920px'
};

// 버튼 스타일 헬퍼
export const buttonStyles = {
  primary: {
    background: `linear-gradient(135deg, ${colors.primary.gradient.start} 0%, ${colors.primary.gradient.end} 100%)`,
    color: '#ffffff',
    border: 'none',
    transition: transitions.button,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: shadows.buttonHover
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  danger: {
    background: `linear-gradient(135deg, ${colors.danger.gradient.start} 0%, ${colors.danger.gradient.end} 100%)`,
    color: '#ffffff',
    border: 'none',
    transition: transitions.button,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: shadows.buttonHover
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  outline: {
    background: 'transparent',
    color: colors.primary.main,
    border: `1px solid ${colors.primary.main}`,
    transition: transitions.button,
    '&:hover': {
      background: colors.primary.main,
      color: '#ffffff'
    }
  }
};

// 테마 객체
const theme = {
  colors,
  shadows,
  transitions,
  breakpoints,
  buttonStyles
};

export default theme;