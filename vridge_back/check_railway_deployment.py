#!/usr/bin/env python
"""
Railway 배포 진단 스크립트
이 스크립트는 Railway 환경에서 설정이 올바르게 로드되는지 확인합니다.
"""
import os
import sys
import django

# Django 설정 로드
os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings'))
django.setup()

from django.conf import settings
from django.core.mail import send_mail
from django.db import connection

print("=" * 80)
print("VideoPlanet Railway 배포 진단 리포트")
print("=" * 80)

# 1. Django 설정 모듈 확인
print("\n1. Django 설정 모듈:")
print(f"   - DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}")
print(f"   - 실제 로드된 설정: {settings.SETTINGS_MODULE}")

# 2. 이메일 설정 확인
print("\n2. 이메일 설정:")
print(f"   - EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"   - EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"   - EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"   - EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"   - EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"   - EMAIL_HOST_PASSWORD: {'설정됨' if settings.EMAIL_HOST_PASSWORD else '설정되지 않음'}")
if settings.EMAIL_HOST_PASSWORD:
    print(f"   - API Key 미리보기: {settings.EMAIL_HOST_PASSWORD[:10]}...")
print(f"   - DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# SendGrid 환경 변수 확인
sendgrid_key = os.environ.get('SENDGRID_API_KEY', '')
print(f"\n   SendGrid 환경변수:")
print(f"   - SENDGRID_API_KEY: {'설정됨' if sendgrid_key else '설정되지 않음'}")
if sendgrid_key:
    print(f"   - API Key 미리보기: {sendgrid_key[:10]}...")

# 3. CORS 설정 확인
print("\n3. CORS 설정:")
print(f"   - CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', 'Not set')}")
print(f"   - CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Not set')}")
cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
print(f"   - CORS_ALLOWED_ORIGINS: ({len(cors_origins)} 개)")
for origin in cors_origins[:5]:  # 처음 5개만 표시
    print(f"      - {origin}")
if len(cors_origins) > 5:
    print(f"      ... 그 외 {len(cors_origins) - 5}개")

# 4. 데이터베이스 연결 확인
print("\n4. 데이터베이스 연결:")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("   - PostgreSQL 연결: ✓ 성공")
        cursor.execute("SELECT COUNT(*) FROM django_migrations")
        migration_count = cursor.fetchone()[0]
        print(f"   - 적용된 마이그레이션: {migration_count}개")
except Exception as e:
    print(f"   - PostgreSQL 연결: ✗ 실패 ({str(e)})")

# 5. 미디어 파일 설정 확인
print("\n5. 미디어 파일 설정:")
print(f"   - MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"   - MEDIA_URL: {settings.MEDIA_URL}")
media_exists = os.path.exists(settings.MEDIA_ROOT)
print(f"   - 미디어 디렉토리 존재: {'✓' if media_exists else '✗'}")

# 6. 정적 파일 설정 확인
print("\n6. 정적 파일 설정:")
print(f"   - STATIC_ROOT: {settings.STATIC_ROOT}")
print(f"   - STATIC_URL: {settings.STATIC_URL}")
static_exists = os.path.exists(settings.STATIC_ROOT)
print(f"   - 정적 파일 디렉토리 존재: {'✓' if static_exists else '✗'}")

# 7. 보안 설정 확인
print("\n7. 보안 설정:")
print(f"   - DEBUG: {settings.DEBUG}")
print(f"   - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...")
print(f"   - SECURE_SSL_REDIRECT: {getattr(settings, 'SECURE_SSL_REDIRECT', 'Not set')}")
print(f"   - SESSION_COOKIE_SECURE: {getattr(settings, 'SESSION_COOKIE_SECURE', 'Not set')}")
print(f"   - CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', 'Not set')}")

# 8. 환경 변수 확인
print("\n8. Railway 환경 변수:")
railway_env_vars = ['RAILWAY_ENVIRONMENT', 'PORT', 'DATABASE_URL']
for var in railway_env_vars:
    value = os.environ.get(var, 'Not set')
    if var == 'DATABASE_URL' and value != 'Not set':
        print(f"   - {var}: 설정됨 (보안상 값 숨김)")
    else:
        print(f"   - {var}: {value}")

# 9. 이메일 발송 테스트 (선택적)
print("\n9. 이메일 발송 테스트:")
if '--test-email' in sys.argv:
    test_email = sys.argv[sys.argv.index('--test-email') + 1]
    try:
        send_mail(
            '[VideoPlanet] Railway 배포 테스트',
            '이 메일은 Railway 배포 환경에서 발송된 테스트 메일입니다.',
            settings.DEFAULT_FROM_EMAIL,
            [test_email],
            fail_silently=False,
        )
        print(f"   - 테스트 이메일 발송: ✓ 성공 ({test_email})")
    except Exception as e:
        print(f"   - 테스트 이메일 발송: ✗ 실패")
        print(f"     오류: {str(e)}")
else:
    print("   - 테스트하려면 --test-email [이메일주소] 옵션을 추가하세요")

print("\n" + "=" * 80)
print("진단 완료")
print("=" * 80)