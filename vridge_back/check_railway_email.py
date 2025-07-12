#!/usr/bin/env python3
"""
Railway 환경에서 이메일 설정 확인 스크립트
Railway 대시보드에서 직접 실행하거나 배포 로그에서 확인용
"""
import os
import sys

print("=== Railway Email Configuration Check ===")
print(f"RAILWAY_ENVIRONMENT: {os.environ.get('RAILWAY_ENVIRONMENT', 'Not set')}")
print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}")
print(f"EMAIL_HOST_USER: {os.environ.get('EMAIL_HOST_USER', 'Not set')}")
print(f"EMAIL_HOST_PASSWORD: {'Set' if os.environ.get('EMAIL_HOST_PASSWORD') else 'Not set'}")
print(f"GOOGLE_ID: {os.environ.get('GOOGLE_ID', 'Not set')}")
print(f"GOOGLE_APP_PASSWORD: {'Set' if os.environ.get('GOOGLE_APP_PASSWORD') else 'Not set'}")
print(f"SENDGRID_API_KEY: {'Set' if os.environ.get('SENDGRID_API_KEY') else 'Not set'}")
print(f"DEFAULT_FROM_EMAIL: {os.environ.get('DEFAULT_FROM_EMAIL', 'Not set')}")

# Django 설정을 로드해서 실제 사용되는 값 확인
try:
    if 'DJANGO_SETTINGS_MODULE' in os.environ:
        import django
        django.setup()
        from django.conf import settings
        
        print("\n=== Django Email Settings ===")
        print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:5]}..." if settings.EMAIL_HOST_USER else "Not set")
        print(f"EMAIL_HOST_PASSWORD: {'Set' if settings.EMAIL_HOST_PASSWORD else 'Not set'}")
except Exception as e:
    print(f"\nFailed to load Django settings: {e}")

print("\n=== Recommendations ===")
if not os.environ.get('EMAIL_HOST_USER') and not os.environ.get('GOOGLE_ID'):
    print("❌ No email credentials found!")
    print("Please set either:")
    print("  - EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")
    print("  - GOOGLE_ID and GOOGLE_APP_PASSWORD")
else:
    print("✅ Email credentials appear to be configured")