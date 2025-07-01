#!/usr/bin/env python
import os
import sys
import django

# Railway CORS fix 설정 사용
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_cors_fix')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings

print("=== CORS 설정 확인 ===")
print(f"CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', 'Not set')}")
print(f"CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Not set')}")
print(f"CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Not set')}")
print(f"CORS_ALLOW_METHODS: {getattr(settings, 'CORS_ALLOW_METHODS', 'Not set')}")
print(f"CORS_ALLOW_HEADERS: {getattr(settings, 'CORS_ALLOW_HEADERS', 'Not set')}")
print(f"CORS_PREFLIGHT_MAX_AGE: {getattr(settings, 'CORS_PREFLIGHT_MAX_AGE', 'Not set')}")

print("\n=== CSRF 설정 확인 ===")
print(f"CSRF_TRUSTED_ORIGINS: {getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'Not set')}")

print("\n=== 미들웨어 확인 ===")
for i, middleware in enumerate(settings.MIDDLEWARE):
    print(f"{i}: {middleware}")
    
# corsheaders가 설치되어 있는지 확인
print("\n=== INSTALLED_APPS 확인 ===")
if 'corsheaders' in settings.INSTALLED_APPS:
    print("✓ corsheaders가 INSTALLED_APPS에 포함되어 있습니다.")
else:
    print("✗ corsheaders가 INSTALLED_APPS에 없습니다!")

# CorsMiddleware가 올바른 위치에 있는지 확인
cors_index = -1
session_index = -1
for i, middleware in enumerate(settings.MIDDLEWARE):
    if 'CorsMiddleware' in middleware:
        cors_index = i
    if 'SessionMiddleware' in middleware:
        session_index = i

print(f"\n=== 미들웨어 순서 확인 ===")
print(f"SessionMiddleware 위치: {session_index}")
print(f"CorsMiddleware 위치: {cors_index}")
if cors_index > session_index and cors_index > 0:
    print("✓ CorsMiddleware가 올바른 위치에 있습니다.")
else:
    print("✗ CorsMiddleware 위치가 잘못되었습니다! SessionMiddleware 다음에 와야 합니다.")