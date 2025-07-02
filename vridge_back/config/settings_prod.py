"""
Django Production Settings for VideoPlanet
"""
import os
import dj_database_url
from .settings_base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'YOUR-PRODUCTION-SECRET-KEY-HERE')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [host.strip() for host in os.environ.get('ALLOWED_HOSTS', '*').split(',') if host.strip()]

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'videoplanet'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if origin.strip()]
if not CORS_ALLOWED_ORIGINS:
    # 환경 변수가 설정되지 않은 경우 기본값 사용
    CORS_ALLOWED_ORIGINS = [
        'https://vridge-front-production.up.railway.app',
        'https://vlanet.net',
        'https://www.vlanet.net',
        'https://vlanet-v1-0.vercel.app',
        'http://localhost:3000',
    ]

# CORS 추가 설정
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-idempotency-key',
]
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Security settings
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() == 'true'  # 임시로 비활성화
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'  # CORS 요청 허용
SESSION_COOKIE_SAMESITE = 'None'  # CORS 요청 허용
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_TRUSTED_ORIGINS = [
    'https://vridge-front-production.up.railway.app',
    'https://vlanet.net',
    'https://www.vlanet.net',
    'https://vlanet-v1-0.vercel.app',
]

# Whitenoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'error.log'),
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', os.environ.get('GOOGLE_ID', ''))
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', os.environ.get('GOOGLE_APP_PASSWORD', ''))
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VideoPlanet <noreply@vlanet.net>')

# Email settings (for production error notifications)
ADMINS = [('Admin', os.environ.get('ADMIN_EMAIL', 'admin@example.com'))]
SERVER_EMAIL = os.environ.get('SERVER_EMAIL', 'noreply@example.com')

# Cache settings (optional)
if os.environ.get('REDIS_URL'):
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL'),
        }
    }