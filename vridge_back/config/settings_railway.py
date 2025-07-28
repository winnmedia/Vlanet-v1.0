"""
Railway 배포용 최적화된 설정
"""
import os
import sys
import dj_database_url
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Add the project root to Python path
sys.path.insert(0, str(BASE_DIR))

# Railway 환경 확인
IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None

# 보안 설정
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'  # 디버깅을 위해 임시로 True
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-F7Pkb5YWgLtMfrFpl6XA9N8P47OyYfjHdwpzzmkLfCVq-e5-te0OOfqdCH4KRm6-474')

# 기본 Django 설정
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# 사용자 정의 User 모델
AUTH_USER_MODEL = 'users.User'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 앱 목록
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

PROJECT_APPS = [
    'users',
    'projects',
    'feedbacks',
    'onlines',
    'video_planning',
    'video_analysis',
    'admin_dashboard',
]

THIRD_PARTY_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
]

INSTALLED_APPS = DJANGO_APPS + PROJECT_APPS + THIRD_PARTY_APPS

# 미들웨어
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# 템플릿
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# 비밀번호 검증
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework 설정
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# JWT 설정
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=28),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# 허용된 호스트 - Railway 도메인 추가
ALLOWED_HOSTS = [
    '.railway.app',
    'vlanet.net',
    'www.vlanet.net',
    'localhost',
    '127.0.0.1',
    'videoplanet.up.railway.app'
]

# 데이터베이스 설정
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
    pass  # Using PostgreSQL database
else:
    import logging
    logging.warning("No database URL found, using SQLite")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db_railway.sqlite3',
        }
    }

# Redis 캐시 설정
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
                }
            }
        }
        pass  # Redis cache configured
    except ImportError:
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
                'LOCATION': 'django_cache_table',
            }
        }
        pass  # Using database cache (django_redis not installed)
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'django_cache_table',
        }
    }
    pass  # Using database cache (no Redis URL)

# 정적 파일 설정 (WhiteNoise)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# WhiteNoise는 이미 미들웨어에 포함되어 있음

# 미디어 파일 설정
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', BASE_DIR / 'media')

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://vridge-front-production.up.railway.app',
    'https://videoplanetready.vercel.app',
    'https://vlanet-v1-0.vercel.app',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET', 
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF 신뢰할 수 있는 도메인
CSRF_TRUSTED_ORIGINS = [
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://*.railway.app',
]

# 이메일 설정
if os.environ.get('SENDGRID_API_KEY'):
    EMAIL_HOST = 'smtp.sendgrid.net'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = 'apikey'
    EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY')
    pass  # Email configured with SendGrid

# 로깅 설정
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
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
    },
}

# Railway settings loaded