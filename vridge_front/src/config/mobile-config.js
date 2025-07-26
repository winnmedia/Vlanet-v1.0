// 모바일 환경 감지 및 설정
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

// 모바일 전용 설정
export const setupMobileConfig = () => {
  if (isMobile()) {
    // 모바일 뷰포트 설정
    const viewport = typeof window !== 'undefined' && document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // iOS 상태바 스타일
    if (isIOS()) {
      const statusBar = typeof window !== 'undefined' && document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBar) {
        statusBar.setAttribute('content', 'black-translucent');
      }
    }

    // 모바일 터치 이벤트 최적화
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    console.log('[Mobile Config] Mobile environment detected:', {
      isMobile: true,
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      userAgent: navigator.userAgent
    });
  }
};

// API 연결 문제 해결을 위한 재시도 설정
export const mobileAPIConfig = {
  timeout: 30000, // 30초
  retries: 3,
  retryDelay: 1000
};