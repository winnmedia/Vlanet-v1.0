#!/usr/bin/env python3
"""
Railway 환경변수 및 Django 시작 문제 디버깅 스크립트
"""
import os
import sys
import django
from pathlib import Path

print("=" * 70)
print("🔍 Railway Django 시작 문제 디버깅")
print("=" * 70)

# 1. Python 경로 확인
print("\n1️⃣ Python 환경 정보:")
print(f"Python 버전: {sys.version}")
print(f"Python 실행 파일: {sys.executable}")
print(f"현재 디렉토리: {os.getcwd()}")

# 2. 중요 환경변수 확인
print("\n2️⃣ 환경변수 상태:")
env_vars = {
    'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE', 'NOT SET'),
    'SECRET_KEY': '설정됨' if os.environ.get('SECRET_KEY') else 'NOT SET',
    'DATABASE_URL': '설정됨' if os.environ.get('DATABASE_URL') else 'NOT SET',
    'RAILWAY_DATABASE_URL': '설정됨' if os.environ.get('RAILWAY_DATABASE_URL') else 'NOT SET',
    'RAILWAY_ENVIRONMENT': os.environ.get('RAILWAY_ENVIRONMENT', 'NOT SET'),
    'PORT': os.environ.get('PORT', 'NOT SET'),
    'DEBUG': os.environ.get('DEBUG', 'NOT SET')
}

for key, value in env_vars.items():
    status = "✅" if value != 'NOT SET' else "❌"
    print(f"{status} {key}: {value}")

# 3. Django 설정 파일 확인
print("\n3️⃣ Django 설정 파일 존재 여부:")
settings_files = [
    'config/settings_railway.py',
    'config/settings_base.py',
    'config/settings.py',
    'config/__init__.py'
]

for file in settings_files:
    exists = "✅" if Path(file).exists() else "❌"
    print(f"{exists} {file}")

# 4. Django 설정 테스트
print("\n4️⃣ Django 설정 테스트:")

# 환경변수 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')

try:
    import config.settings_railway as settings
    print("✅ settings_railway 모듈 임포트 성공")
    
    # 주요 설정 확인
    print(f"   - DEBUG: {getattr(settings, 'DEBUG', 'NOT SET')}")
    print(f"   - ALLOWED_HOSTS: {getattr(settings, 'ALLOWED_HOSTS', [])[:3]}...")
    print(f"   - INSTALLED_APPS 개수: {len(getattr(settings, 'INSTALLED_APPS', []))}")
    
except Exception as e:
    print(f"❌ settings_railway 임포트 실패: {e}")

# 5. Django 초기화 테스트
print("\n5️⃣ Django 초기화 테스트:")
try:
    django.setup()
    print("✅ Django 초기화 성공")
    
    # 앱 레지스트리 확인
    from django.apps import apps
    print(f"   - 등록된 앱 개수: {len(apps.get_app_configs())}")
    
    # 데이터베이스 연결 테스트
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("✅ 데이터베이스 연결 성공")
        
except Exception as e:
    print(f"❌ Django 초기화 실패: {type(e).__name__}: {e}")
    import traceback
    print("\n상세 오류:")
    traceback.print_exc()

# 6. 제안사항
print("\n6️⃣ 문제 해결 제안:")
if not os.environ.get('DATABASE_URL') and not os.environ.get('RAILWAY_DATABASE_URL'):
    print("⚠️ DATABASE_URL이 설정되지 않았습니다. Railway PostgreSQL 서비스를 추가하고 연결하세요.")
    
if not os.environ.get('SECRET_KEY'):
    print("⚠️ SECRET_KEY가 설정되지 않았습니다. Railway 환경변수에 추가하세요.")
    print("   예: SECRET_KEY=django-insecure-your-random-secret-key-here")

if os.environ.get('DJANGO_SETTINGS_MODULE') != 'config.settings_railway':
    print("⚠️ DJANGO_SETTINGS_MODULE이 올바르지 않습니다.")
    print("   Railway 환경변수에 다음을 추가하세요:")
    print("   DJANGO_SETTINGS_MODULE=config.settings_railway")

print("\n" + "=" * 70)
print("디버깅 완료")
print("=" * 70)