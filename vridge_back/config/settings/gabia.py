"""
가비아 웹호스팅용 Django 설정
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 기본 설정 import
from .base import *

# .env 파일 로드
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ======================
# 기본 Django 설정
# ======================
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')

# 허용 호스트
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# ======================
# 데이터베이스 설정
# ======================
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.mysql'),
        'NAME': os.getenv('DB_NAME', 'videoplanet'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
    }
}

# ======================
# 정적 파일 설정
# ======================
STATIC_URL = os.getenv('STATIC_URL', '/static/')
STATIC_ROOT = os.getenv('STATIC_ROOT', os.path.join(BASE_DIR, 'staticfiles'))

MEDIA_URL = os.getenv('MEDIA_URL', '/media/')
MEDIA_ROOT = os.getenv('MEDIA_ROOT', os.path.join(BASE_DIR, 'media'))

# 정적 파일 압축
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# ======================
# 파일 업로드 설정
# ======================
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('FILE_UPLOAD_MAX_MEMORY_SIZE', '104857600'))  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('DATA_UPLOAD_MAX_MEMORY_SIZE', '104857600'))  # 100MB
FILE_UPLOAD_TEMP_DIR = os.getenv('FILE_UPLOAD_TEMP_DIR', '/tmp')
FILE_UPLOAD_PERMISSIONS = 0o644

# ======================
# Twelve Labs API 설정
# ======================
TWELVE_LABS_API_KEY = os.getenv('TWELVE_LABS_API_KEY', '')
TWELVE_LABS_INDEX_ID = os.getenv('TWELVE_LABS_INDEX_ID', '')
USE_AI_ANALYSIS = os.getenv('USE_AI_ANALYSIS', 'False').lower() == 'true'

# 사용량 제한
DAILY_ANALYSIS_LIMIT = int(os.getenv('DAILY_ANALYSIS_LIMIT', '100'))
MONTHLY_ANALYSIS_LIMIT = int(os.getenv('MONTHLY_ANALYSIS_LIMIT', '1000'))
USER_DAILY_LIMIT = int(os.getenv('USER_DAILY_LIMIT', '5'))
USER_MONTHLY_LIMIT = int(os.getenv('USER_MONTHLY_LIMIT', '50'))
PREMIUM_USER_DAILY_LIMIT = int(os.getenv('PREMIUM_USER_DAILY_LIMIT', '20'))
PREMIUM_USER_MONTHLY_LIMIT = int(os.getenv('PREMIUM_USER_MONTHLY_LIMIT', '200'))

# 파일 제한
MAX_VIDEO_SIZE_MB = int(os.getenv('MAX_VIDEO_SIZE_MB', '500'))
MAX_VIDEO_DURATION_MINUTES = int(os.getenv('MAX_VIDEO_DURATION_MINUTES', '30'))
FREE_USER_MAX_SIZE_MB = int(os.getenv('FREE_USER_MAX_SIZE_MB', '100'))
FREE_USER_MAX_DURATION_MINUTES = int(os.getenv('FREE_USER_MAX_DURATION_MINUTES', '10'))

# ======================
# 보안 설정
# ======================
SECURE_BROWSER_XSS_FILTER = os.getenv('SECURE_BROWSER_XSS_FILTER', 'True').lower() == 'true'
SECURE_CONTENT_TYPE_NOSNIFF = os.getenv('SECURE_CONTENT_TYPE_NOSNIFF', 'True').lower() == 'true'
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'SAMEORIGIN')

# HTTPS 설정 (도메인 적용 후)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True').lower() == 'true'

# ======================
# 캐시 설정
# ======================
CACHES = {
    'default': {
        'BACKEND': os.getenv('CACHE_BACKEND', 'django.core.cache.backends.locmem.LocMemCache'),
        'LOCATION': os.getenv('CACHE_LOCATION', 'videoplanet-cache'),
        'TIMEOUT': int(os.getenv('CACHE_TIMEOUT', '300')),
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# ======================
# 세션 설정
# ======================
SESSION_ENGINE = os.getenv('SESSION_ENGINE', 'django.contrib.sessions.backends.db')
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', '86400'))  # 24시간
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG

# ======================
# 이메일 설정
# ======================
if os.getenv('EMAIL_HOST'):
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
    EMAIL_HOST = os.getenv('EMAIL_HOST')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
else:
    # 이메일 설정이 없으면 콘솔로 출력
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ======================
# 로깅 설정
# ======================
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE_PATH = os.getenv('LOG_FILE_PATH', '/tmp/django.log')

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
        'file': {
            'level': LOG_LEVEL,
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_FILE_PATH,
            'maxBytes': int(os.getenv('LOG_MAX_SIZE', '10485760')),  # 10MB
            'backupCount': int(os.getenv('LOG_BACKUP_COUNT', '5')),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': LOG_LEVEL,
            'propagate': True,
        },
        'video_analysis': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'feedbacks': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ======================
# Celery 설정 (가비아 환경용)
# ======================
# Redis가 없는 환경에서는 데이터베이스 브로커 사용
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'django-db://')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'django-db')
CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_TASK_ALWAYS_EAGER', 'True').lower() == 'true'
CELERY_TASK_EAGER_PROPAGATES = True

# ======================
# CORS 설정
# ======================
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]

# ======================
# 국제화 설정
# ======================
TIME_ZONE = os.getenv('TIME_ZONE', 'Asia/Seoul')
USE_TZ = os.getenv('USE_TZ', 'True').lower() == 'true'
LANGUAGE_CODE = os.getenv('LANGUAGE_CODE', 'ko-kr')

# ======================
# 앱별 설정
# ======================
# video_analysis 앱이 INSTALLED_APPS에 있는지 확인
if 'video_analysis' not in INSTALLED_APPS:
    INSTALLED_APPS.append('video_analysis')

# Celery 관련 앱 (데이터베이스 브로커용)
if 'django_celery_results' not in INSTALLED_APPS:
    INSTALLED_APPS.extend([
        'django_celery_results',
        'django_celery_beat',
    ])

# ======================
# 성능 최적화
# ======================
# 템플릿 캐싱
if not DEBUG:
    TEMPLATES[0]['OPTIONS']['loaders'] = [
        ('django.template.loaders.cached.Loader', [
            'django.template.loaders.filesystem.Loader',
            'django.template.loaders.app_directories.Loader',
        ]),
    ]

# 데이터베이스 쿼리 최적화
if DEBUG:
    DATABASES['default']['OPTIONS']['sql_mode'] = 'TRADITIONAL'

# ======================
# 모니터링 설정
# ======================
# Sentry (에러 추적)
SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True
    )

# Google Analytics
GOOGLE_ANALYTICS_ID = os.getenv('GOOGLE_ANALYTICS_ID')

# ======================
# 소셜 로그인 설정
# ======================
# Google OAuth2
GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')

# Kakao OAuth
KAKAO_REST_API_KEY = os.getenv('KAKAO_REST_API_KEY')
KAKAO_CLIENT_SECRET = os.getenv('KAKAO_CLIENT_SECRET')

# ======================
# 개발/디버그 설정
# ======================
if DEBUG:
    # 개발 중에만 사용
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
    
    # Debug Toolbar (설치된 경우)
    if os.getenv('DEBUG_TOOLBAR_ENABLED', 'False').lower() == 'true':
        try:
            import debug_toolbar
            INSTALLED_APPS.append('debug_toolbar')
            MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        except ImportError:
            pass

# ======================
# 프로덕션 최적화
# ======================
if not DEBUG:
    # 관리자 인터페이스에서 취약점 스캐닝 방지
    ADMIN_URL = os.getenv('ADMIN_URL', 'admin/')
    
    # 보안 강화
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
    
    # 성능 향상
    CONN_MAX_AGE = 60