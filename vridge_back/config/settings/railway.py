# Railway 배포용 Django 설정
# Version: 2025-01-10 - Force migration for is_public column
import os
import dj_database_url
from ..settings_base import *
from ..production_security import apply_production_security

# Railway 환경 확인
IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None

# 보안 설정 재정의
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

# 허용된 호스트 재정의
ALLOWED_HOSTS = [
    '.railway.app',
    'vlanet.net', 
    'www.vlanet.net',
    'localhost',
    '127.0.0.1',
    'videoplanet.up.railway.app',
    'testserver',  # Django 테스트 클라이언트용
    '*'  # 헬스체크 디버깅용 (운영환경에서는 제거 권장)
]

# 데이터베이스 (PostgreSQL)
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    # 개발 환경을 위한 기본 설정
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db_railway.sqlite3',
        }
    }

# 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# frontend_build가 있을 때만 추가
if os.path.exists(BASE_DIR / 'frontend_build/static'):
    STATICFILES_DIRS = [
        BASE_DIR / 'frontend_build/static',
    ]
else:
    STATICFILES_DIRS = []

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_ROOT = BASE_DIR / 'frontend_build'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = DEBUG

# 미디어 파일 설정  
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', BASE_DIR / 'media')

# 미디어 디렉토리 확인 및 생성
if not os.path.exists(MEDIA_ROOT):
    os.makedirs(MEDIA_ROOT, exist_ok=True)

# CORS 설정
CORS_ALLOWED_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS_ENV = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV if origin.strip()]

CORS_ALLOWED_ORIGINS_DEFAULT = [
    "https://vlanet.net",
    "https://www.vlanet.net",
    "http://vlanet.net",
    "http://www.vlanet.net",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vridge-front-production.up.railway.app",
    "https://videoplanetready.vercel.app",
    "https://vlanet-v1-0.vercel.app",
]

# 환경변수와 기본값 병합
CORS_ALLOWED_ORIGINS = list(set(CORS_ALLOWED_ORIGINS_DEFAULT + CORS_ALLOWED_ORIGINS_ENV))

# CORS 추가 설정
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# CSRF 신뢰할 수 있는 도메인
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
]

# 이메일 설정 (SendGrid 또는 Gmail)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

if os.environ.get('SENDGRID_API_KEY'):
    EMAIL_HOST = 'smtp.sendgrid.net'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = 'apikey'
    EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY')
else:
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', os.environ.get('GOOGLE_ID'))
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', os.environ.get('GOOGLE_APP_PASSWORD'))

# 공통 설정
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VideoPlanet <vridgeofficial@gmail.com>')
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# 캐시 설정
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'django_cache_table',
        }
    }

# 로깅 - 더 자세한 에러 정보를 위한 강화된 설정
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} [{name}] {process:d} {thread:d} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        # 앱별 로거
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'projects': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'feedbacks': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'video_planning': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'video_analysis': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'admin_dashboard': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
}

# 디버깅을 위한 추가 설정
# Railway 환경에서 에러 디버깅을 위해 임시로 설정
if IS_RAILWAY and os.environ.get('ENABLE_DEBUG_TOOLBAR', 'False').lower() == 'true':
    DEBUG = True  # 임시로 DEBUG 활성화
    
# 500 에러 시 더 자세한 정보 제공을 위한 설정
ADMINS = [
    ('Admin', os.environ.get('ADMIN_EMAIL', 'vridgeofficial@gmail.com')),
]

# 에러 리포팅 설정
if not DEBUG:
    # 프로덕션에서 Sentry 사용 (선택사항)
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    if SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=True
        )

# 보안 헤더
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# 추가 디버깅 정보를 위한 설정
if DEBUG:
    # DEBUG가 True일 때 더 자세한 에러 페이지 표시
    DEBUG_PROPAGATE_EXCEPTIONS = True
    
    # 템플릿 디버깅 활성화
    for template_engine in TEMPLATES:
        template_engine['OPTIONS']['debug'] = True

# Railway 환경에서 디버깅을 위한 로깅 미들웨어 추가
if IS_RAILWAY or DEBUG:
    # MIDDLEWARE 리스트에 로깅 미들웨어 추가
    MIDDLEWARE.insert(0, 'config.logging_middleware.DetailedLoggingMiddleware')

# 프로덕션 보안 설정 적용
if not DEBUG:
    locals().update(apply_production_security(locals()))