// VideoPlanet 캐싱 설정 중앙 관리
export const CACHE_CONFIG = {
  // 캐시 버전 (캐시 무효화를 위해 사용)
  VERSION: '1.1.0',
  
  // 전역 캐시 설정
  GLOBAL: {
    // 기본 TTL (밀리초)
    DEFAULT_TTL: 300000, // 5분
    
    // 최대 캐시 크기
    MAX_CACHE_SIZE: {
      API: 100,      // API 응답 100개
      STATIC: 200,   // 정적 자산 200개  
      DYNAMIC: 50,   // 동적 콘텐츠 50개
    },
    
    // 캐시 정리 간격
    CLEANUP_INTERVAL: 10 * 60 * 1000, // 10분
    
    // 오프라인 모드 설정
    OFFLINE: {
      ENABLED: true,
      FALLBACK_PAGE: '/offline.html',
      RETRY_INTERVALS: [1000, 3000, 5000, 10000] // 재시도 간격
    }
  },

  // API별 세부 캐시 설정
  API_STRATEGIES: {
    // 프로젝트 관련 API
    '/api/projects/project_list/': {
      strategy: 'stale-while-revalidate',
      ttl: 300000, // 5분
      priority: 'high',
      invalidateOn: ['project-created', 'project-deleted'],
      offlineSupport: true,
      description: '프로젝트 목록 - 자주 변경되지 않으므로 긴 캐시'
    },
    
    '/api/projects/detail/': {
      strategy: 'stale-while-revalidate', 
      ttl: 180000, // 3분
      priority: 'high',
      invalidateOn: ['project-updated'],
      offlineSupport: true,
      description: '프로젝트 상세 - 편집 중 변경 가능성 있음'
    },
    
    '/api/projects/create/': {
      strategy: 'network-only',
      ttl: 0,
      priority: 'critical',
      invalidateOn: [],
      offlineSupport: false,
      description: '프로젝트 생성 - 실시간 처리 필요'
    },

    // 피드백 관련 API  
    '/api/feedbacks/': {
      strategy: 'network-first',
      ttl: 60000, // 1분
      priority: 'high', 
      invalidateOn: ['feedback-added', 'feedback-updated'],
      offlineSupport: true,
      description: '피드백 목록 - 실시간성 중요하지만 오프라인 지원'
    },
    
    '/api/feedbacks/messages/': {
      strategy: 'network-first',
      ttl: 30000, // 30초
      priority: 'critical',
      invalidateOn: ['message-added'],
      offlineSupport: false,
      description: '피드백 메시지 - 실시간 소통'
    },

    // 사용자 관련 API
    '/api/user/profile/': {
      strategy: 'stale-while-revalidate',
      ttl: 600000, // 10분
      priority: 'medium',
      invalidateOn: ['profile-updated'],
      offlineSupport: true,
      description: '사용자 프로필 - 자주 변경되지 않음'
    },
    
    '/api/auth/': {
      strategy: 'network-only', 
      ttl: 0,
      priority: 'critical',
      invalidateOn: [],
      offlineSupport: false,
      description: '인증 관련 - 보안상 캐시하지 않음'
    },

    // 영상 기획 관련 API
    '/api/video_planning/': {
      strategy: 'stale-while-revalidate',
      ttl: 300000, // 5분
      priority: 'high',
      invalidateOn: ['planning-updated'],
      offlineSupport: true,
      description: '영상 기획 - 작업 중 임시 저장 지원'
    },

    // 파일 업로드 관련
    '/api/feedback/upload/': {
      strategy: 'network-only',
      ttl: 0,
      priority: 'critical', 
      invalidateOn: [],
      offlineSupport: false,
      description: '파일 업로드 - 실시간 처리만 가능'
    }
  },

  // 정적 자산 캐싱 설정
  STATIC_ASSETS: {
    // 이미지 파일
    IMAGES: {
      patterns: [/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/],
      strategy: 'cache-first',
      ttl: 86400000, // 24시간
      priority: 'low',
      compression: true
    },
    
    // 폰트 파일
    FONTS: {
      patterns: [/\.(woff2|woff|ttf|eot)$/],
      strategy: 'cache-first',
      ttl: 604800000, // 7일
      priority: 'medium',
      preload: true
    },
    
    // Next.js 정적 자산
    NEXTJS_STATIC: {
      patterns: [/\/_next\/static\//],
      strategy: 'cache-first',
      ttl: 86400000, // 24시간
      priority: 'high',
      immutable: true
    }
  },

  // 브라우저별 캐시 설정
  BROWSER_CACHE: {
    // HTTP 캐시 헤더 설정
    HEADERS: {
      'Cache-Control': {
        STATIC: 'public, max-age=31536000, immutable',     // 1년
        API: 'private, max-age=300, must-revalidate',      // 5분
        HTML: 'private, max-age=0, must-revalidate',       // 캐시 없음
        DYNAMIC: 'private, max-age=3600, must-revalidate'  // 1시간
      },
      
      'ETag': {
        ENABLED: true,
        STRONG: true // Strong ETag 사용
      }
    },
    
    // 브라우저 스토리지 활용
    STORAGE: {
      localStorage: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        KEYS: {
          USER_PREFERENCES: 'vp_user_prefs',
          RECENT_PROJECTS: 'vp_recent_projects',
          DRAFT_DATA: 'vp_draft_data'
        }
      },
      
      sessionStorage: {
        KEYS: {
          CURRENT_SESSION: 'vp_session',
          TEMP_DATA: 'vp_temp'
        }
      },
      
      indexedDB: {
        NAME: 'VideoplanetDB',
        VERSION: 1,
        STORES: {
          CACHE: 'cache_store',
          OFFLINE_QUEUE: 'offline_queue',
          LARGE_DATA: 'large_data_store'
        }
      }
    }
  },

  // 성능 최적화 설정
  PERFORMANCE: {
    // 예측적 캐싱 (사용자 행동 패턴 기반)
    PREDICTIVE_CACHING: {
      ENABLED: true,
      PREFETCH_ROUTES: [
        '/project/create',
        '/feedbackall', 
        '/video_planning'
      ],
      USER_BEHAVIOR_TRACKING: true
    },
    
    // 압축 설정
    COMPRESSION: {
      GZIP: true,
      BROTLI: true,
      MIN_SIZE: 1024 // 1KB 이상만 압축
    },
    
    // 지연 로딩
    LAZY_LOADING: {
      IMAGES: true,
      ROUTES: true,
      COMPONENTS: true
    },
    
    // 리소스 힌트
    RESOURCE_HINTS: {
      DNS_PREFETCH: ['videoplanet.up.railway.app'],
      PRECONNECT: ['https://videoplanet.up.railway.app'],
      PRELOAD: ['essential.js', 'critical.css']
    }
  },

  // 개발/운영 환경별 설정
  ENVIRONMENT: {
    DEVELOPMENT: {
      CACHE_DISABLED: false, // 개발 시에도 캐싱 테스트
      DEBUG_LOGGING: true,
      CACHE_DURATION_MULTIPLIER: 0.1 // 개발 시 짧은 캐시
    },
    
    PRODUCTION: {
      CACHE_DISABLED: false,
      DEBUG_LOGGING: false,
      CACHE_DURATION_MULTIPLIER: 1.0,
      ANALYTICS: {
        CACHE_HIT_TRACKING: true,
        PERFORMANCE_METRICS: true
      }
    }
  },

  // 캐시 무효화 이벤트 정의
  INVALIDATION_EVENTS: {
    'project-created': ['/api/projects/project_list/'],
    'project-updated': ['/api/projects/detail/', '/api/projects/project_list/'],
    'project-deleted': ['/api/projects/project_list/'],
    'feedback-added': ['/api/feedbacks/', '/api/projects/detail/'],
    'feedback-updated': ['/api/feedbacks/'],
    'message-added': ['/api/feedbacks/messages/', '/api/feedbacks/'],
    'profile-updated': ['/api/user/profile/'],
    'planning-updated': ['/api/video_planning/']
  },

  // 에러 처리 및 폴백 설정
  ERROR_HANDLING: {
    NETWORK_ERROR: {
      RETRY_COUNT: 3,
      RETRY_DELAY: 1000,
      EXPONENTIAL_BACKOFF: true
    },
    
    CACHE_ERROR: {
      FALLBACK_TO_NETWORK: true,
      LOG_ERRORS: true
    },
    
    QUOTA_EXCEEDED: {
      AUTO_CLEANUP: true,
      CLEANUP_PERCENTAGE: 0.3 // 30% 정리
    }
  }
};

