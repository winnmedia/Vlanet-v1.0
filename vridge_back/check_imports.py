#!/usr/bin/env python3
"""
모든 Django 앱의 import 문제를 확인하는 스크립트
"""
import os
import sys

# Django 설정
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")

print("=== Django Import 체크 ===\n")

# 필수 패키지 확인
packages = [
    'django',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'whitenoise',
    'dj_database_url',
    'gunicorn',
]

for package in packages:
    try:
        __import__(package)
        print(f"✓ {package}")
    except ImportError as e:
        print(f"✗ {package}: {e}")

print("\n=== Django 앱 import 체크 ===\n")

# Django 설정 로드
try:
    import django
    django.setup()
    print("✓ Django 설정 로드 성공")
except Exception as e:
    print(f"✗ Django 설정 로드 실패: {e}")
    sys.exit(1)

# 앱 import 확인
from django.conf import settings

for app in settings.INSTALLED_APPS:
    try:
        __import__(app)
        print(f"✓ {app}")
    except ImportError as e:
        print(f"✗ {app}: {e}")

print("\n=== URL 설정 체크 ===\n")

# URL 패턴 로드
try:
    from django.urls import include, path
    from config.urls import urlpatterns
    print(f"✓ URL 패턴 로드 성공 ({len(urlpatterns)}개)")
except Exception as e:
    print(f"✗ URL 패턴 로드 실패: {e}")

print("\n모든 체크 완료!")