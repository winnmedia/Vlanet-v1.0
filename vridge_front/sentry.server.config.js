import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  
  // 서버 사이드 전용 설정
  autoSessionTracking: true,
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.OnUncaughtException({
      onFatalError: async (error) => {
        console.error('Fatal error occurred:', error);
        // 중요한 에러는 Slack으로도 알림
        if (process.env.SLACK_WEBHOOK_URL) {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 Fatal Server Error: ${error.message}`,
              attachments: [{
                color: 'danger',
                fields: [
                  {
                    title: 'Environment',
                    value: process.env.NODE_ENV,
                    short: true
                  },
                  {
                    title: 'Time',
                    value: new Date().toISOString(),
                    short: true
                  }
                ]
              }]
            })
          }).catch(console.error);
        }
      }
    })
  ],
  
  beforeSend(event, hint) {
    // 서버 사이드 민감 정보 필터링
    if (event.contexts?.runtime) {
      delete event.contexts.runtime.env;
    }
    
    // 데이터베이스 쿼리 마스킹
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.category === 'db.query') {
          breadcrumb.data = { query: '[REDACTED]' };
        }
        return breadcrumb;
      });
    }
    
    return event;
  },
  
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development'
});