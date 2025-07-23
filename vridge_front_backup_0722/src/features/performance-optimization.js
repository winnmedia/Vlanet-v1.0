/**
 * 성능 최적화 구현 계획
 */

// 1. 코드 스플리팅 구현
export const routeConfig = {
  // Lazy loading for heavy components
  Feedback: () => import(/* webpackChunkName: "feedback" */ '../page/Cms/Feedback'),
  ProjectCreate: () => import(/* webpackChunkName: "project" */ '../page/Cms/ProjectCreate'),
  AdminDashboard: () => import(/* webpackChunkName: "admin" */ '../page/Admin/AdminDashboard')
};

// 2. 이미지 최적화
export const imageOptimization = {
  formats: ['webp', 'avif', 'jpg'],
  sizes: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 600, height: 400 },
    large: { width: 1200, height: 800 }
  },
  lazyLoad: true
};

// 3. API 캐싱 전략
export const cacheStrategy = {
  projects: {
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000 // 10분
  },
  feedbacks: {
    staleTime: 1 * 60 * 1000, // 1분
    cacheTime: 5 * 60 * 1000 // 5분
  },
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    cacheTime: 7 * 24 * 60 * 60 * 1000 // 7일
  }
};

// 4. WebSocket 연결 최적화
export const websocketConfig = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  compression: true
};

// 5. 렌더링 최적화
export const renderOptimization = {
  // Virtual scrolling for long lists
  virtualizeThreshold: 50,
  // Debounce search inputs
  searchDebounce: 300,
  // Throttle scroll events
  scrollThrottle: 100
};