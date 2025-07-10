#!/usr/bin/env python3
"""Railway 배포 디버깅 스크립트"""
import os
import sys
import importlib.util

print("=== Railway Debug Script ===")
print(f"Python Version: {sys.version}")
print(f"Python Path: {sys.path}")
print(f"Current Directory: {os.getcwd()}")
print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not Set')}")

# 필수 환경변수 체크
required_env_vars = ['SECRET_KEY', 'DATABASE_URL', 'DJANGO_SETTINGS_MODULE']
print("\n=== Environment Variables ===")
for var in required_env_vars:
    value = os.environ.get(var)
    if value:
        print(f"{var}: {'*' * 10} (Set)")
    else:
        print(f"{var}: Not Set ⚠️")

# Django 설정 파일 존재 확인
print("\n=== Settings Files ===")
settings_files = [
    'config/settings_base.py',
    'config/settings.py',
    'config/settings/railway.py',
    'config/wsgi.py'
]

for file in settings_files:
    exists = os.path.exists(file)
    print(f"{file}: {'✓' if exists else '✗'}")

# 모듈 import 테스트
print("\n=== Module Import Test ===")
try:
    import django
    print(f"Django Version: {django.__version__}")
except ImportError as e:
    print(f"Django Import Error: {e}")

try:
    import config
    print("config module: ✓")
except ImportError as e:
    print(f"config module: ✗ - {e}")

try:
    import config.wsgi
    print("config.wsgi module: ✓")
except ImportError as e:
    print(f"config.wsgi module: ✗ - {e}")

# WSGI 애플리케이션 로드 테스트
print("\n=== WSGI Application Test ===")
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
    from config.wsgi import application
    print("WSGI application loaded successfully ✓")
except Exception as e:
    print(f"WSGI application failed: {e}")
    import traceback
    traceback.print_exc()

# Gunicorn 테스트
print("\n=== Gunicorn Test ===")
try:
    import gunicorn
    print(f"Gunicorn Version: {gunicorn.__version__}")
except ImportError as e:
    print(f"Gunicorn Import Error: {e}")