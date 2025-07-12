#!/usr/bin/env python
"""
Railway 배포 디버깅 스크립트
"""
import os
import sys

print("=== Railway 환경 디버깅 ===")
print(f"Python 버전: {sys.version}")
print(f"현재 디렉토리: {os.getcwd()}")
print(f"파일 수: {len(os.listdir('.'))}")
print()

# 환경변수 확인
print("=== 주요 환경변수 ===")
env_vars = [
    'DJANGO_SETTINGS_MODULE',
    'SECRET_KEY',
    'DATABASE_URL',
    'RAILWAY_ENVIRONMENT',
    'PORT',
    'REDIS_URL',
    'EMAIL_HOST_USER',
    'EMAIL_HOST_PASSWORD'
]

for var in env_vars:
    value = os.environ.get(var, 'Not set')
    if var in ['SECRET_KEY', 'DATABASE_URL', 'EMAIL_HOST_PASSWORD'] and value != 'Not set':
        # 민감한 정보는 일부만 표시
        value = value[:10] + '...' if len(value) > 10 else value
    print(f"{var}: {value}")

print()

# Django 설정 확인
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
    import django
    django.setup()
    
    from django.conf import settings
    print("=== Django 설정 ===")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...")  # 처음 3개만
    print(f"DATABASES 설정됨: {'default' in settings.DATABASES}")
    print(f"INSTALLED_APPS 수: {len(settings.INSTALLED_APPS)}")
    
    # 데이터베이스 연결 테스트
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ 데이터베이스 연결 성공")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {str(e)[:100]}")
    
    # 마이그레이션 상태
    try:
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        call_command('showmigrations', '--plan', stdout=out)
        migrations = out.getvalue()
        print(f"✅ 마이그레이션 확인 가능 (총 {migrations.count('[X]')}개 적용됨)")
    except Exception as e:
        print(f"❌ 마이그레이션 확인 실패: {str(e)[:100]}")
        
except Exception as e:
    print(f"❌ Django 설정 로드 실패: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=== 파일 시스템 확인 ===")
important_files = [
    'manage.py',
    'requirements.txt',
    'start.sh',
    'config/settings.py',
    'config/settings_base.py',
    'config/settings/railway.py',
    'config/wsgi.py'
]

for file in important_files:
    exists = os.path.exists(file)
    print(f"{file}: {'✅ 존재' if exists else '❌ 없음'}")

# 포트 바인딩 확인
print()
print("=== 서버 시작 정보 ===")
port = os.environ.get('PORT', '8000')
print(f"포트: {port}")
print(f"Gunicorn 명령: gunicorn config.wsgi:application --bind 0.0.0.0:{port}")

# Railway 특정 환경변수
print()
print("=== Railway 환경 ===")
railway_vars = [var for var in os.environ if var.startswith('RAILWAY_')]
for var in railway_vars[:5]:  # 처음 5개만
    print(f"{var}: {os.environ[var][:50]}...")

print()
print("디버깅 완료!")