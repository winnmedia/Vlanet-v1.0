import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: false,
      networkDetailAllowUrls: [
        'https://videoplanet.up.railway.app',
        'https://vlanet.net'
      ],
      networkRequestHeaders: ['X-Request-ID'],
      networkResponseHeaders: ['X-Response-ID']
    }),
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      tracePropagationTargets: [
        'localhost',
        'vlanet.net',
        'videoplanet.up.railway.app',
        /^\//
      ]
    })
  ],
  
  beforeSend(event, hint) {
    // 민감한 정보 필터링
    if (event.request) {
      if (event.request.cookies) {
        event.request.cookies = '[REDACTED]';
      }
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
    }
    
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      if (hint.originalException) {
        console.error('Original Exception:', hint.originalException);
      }
    }
    
    return event;
  },
  
  // 에러 무시 리스트
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
    /^Failed to fetch/
  ],
  
  // 환경별 설정
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // 릴리즈 추적
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development'
});