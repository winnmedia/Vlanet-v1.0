import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  
  // Edge Runtime 전용 설정
  integrations: [
    new Sentry.Integrations.FunctionToString()
  ],
  
  beforeSend(event) {
    // Edge 환경에서의 필터링
    if (event.request?.headers) {
      delete event.request.headers['cf-ray'];
      delete event.request.headers['cf-connecting-ip'];
    }
    return event;
  },
  
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'edge',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'edge'
});