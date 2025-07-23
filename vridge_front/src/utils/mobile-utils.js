// 모바일 전용 유틸리티 - 기존 코드에 영향 없이 추가 기능만 제공

// 모바일 브라우저 감지 헬퍼
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// iOS 사파리 감지
const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
  return iOSSafari;
};

export const enhanceMobileExperience = () => {
  try {
    // 모바일인지 확인
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // 모바일이 아니면 아무것도 하지 않음
    
    // 모바일 전용 최적화
    // 1. 터치 이벤트 최적화 (passive 리스너로 성능 향상)
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // 2. 모바일 디버그 정보 (에러 발생시에만)
    window.addEventListener('error', (event) => {
      console.log('[Mobile Debug]', {
        error: event.error?.message || 'Unknown error',
        userAgent: navigator.userAgent,
        url: typeof window !== 'undefined' && window.location.href
      });
    });
    
    // 3. 네트워크 상태 모니터링
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        console.log('[Mobile Network]', navigator.connection.effectiveType);
      });
    }
    
    // 4. iOS Safari 쿠키 처리 개선
    if (isIOSSafari()) {
      // iOS Safari에서 third-party 쿠키 문제 해결을 위한 설정
      if (typeof window !== 'undefined') {
        document.cookie = 'SameSite=None; Secure';
      }
      console.log('[Mobile] iOS Safari detected - cookie settings applied');
    }
    
    // 5. 모바일 뷰포트 설정 확인
    let viewport = typeof window !== 'undefined' ? document.querySelector('meta[name=viewport]') : null;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      document.head.appendChild(viewport);
      console.log('[Mobile] Viewport meta tag added');
    }
    
  } catch (error) {
    // 모바일 최적화 실패해도 앱은 정상 작동
    console.warn('Mobile optimization failed:', error);
  }
};

// API 요청 시 모바일 헤더 추가 (선택적)
export const addMobileHeaders = (config) => {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && config.headers) {
      config.headers['X-Mobile-Client'] = 'true';
      config.headers['X-Client-Type'] = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android';
    }
  } catch (error) {
    // 실패해도 원래 config 그대로 반환
  }
  
  return config;
};

// 모바일에서 localStorage 대체 처리 (iOS Private Browsing 등)
export const safeStorage = {
  setItem: (key, value) => {
    try {
      typeof window !== 'undefined' && localStorage.setItem(key, value);
    } catch (e) {
      // localStorage 사용 불가 시 sessionStorage 시도
      try {
        sessionStorage.setItem(key, value);
      } catch (e2) {
        // 쿠키로 대체
        if (typeof window !== 'undefined') {
          document.cookie = `${key}=${value}; path=/; max-age=86400; SameSite=Lax`;
        }
      }
    }
  },
  
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(key);
    } catch (e) {
      // localStorage 사용 불가 시 sessionStorage 확인
      try {
        return sessionStorage.getItem(key);
      } catch (e2) {
        // 쿠키에서 찾기
        const match = typeof window !== 'undefined' ? document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)')) : null;
        return match ? match[2] : null;
      }
    }
  },
  
  removeItem: (key) => {
    try {
      typeof window !== 'undefined' && localStorage.removeItem(key);
    } catch (e) {
      try {
        sessionStorage.removeItem(key);
      } catch (e2) {
        // 쿠키 삭제
        if (typeof window !== 'undefined') {
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    }
  }
};