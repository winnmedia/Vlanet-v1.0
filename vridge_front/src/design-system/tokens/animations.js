// VideoPlanet 디자인 시스템 - 애니메이션 토큰
// 영상 제작 워크플로우에 특화된 마이크로 인터랙션 가이드

export const animations = {
  // ========================================
  // 애니메이션 지속 시간 (Duration)
  // ========================================
  duration: {
    instant: '0ms',        // 즉시
    fast: '150ms',         // 빠른 애니메이션 (호버, 포커스)
    normal: '250ms',       // 기본 애니메이션 (버튼, 카드)
    slow: '350ms',         // 느린 애니메이션 (모달, 드로어)
    slower: '500ms',       // 매우 느린 애니메이션 (페이지 전환)
    slowest: '750ms',      // 가장 느린 애니메이션 (복잡한 변환)
  },

  // ========================================
  // 이징 함수 (Easing Functions)
  // ========================================
  easing: {
    // 표준 이징
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // 커스텀 이징 (Material Design 기반)
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',      // 기본 애니메이션
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',      // 감속 (나타나는 요소)
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',      // 가속 (사라지는 요소)
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',         // 날카로운 (빠른 변화)
    
    // 영상 제작 특화 이징
    videoPlay: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // 재생 버튼
    timeline: 'cubic-bezier(0.19, 1, 0.22, 1)',           // 타임라인 이동
    feedback: 'cubic-bezier(0.34, 1.56, 0.64, 1)',        // 피드백 애니메이션
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',     // 바운스 효과
  },

  // ========================================
  // 기본 트랜지션 (Base Transitions)
  // ========================================
  transitions: {
    // 일반적인 속성별 트랜지션
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    color: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // 영상 제작 특화 트랜지션
    cardHover: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    buttonPress: 'transform 150ms cubic-bezier(0.4, 0, 0.6, 1)',
    modalShow: 'all 350ms cubic-bezier(0, 0, 0.2, 1)',
    modalHide: 'all 250ms cubic-bezier(0.4, 0, 1, 1)',
    timelineSeek: 'all 150ms cubic-bezier(0.19, 1, 0.22, 1)',
    progressUpdate: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ========================================
  // 키프레임 애니메이션 (Keyframes)
  // ========================================
  keyframes: {
    // 로딩 애니메이션
    spin: {
      name: 'spin',
      keyframes: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
      animation: 'spin 1s linear infinite',
    },
    
    // 펄스 애니메이션 (로딩, 강조)
    pulse: {
      name: 'pulse',
      keyframes: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    
    // 바운스 애니메이션 (성공, 완료)
    bounce: {
      name: 'bounce',
      keyframes: `
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
          40%, 43% { transform: translate3d(0, -8px, 0); }
          70% { transform: translate3d(0, -4px, 0); }
          90% { transform: translate3d(0, -2px, 0); }
        }
      `,
      animation: 'bounce 1s ease-in-out',
    },
    
    // 흔들기 애니메이션 (에러, 경고)
    shake: {
      name: 'shake',
      keyframes: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `,
      animation: 'shake 0.5s ease-in-out',
    },
    
    // 페이드인 애니메이션
    fadeIn: {
      name: 'fadeIn',
      keyframes: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
      animation: 'fadeIn 250ms cubic-bezier(0, 0, 0.2, 1) forwards',
    },
    
    // 페이드아웃 애니메이션
    fadeOut: {
      name: 'fadeOut',
      keyframes: `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `,
      animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
    },
    
    // 슬라이드업 애니메이션 (모달, 토스트)
    slideUp: {
      name: 'slideUp',
      keyframes: `
        @keyframes slideUp {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
      `,
      animation: 'slideUp 250ms cubic-bezier(0, 0, 0.2, 1) forwards',
    },
    
    // 슬라이드다운 애니메이션
    slideDown: {
      name: 'slideDown',
      keyframes: `
        @keyframes slideDown {
          from { 
            transform: translateY(0); 
            opacity: 1; 
          }
          to { 
            transform: translateY(20px); 
            opacity: 0; 
          }
        }
      `,
      animation: 'slideDown 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
    },
    
    // 스케일업 애니메이션 (버튼 클릭, 강조)
    scaleUp: {
      name: 'scaleUp',
      keyframes: `
        @keyframes scaleUp {
          from { 
            transform: scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
      `,
      animation: 'scaleUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    },
    
    // 영상 제작 특화 애니메이션
    progressFill: {
      name: 'progressFill',
      keyframes: `
        @keyframes progressFill {
          from { width: 0%; }
          to { width: var(--progress-width, 100%); }
        }
      `,
      animation: 'progressFill 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
    
    // AI 분석 애니메이션
    aiThinking: {
      name: 'aiThinking',
      keyframes: `
        @keyframes aiThinking {
          0%, 60%, 100% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.1); opacity: 0.8; }
        }
      `,
      animation: 'aiThinking 1.5s ease-in-out infinite',
    },
    
    // 타임라인 재생 헤드 애니메이션
    timelineHead: {
      name: 'timelineHead',
      keyframes: `
        @keyframes timelineHead {
          0% { transform: translateX(0); }
          100% { transform: translateX(var(--timeline-progress, 100%)); }
        }
      `,
      animation: 'timelineHead var(--video-duration, 10s) linear',
    },
  },

  // ========================================
  // 영상 제작 특화 마이크로 인터랙션
  // ========================================
  microInteractions: {
    // 버튼 상호작용
    button: {
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      active: {
        transform: 'translateY(0)',
        transition: 'all 100ms cubic-bezier(0.4, 0, 0.6, 1)',
      },
      focus: {
        outline: '2px solid var(--focus-color)',
        outlineOffset: '2px',
        transition: 'outline 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    
    // 카드 상호작용
    card: {
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      selected: {
        borderColor: 'var(--primary-color)',
        boxShadow: '0 0 0 2px rgba(var(--primary-rgb), 0.2)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    
    // 입력 필드 상호작용
    input: {
      focus: {
        borderColor: 'var(--primary-color)',
        boxShadow: '0 0 0 3px rgba(var(--primary-rgb), 0.1)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      error: {
        borderColor: 'var(--error-color)',
        boxShadow: '0 0 0 3px rgba(var(--error-rgb), 0.1)',
        animation: 'shake 0.5s ease-in-out',
      },
    },
    
    // 모달 상호작용
    modal: {
      show: {
        backdrop: {
          opacity: '0',
          animation: 'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1) forwards',
        },
        content: {
          transform: 'scale(0.95) translateY(-20px)',
          opacity: '0',
          animation: 'scaleUp 250ms cubic-bezier(0, 0, 0.2, 1) forwards',
        },
      },
      hide: {
        backdrop: {
          animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
        },
        content: {
          animation: 'slideDown 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
        },
      },
    },
    
    // 토스트 알림 상호작용
    toast: {
      show: {
        transform: 'translateY(20px)',
        opacity: '0',
        animation: 'slideUp 250ms cubic-bezier(0, 0, 0.2, 1) forwards',
      },
      hide: {
        animation: 'slideDown 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
      },
    },
    
    // 로딩 상태
    loading: {
      spinner: {
        animation: 'spin 1s linear infinite',
      },
      progress: {
        animation: 'progressFill var(--duration, 2s) cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      skeleton: {
        animation: 'pulse 1.5s ease-in-out infinite',
      },
    },
  },

  // ========================================
  // 상태별 애니메이션 세트
  // ========================================
  states: {
    // 성공 상태
    success: {
      icon: 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      background: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      border: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // 에러 상태
    error: {
      shake: 'shake 0.5s ease-in-out',
      highlight: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // 로딩 상태
    loading: {
      spinner: 'spin 1s linear infinite',
      dots: 'pulse 1.4s ease-in-out infinite',
      progress: 'progressFill var(--duration) cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // AI 처리 상태
    aiProcessing: {
      thinking: 'aiThinking 1.5s ease-in-out infinite',
      generating: 'pulse 1s ease-in-out infinite',
    },
  },

  // ========================================
  // 페이지 전환 애니메이션
  // ========================================
  pageTransitions: {
    fadeTransition: {
      enter: 'fadeIn 300ms cubic-bezier(0, 0, 0.2, 1) forwards',
      exit: 'fadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
    },
    slideTransition: {
      enter: 'slideUp 400ms cubic-bezier(0, 0, 0.2, 1) forwards',
      exit: 'slideDown 300ms cubic-bezier(0.4, 0, 1, 1) forwards',
    },
  },
};

// ========================================
// 애니메이션 헬퍼 함수들
// ========================================

/**
 * 커스텀 애니메이션 생성
 */
export const createAnimation = (duration, easing = 'standard', properties = ['all']) => {
  const easingValue = animations.easing[easing] || easing;
  const durationValue = animations.duration[duration] || duration;
  
  return properties.map(prop => `${prop} ${durationValue} ${easingValue}`).join(', ');
};

/**
 * 지연 애니메이션 생성
 */
export const createDelayedAnimation = (animation, delay, index = 0) => {
  const delayValue = typeof delay === 'string' ? delay : `${delay * (index + 1)}ms`;
  return `${animation}, animation-delay: ${delayValue}`;
};

/**
 * 반응형 애니메이션 (성능 고려)
 */
export const responsiveAnimation = (desktop, mobile) => ({
  default: desktop,
  '@media (prefers-reduced-motion: reduce)': 'none',
  '@media (max-width: 768px)': mobile || 'none',
});

/**
 * 접근성을 고려한 애니메이션
 */
export const accessibleAnimation = (animation) => ({
  animation,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
  },
});

export default animations;