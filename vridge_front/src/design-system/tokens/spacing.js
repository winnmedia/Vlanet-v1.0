// VideoPlanet 디자인 시스템 - 간격 토큰
// 8px 기반 일관된 스페이싱 시스템

export const spacing = {
  // ========================================
  // 기본 스페이싱 스케일 (8px 기준)
  // ========================================
  0: '0px',
  1: '4px',    // 0.5 * 8px
  2: '8px',    // 1 * 8px - 기본 단위
  3: '12px',   // 1.5 * 8px
  4: '16px',   // 2 * 8px
  5: '20px',   // 2.5 * 8px
  6: '24px',   // 3 * 8px
  7: '28px',   // 3.5 * 8px
  8: '32px',   // 4 * 8px
  9: '36px',   // 4.5 * 8px
  10: '40px',  // 5 * 8px
  12: '48px',  // 6 * 8px
  14: '56px',  // 7 * 8px
  16: '64px',  // 8 * 8px
  20: '80px',  // 10 * 8px
  24: '96px',  // 12 * 8px
  28: '112px', // 14 * 8px
  32: '128px', // 16 * 8px
  36: '144px', // 18 * 8px
  40: '160px', // 20 * 8px
  44: '176px', // 22 * 8px
  48: '192px', // 24 * 8px
  52: '208px', // 26 * 8px
  56: '224px', // 28 * 8px
  60: '240px', // 30 * 8px
  64: '256px', // 32 * 8px
  72: '288px', // 36 * 8px
  80: '320px', // 40 * 8px
  96: '384px', // 48 * 8px
};

// ========================================
// 시맨틱 스페이싱 (의미 기반)
// ========================================
export const semanticSpacing = {
  // 컴포넌트 내부 간격
  componentPadding: {
    xs: spacing[2],    // 8px
    sm: spacing[3],    // 12px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },
  
  // 컴포넌트 간 간격
  componentGap: {
    xs: spacing[2],    // 8px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[12],   // 48px
  },
  
  // 섹션 간 간격
  sectionGap: {
    sm: spacing[8],    // 32px
    md: spacing[12],   // 48px
    lg: spacing[16],   // 64px
    xl: spacing[20],   // 80px
    xxl: spacing[24],  // 96px
  },
  
  // 페이지 레벨 간격
  pageSpacing: {
    padding: spacing[6],  // 24px
    margin: spacing[8],   // 32px
    gutter: spacing[4],   // 16px
  },
};

// ========================================
// 그리드 시스템
// ========================================
export const grid = {
  // 컨테이너 설정
  container: {
    maxWidth: '1440px',
    padding: {
      mobile: spacing[4],   // 16px
      tablet: spacing[6],   // 24px
      desktop: spacing[8],  // 32px
    },
  },
  
  // 컬럼 시스템 (12컬럼 기준)
  columns: 12,
  
  // 거터 (컬럼 간 간격)
  gutter: {
    mobile: spacing[4],   // 16px
    tablet: spacing[6],   // 24px
    desktop: spacing[8],  // 32px
  },
  
  // 브레이크포인트
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1440px',
  },
};

// ========================================
// 영상 제작 특화 스페이싱
// ========================================
export const videoProductionSpacing = {
  // 프로젝트 카드 간격
  projectCard: {
    gap: spacing[6],        // 24px
    padding: spacing[6],    // 24px
    margin: spacing[4],     // 16px
  },
  
  // 타임라인 간격
  timeline: {
    itemGap: spacing[4],    // 16px
    padding: spacing[6],    // 24px
    marker: spacing[2],     // 8px
  },
  
  // 피드백 시스템 간격
  feedback: {
    itemGap: spacing[3],    // 12px
    padding: spacing[4],    // 16px
    replyIndent: spacing[8], // 32px
  },
  
  // 간트차트 간격
  gantt: {
    rowHeight: spacing[10], // 40px
    columnWidth: spacing[8], // 32px
    padding: spacing[4],    // 16px
  },
  
  // AI 결과 표시 간격
  aiResults: {
    sectionGap: spacing[8], // 32px
    itemGap: spacing[4],    // 16px
    padding: spacing[6],    // 24px
  },
};

// ========================================
// 컴포넌트별 스페이싱 가이드
// ========================================
export const componentSpacing = {
  // 버튼
  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[6]}`, // 16px 24px
    },
    gap: spacing[2], // 8px (아이콘과 텍스트 간격)
  },
  
  // 카드
  card: {
    padding: {
      sm: spacing[4],  // 16px
      md: spacing[6],  // 24px
      lg: spacing[8],  // 32px
    },
    gap: spacing[4],   // 16px (카드 간격)
  },
  
  // 모달
  modal: {
    padding: spacing[8],     // 32px
    headerGap: spacing[6],   // 24px
    contentGap: spacing[4],  // 16px
    footerGap: spacing[6],   // 24px
  },
  
  // 입력 필드
  input: {
    padding: `${spacing[3]} ${spacing[4]}`, // 12px 16px
    gap: spacing[2],    // 8px (라벨과 필드 간격)
    groupGap: spacing[4], // 16px (필드 그룹 간격)
  },
  
  // 네비게이션
  navigation: {
    padding: spacing[4],     // 16px
    itemGap: spacing[2],     // 8px
    sectionGap: spacing[6],  // 24px
  },
  
  // 헤더
  header: {
    height: spacing[16],     // 64px
    padding: `${spacing[4]} ${spacing[6]}`, // 16px 24px
  },
  
  // 사이드바
  sidebar: {
    width: spacing[64],      // 256px
    padding: spacing[6],     // 24px
    itemGap: spacing[1],     // 4px
  },
};

// ========================================
// 유틸리티 함수들
// ========================================

/**
 * 반응형 스페이싱 생성
 */
export const responsiveSpacing = (mobile, tablet, desktop) => ({
  mobile: spacing[mobile] || mobile,
  tablet: spacing[tablet] || tablet,
  desktop: spacing[desktop] || desktop,
});

/**
 * 간격 배율 계산
 */
export const multiplySpacing = (baseSpacing, multiplier) => {
  const baseValue = parseInt(spacing[baseSpacing] || baseSpacing);
  return `${baseValue * multiplier}px`;
};

/**
 * 컨텍스트별 간격 추천
 */
export const getContextualSpacing = (context, size = 'md') => {
  const contextMap = {
    'tight': { sm: 1, md: 2, lg: 3 },
    'normal': { sm: 2, md: 4, lg: 6 },
    'loose': { sm: 4, md: 6, lg: 8 },
    'extraLoose': { sm: 6, md: 8, lg: 12 },
  };
  
  const spacingMap = contextMap[context] || contextMap.normal;
  return spacing[spacingMap[size]];
};

/**
 * CSS 변수 형태로 변환
 */
export const spacingCSSVars = Object.entries(spacing).reduce((acc, [key, value]) => {
  acc[`--spacing-${key}`] = value;
  return acc;
}, {});

export default spacing;