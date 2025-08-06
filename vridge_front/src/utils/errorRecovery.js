/**
 * 에러 복구 시스템
 * 자동으로 에러를 감지하고 복구 시도
 */

class ErrorRecoverySystem {
  constructor() {
    this.retryAttempts = {};
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.errorLog = [];
  }

  /**
   * API 호출 래퍼 - 자동 재시도 기능 포함
   */
  async withRetry(fn, options = {}) {
    const {
      maxRetries = this.maxRetries,
      retryDelay = this.retryDelay,
      onError = null,
      fallback = null,
    } = options;

    const fnId = fn.toString().substring(0, 50);
    this.retryAttempts[fnId] = this.retryAttempts[fnId] || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        this.retryAttempts[fnId] = 0; // 성공 시 재시도 카운터 리셋
        return result;
      } catch (error) {
        this.logError(error, { attempt, fnId });

        if (attempt === maxRetries) {
          if (fallback) {
            console.warn('모든 재시도 실패, 폴백 사용:', fnId);
            return fallback();
          }
          throw error;
        }

        if (onError) {
          onError(error, attempt);
        }

        // 지수 백오프 적용
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`재시도 ${attempt + 1}/${maxRetries} - ${delay}ms 대기...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * 네트워크 에러 복구
   */
  async handleNetworkError(error, callback) {
    if (!navigator.onLine) {
      console.log('오프라인 상태 감지, 온라인 복구 대기 중...');
      
      return new Promise((resolve) => {
        const handleOnline = async () => {
          window.removeEventListener('online', handleOnline);
          console.log('온라인 복구됨, 재시도 중...');
          const result = await callback();
          resolve(result);
        };
        
        window.addEventListener('online', handleOnline);
      });
    }

    // 특정 HTTP 상태 코드에 대한 처리
    if (error.response) {
      switch (error.response.status) {
        case 401: // Unauthorized
          return this.handleAuthError();
        case 429: // Too Many Requests
          return this.handleRateLimitError(error);
        case 500: // Server Error
        case 502: // Bad Gateway
        case 503: // Service Unavailable
          return this.handleServerError(error, callback);
        default:
          throw error;
      }
    }

    throw error;
  }

  /**
   * 인증 에러 복구
   */
  async handleAuthError() {
    console.log('인증 에러 감지, 토큰 갱신 시도...');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('리프레시 토큰 없음');
      }

      const response = await fetch('/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        console.log('토큰 갱신 성공');
        return data.access;
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
  }

  /**
   * Rate Limit 에러 처리
   */
  async handleRateLimitError(error) {
    const retryAfter = error.response.headers['retry-after'] || 60;
    console.log(`Rate limit 도달, ${retryAfter}초 후 재시도`);
    
    await this.sleep(retryAfter * 1000);
    return true;
  }

  /**
   * 서버 에러 복구
   */
  async handleServerError(error, callback) {
    console.log('서버 에러 감지, 폴백 서버 시도...');
    
    // 폴백 서버 목록
    const fallbackServers = [
      'https://videoplanet.up.railway.app',
      'https://api.vlanet.net',
    ];

    for (const server of fallbackServers) {
      try {
        // 임시로 API URL 변경
        const originalUrl = process.env.NEXT_PUBLIC_API_URL;
        process.env.NEXT_PUBLIC_API_URL = server;
        
        const result = await callback();
        
        // 성공하면 원래 URL 복구
        process.env.NEXT_PUBLIC_API_URL = originalUrl;
        return result;
      } catch (err) {
        console.log(`폴백 서버 ${server} 실패`);
      }
    }

    throw error;
  }

  /**
   * 로컬 스토리지 에러 복구
   */
  safeLocalStorage = {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage 읽기 실패:', error);
        return null;
      }
    },
    
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('localStorage 쓰기 실패:', error);
        // 쿠키로 폴백
        document.cookie = `${key}=${value}; path=/; max-age=86400`;
        return false;
      }
    },
    
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('localStorage 삭제 실패:', error);
      }
    },
  };

  /**
   * 에러 로깅
   */
  logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errorLog.push(errorInfo);

    // 로그 크기 제한 (최근 100개만 유지)
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // 개발 환경에서는 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('에러 발생:', errorInfo);
    }

    // 운영 환경에서는 서버로 전송 (비동기)
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToServer(errorInfo);
    }
  }

  /**
   * 에러를 서버로 전송
   */
  async sendErrorToServer(errorInfo) {
    try {
      await fetch('/api/errors/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
      });
    } catch (error) {
      // 에러 전송 실패는 무시
      console.error('에러 로그 전송 실패:', error);
    }
  }

  /**
   * 유틸리티 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 에러 로그 가져오기
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * 에러 로그 초기화
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

// 싱글톤 인스턴스 생성
const errorRecovery = new ErrorRecoverySystem();

// 전역 에러 핸들러 등록
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorRecovery.logError(new Error(event.reason), { type: 'unhandledRejection' });
  });

  window.addEventListener('error', (event) => {
    errorRecovery.logError(event.error || new Error(event.message), { type: 'globalError' });
  });
}

export default errorRecovery;