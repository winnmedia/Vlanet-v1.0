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

ROOT_URLCONF = 'config.urls_ultra_simple'

# 데이터베이스 - PostgreSQL 테스트
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///' + str(BASE_DIR / 'db.sqlite3')),
        conn_max_age=600,
    )
}

# 정적파일
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# 기본
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
USE_TZ = True