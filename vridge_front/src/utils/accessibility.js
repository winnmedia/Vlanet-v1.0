/**
 * 접근성 유틸리티 함수들
 */

// 키보드 네비게이션 훅
import { useEffect, useCallback } from 'react'
import UnifiedModal from '../../components/unified/UnifiedModal';;

export const useKeyboardNavigation = (items, onSelect) => {
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        // 이전 항목으로 이동
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        // 다음 항목으로 이동
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // 현재 항목 선택
        break;
      case 'Escape':
        e.preventDefault();
        // 취소/닫기
        break;
      case 'Tab':
        // 기본 Tab 동작 유지
        break;
      default:
        break;
    }
  }, [items, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// 포커스 트랩 훅
export const useFocusTrap = (containerRef, isActive = true) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    
    // 초기 포커스 설정
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [containerRef, isActive]);
};

// ARIA 라이브 리전 알림
export const announceToScreenReader = (message, priority = 'polite') => {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';
  
  document.body.appendChild(liveRegion);
  liveRegion.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
};

// 색상 대비 체크
export const checkColorContrast = (foreground, background) => {
  // 색상을 RGB로 변환
  const getRGB = (color) => {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    };
  };
  
  // 상대 휘도 계산
  const getLuminance = (rgb) => {
    const sRGB = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const fg = getRGB(foreground);
  const bg = getRGB(background);
  
  const lum1 = getLuminance(fg);
  const lum2 = getLuminance(bg);
  
  const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  
  return {
    ratio: contrast,
    AA: contrast >= 4.5,
    AAA: contrast >= 7
  };
};

// 스킵 네비게이션 컴포넌트
export const SkipNavigation = () => (
  <a 
    href="#main-content"
    className="skip-navigation"
    style={{
      position: 'absolute',
      left: '-9999px',
      top: '0',
      zIndex: 999,
      padding: '8px 16px',
      background: '#1631F8',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '4px'
    }}
    onFocus={(e) = aria-label="Link"> {
      e.target.style.left = '16px';
      e.target.style.top = '16px';
    }}
    onBlur={(e) => {
      e.target.style.left = '-9999px';
    }}
  >
    메인 콘텐츠로 건너뛰기
  </a>
);

// ARIA 속성 헬퍼
export const ariaProps = {
  button: (label, pressed = null) => ({
    'aria-label': label,
    'aria-pressed': pressed,
    role: 'button',
    tabIndex: 0
  }),
  
  link: (label, current = false) => ({
    'aria-label': label,
    'aria-current': current ? 'page' : undefined,
    role: 'link'
  }),
  
  menu: (label, expanded = false) => ({
    'aria-label': label,
    'aria-expanded': expanded,
    'aria-haspopup': true,
    role: 'button'
  }),
  
  modal: (label, open = false) => ({
    'aria-label': label,
    'aria-modal': true,
    'aria-hidden': !open,
    role: 'dialog'
  }),
  
  loading: (label = '로딩 중') => ({
    'aria-label': label,
    'aria-busy': true,
    role: 'status'
  }),
  
  error: (message) => ({
    'aria-label': message,
    'aria-invalid': true,
    role: 'alert'
  })
};