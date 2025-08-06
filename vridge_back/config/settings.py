"""
개발 환경용 Django 설정 파일
로컬 개발 시 사용
"""
import os
from .settings_base import *

# 개발 환경 설정
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# 데이터베이스 설정 (SQLite 사용 - 로컬 개발용)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 캐시 설정 (로컬 메모리 캐시)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# 이메일 설정 (콘솔 출력)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

print("✅ 로컬 개발 설정 로드됨 (settings.py)")