// VideoPlanet 디자인 시스템 - 색상 토큰
// 영상 제작 워크플로우에 특화된 종합 색상 팔레트

export const colors = {
  // ========================================
  // 브랜드 색상 (Brand Colors)
  // ========================================
  brand: {
    primary: '#1631F8',      // 브랜드 메인 블루
    primaryDark: '#0F23C9',  // 브랜드 다크 블루
    secondary: '#6C5CE7',    // 브랜드 보조 색상
    accent: '#00D4FF',       // 액센트 색상 (하이라이트용)
  },

  // ========================================
  // 프로젝트 단계별 색상 (Project Phase Colors)
  // ========================================
  phase: {
    planning: {
      main: '#3B82F6',       // 기획 단계 - 파란색
      light: '#DBEAFE',
      dark: '#1E40AF',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    production: {
      main: '#F59E0B',       // 제작 단계 - 주황색
      light: '#FEF3C7',
      dark: '#D97706',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    postproduction: {
      main: '#8B5CF6',       // 후반작업 - 보라색
      light: '#EDE9FE',
      dark: '#7C3AED',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    review: {
      main: '#06B6D4',       // 검토 단계 - 청록색
      light: '#CFFAFE',
      dark: '#0891B2',
      bg: 'rgba(6, 182, 212, 0.1)',
    },
    completed: {
      main: '#10B981',       // 완료 - 초록색
      light: '#D1FAE5',
      dark: '#059669',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    onhold: {
      main: '#6B7280',       // 보류 - 회색
      light: '#F3F4F6',
      dark: '#4B5563',
      bg: 'rgba(107, 114, 128, 0.1)',
    },
  },

  // ========================================
  // 피드백 상태 색상 (Feedback Status Colors)
  // ========================================
  feedback: {
    pending: {
      main: '#F59E0B',       // 대기중 - 주황색
      light: '#FEF3C7',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    inProgress: {
      main: '#3B82F6',       // 진행중 - 파란색
      light: '#DBEAFE',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    resolved: {
      main: '#10B981',       // 해결됨 - 초록색
      light: '#D1FAE5',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    rejected: {
      main: '#EF4444',       // 거절됨 - 빨간색
      light: '#FEE2E2',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
  },

  // ========================================
  // 우선순위 색상 (Priority Colors)
  // ========================================
  priority: {
    critical: {
      main: '#DC2626',       // 긴급 - 진한 빨간색
      light: '#FEE2E2',
      bg: 'rgba(220, 38, 38, 0.1)',
    },
    high: {
      main: '#EA580C',       // 높음 - 주황빨간색
      light: '#FFEDD5',
      bg: 'rgba(234, 88, 12, 0.1)',
    },
    medium: {
      main: '#D97706',       // 보통 - 주황색
      light: '#FEF3C7',
      bg: 'rgba(217, 119, 6, 0.1)',
    },
    low: {
      main: '#059669',       // 낮음 - 초록색
      light: '#D1FAE5',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
  },

  // ========================================
  // AI 기능 색상 (AI Feature Colors)
  // ========================================
  ai: {
    generate: {
      main: '#8B5CF6',       // AI 생성 - 보라색
      light: '#EDE9FE',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    analyze: {
      main: '#06B6D4',       // AI 분석 - 청록색
      light: '#CFFAFE',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      bg: 'rgba(6, 182, 212, 0.1)',
    },
    recommend: {
      main: '#F59E0B',       // AI 추천 - 주황색
      light: '#FEF3C7',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
  },

  // ========================================
  // 시맨틱 색상 (Semantic Colors)
  // ========================================
  semantic: {
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#059669',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#D97706',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#DC2626',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1E40AF',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
  },

  // ========================================
  // 뉴트럴 색상 (Neutral Colors)
  // ========================================
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // ========================================
  // 텍스트 색상 (Text Colors)
  // ========================================
  text: {
    primary: '#18181B',      // 메인 텍스트
    secondary: '#52525B',    // 보조 텍스트
    tertiary: '#71717A',     // 3차 텍스트
    quaternary: '#A1A1AA',   // 4차 텍스트 (힌트 등)
    disabled: '#D4D4D8',     // 비활성화
    inverse: '#FFFFFF',      // 역전 텍스트 (어두운 배경용)
    link: '#1631F8',         // 링크 텍스트
    linkHover: '#0F23C9',    // 링크 호버
  },

  // ========================================
  // 배경 색상 (Background Colors)
  // ========================================
  background: {
    primary: '#FFFFFF',      // 메인 배경
    secondary: '#FAFAFA',    // 보조 배경
    tertiary: '#F4F4F5',     // 3차 배경
    elevated: '#FFFFFF',     // 떠있는 요소 배경 (카드 등)
    overlay: 'rgba(0, 0, 0, 0.5)', // 오버레이 배경
    gradient: {
      primary: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
      danger: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
      success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
  },

  // ========================================
  // 보더 색상 (Border Colors)
  // ========================================
  border: {
    light: '#F4F4F5',       // 가벼운 보더
    default: '#E4E4E7',     // 기본 보더
    medium: '#D4D4D8',      // 중간 보더
    strong: '#A1A1AA',      // 강한 보더
    focus: '#1631F8',       // 포커스 보더
    error: '#EF4444',       // 에러 보더
    success: '#10B981',     // 성공 보더
  },

  // ========================================
  // 다크 모드 색상 (Dark Mode Colors)
  // ========================================
  dark: {
    background: {
      primary: '#09090B',
      secondary: '#18181B',
      tertiary: '#27272A',
      elevated: '#18181B',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
      tertiary: '#71717A',
      quaternary: '#52525B',
    },
    border: {
      light: '#27272A',
      default: '#3F3F46',
      medium: '#52525B',
      strong: '#71717A',
    },
  },
};

// ========================================
// 색상 헬퍼 함수들
// ========================================

/**
 * 프로젝트 단계에 따른 색상 반환
 */
export const getPhaseColor = (phase) => {
  const phaseMap = {
    'planning': colors.phase.planning,
    'production': colors.phase.production,
    'post-production': colors.phase.postproduction,
    'review': colors.phase.review,
    'completed': colors.phase.completed,
    'on-hold': colors.phase.onhold,
  };
  return phaseMap[phase] || colors.phase.planning;
};

/**
 * 우선순위에 따른 색상 반환
 */
export const getPriorityColor = (priority) => {
  const priorityMap = {
    'critical': colors.priority.critical,
    'high': colors.priority.high,
    'medium': colors.priority.medium,
    'low': colors.priority.low,
  };
  return priorityMap[priority] || colors.priority.medium;
};

/**
 * 피드백 상태에 따른 색상 반환
 */
export const getFeedbackColor = (status) => {
  const statusMap = {
    'pending': colors.feedback.pending,
    'in-progress': colors.feedback.inProgress,
    'resolved': colors.feedback.resolved,
    'rejected': colors.feedback.rejected,
  };
  return statusMap[status] || colors.feedback.pending;
};

/**
 * 투명도 적용 헬퍼
 */
export const withOpacity = (color, opacity) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default colors;