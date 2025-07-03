"""
Railway 전체 기능 설정 - Progressive 설정에서 모든 기능 활성화
"""
from .settings_progressive import *
import os

print(f"🎯 Loading FULL settings on top of PROGRESSIVE...")

# ===== STEP 15: 추가 미들웨어 =====
# 성능 및 미디어 미들웨어 추가
MIDDLEWARE.extend([
    'config.middleware.PerformanceMiddleware',
    'feedbacks.middleware.MediaHeadersMiddleware',
])

# ===== STEP 16: Redis 캐시 (사용 가능한 경우) =====
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    try:
        import django_redis
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': REDIS_URL,
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'CONNECTION_POOL_KWARGS': {
                        'max_connections': 20,
                        'retry_on_timeout': True,
                    },
                    'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                    'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
                },
                'KEY_PREFIX': 'vridge',
                'TIMEOUT': 300,
            }
        }
        
        # Redis 세션 백엔드 사용
        SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
        SESSION_CACHE_ALIAS = 'default'
        
        print("✅ Redis cache configured")
    except ImportError:
        print("⚠️ django_redis not available, using database cache")

# ===== STEP 17: 추가 CORS 도메인 =====
CORS_ALLOWED_ORIGINS.extend([
    'https://vridge-front-production.up.railway.app',
    'https://videoplanetready.vercel.app',
    'https://vlanet-v1-0.vercel.app',
])

# ===== STEP 18: 파일 업로드 크기 증가 =====
FILE_UPLOAD_MAX_MEMORY_SIZE = 600 * 1024 * 1024  # 600MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 600 * 1024 * 1024  # 600MB

# ===== STEP 19: 로깅 설정 =====
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if DEBUG else 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # SQL 쿼리 로그 비활성화
            'propagate': False,
        },
    },
}

# ===== STEP 20: 소셜 로그인 설정 =====
NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID', '')
NAVER_CLIENT_SECRET = os.environ.get('NAVER_CLIENT_SECRET', '')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
KAKAO_API_KEY = os.environ.get('KAKAO_API_KEY', '')

# Celery 설정 (Redis가 있는 경우)
if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_TIMEZONE = TIME_ZONE
    print("✅ Celery configured with Redis")

# 추가 보안 헤더 (프로덕션)
if not DEBUG:
    SECURE_SSL_REDIRECT = False  # Railway가 SSL을 처리
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# 환경 정보 출력
print(f"🚀 FULL Railway settings loaded")
print(f"📍 Environment: {'Production' if not DEBUG else 'Development'}")
print(f"🔧 Settings level: FULL (Step 20/20)")
print(f"📊 Apps loaded: {len(INSTALLED_APPS)}")
print(f"🔌 Middleware count: {len(MIDDLEWARE)}")
print(f"💾 Cache backend: {CACHES.get('default', {}).get('BACKEND', 'Unknown')}")
print(f"📧 Email backend: {EMAIL_BACKEND}")
print(f"🔐 Social login: Naver={'✓' if NAVER_CLIENT_ID else '✗'}, Google={'✓' if GOOGLE_CLIENT_ID else '✗'}, Kakao={'✓' if KAKAO_API_KEY else '✗'}")