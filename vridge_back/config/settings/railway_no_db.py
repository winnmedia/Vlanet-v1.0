"""Railway 배포용 최소 설정 - DB 없이 실행"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# 기본 설정
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-temporary-key-for-railway')
DEBUG = True
ALLOWED_HOSTS = ['*']

# 최소 앱만 설치
INSTALLED_APPS = [
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls_simple'

# 템플릿 설정 최소화
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# 데이터베이스 설정 제거 (메모리 DB 사용)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# 정적 파일
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# 기본 설정
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

print("Running with minimal settings (no database dependencies)")