// 환경별 설정 병합
export function getEnvironmentConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  const envConfig = isDev ? CACHE_CONFIG.ENVIRONMENT.DEVELOPMENT : CACHE_CONFIG.ENVIRONMENT.PRODUCTION;
  
  return {
    ...CACHE_CONFIG,
    ...envConfig,
    IS_DEVELOPMENT: isDev
  };
}

// 특정 URL에 대한 캐시 설정 조회
export function getCacheConfigForUrl(url) {
  const pathname = new URL(url, 'https://example.com').pathname;
  
  // API 설정 우선 확인
  for (const [pattern, config] of Object.entries(CACHE_CONFIG.API_STRATEGIES)) {
    if (pathname.includes(pattern.replace(/\/$/, ''))) {
      return {
        ...config,
        type: 'api',
        pattern
      };
    }
  }
  
  // 정적 자산 설정 확인
  for (const [type, config] of Object.entries(CACHE_CONFIG.STATIC_ASSETS)) {
    if (config.patterns.some(pattern => pattern.test(url))) {
      return {
        ...config,
        type: 'static',
        assetType: type
      };
    }
  }
  
  // 기본 설정 반환
  return {
    strategy: 'stale-while-revalidate',
    ttl: CACHE_CONFIG.GLOBAL.DEFAULT_TTL,
    priority: 'medium',
    type: 'default'
  };
}

// 캐시 무효화 이벤트 트리거
export function invalidateCacheByEvent(eventName) {
  const urlsToInvalidate = CACHE_CONFIG.INVALIDATION_EVENTS[eventName] || [];
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    urlsToInvalidate.forEach(pattern => {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_INVALIDATE',
        pattern
      });
    });
  }
  
  return urlsToInvalidate;
}

export default CACHE_CONFIG;