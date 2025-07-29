import * as Sentry from '@sentry/nextjs';

// Sentry 초기화
export function initMonitoring() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      beforeSend(event, hint) {
        // 민감한 정보 필터링
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.extra?.password) {
          delete event.extra.password;
        }
        return event;
      },
    });
  }
}

// 커스텀 에러 로깅
export function logError(error, context = {}) {

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        section: context.section || 'unknown',
      },
    });
  }
}

// 성능 모니터링
export function measurePerformance(name, fn) {
  const startTime = performance.now();
  const transaction = Sentry.startTransaction({ name });
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = performance.now() - startTime;
          transaction.setStatus('ok');
          transaction.finish();
          logPerformance(name, duration);
          return value;
        })
        .catch((error) => {
          transaction.setStatus('internal_error');
          transaction.finish();
          throw error;
        });
    }
    
    const duration = performance.now() - startTime;
    transaction.setStatus('ok');
    transaction.finish();
    logPerformance(name, duration);
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    transaction.finish();
    throw error;
  }
}

// 성능 로깅
function logPerformance(operation, duration) {
  ms`);
    
    Sentry.captureMessage('Slow operation detected', {
      level: 'warning',
      extra: {
        operation,
        duration,
      },
    });
  }
}

// 사용자 행동 추적
export function trackUserAction(action, data = {}) {
  // Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: 'user_interaction',
      event_label: data.label,
      value: data.value,
    });
  }
  
  // 커스텀 분석 백엔드
  if (process.env.NEXT_PUBLIC_API_URL) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        data,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      }),
    }).catch((error) => {});
  }
}

// 세션 ID 관리
function getSessionId() {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Web Vitals 모니터링
export function reportWebVitals(metric) {
  const vitals = {
    FCP: 2000,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    CLS: 0.1,   // Cumulative Layout Shift
    FID: 100,   // First Input Delay
    TTFB: 600,  // Time to First Byte
  };

  if (metric.value > vitals[metric.name]) {

    Sentry.captureMessage(`Poor Web Vital: ${metric.name}`, {
      level: 'warning',
      extra: {
        metric: metric.name,
        value: metric.value,
        threshold: vitals[metric.name],
      },
    });
  }
}