"""
가장 기본적인 Django 설정 - Railway 테스트용
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# 기본 설정
SECRET_KEY = 'django-insecure-test-key-for-railway'
DEBUG = True
ALLOWED_HOSTS = ['*']

# 최소 앱
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
]

# 최소 미들웨어
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls_simple'

# 데이터베이스 - SQLite로 테스트
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 정적파일
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# 기본
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
USE_TZ = True