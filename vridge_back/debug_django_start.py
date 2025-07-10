#!/usr/bin/env python3
import os
import sys

print("=== Django Debug Start ===")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# 환경변수 확인
env_vars = ['SECRET_KEY', 'DATABASE_URL', 'DJANGO_SETTINGS_MODULE', 'RAILWAY_ENVIRONMENT', 'PORT']
for var in env_vars:
    value = os.environ.get(var)
    if var in ['SECRET_KEY', 'DATABASE_URL'] and value:
        # 민감한 정보는 일부만 표시
        print(f"{var}: {value[:20]}...")
    else:
        print(f"{var}: {value}")

# Django import 테스트
try:
    import django
    print(f"\nDjango version: {django.VERSION}")
except ImportError as e:
    print(f"\nDjango import error: {e}")
    sys.exit(1)

# 설정 모듈 테스트
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
try:
    django.setup()
    print("\nDjango setup successful!")
    
    # URL 설정 확인
    from django.urls import get_resolver
    resolver = get_resolver()
    print("\nRegistered URLs:")
    for pattern in resolver.url_patterns[:5]:  # 처음 5개만
        print(f"  - {pattern}")
        
except Exception as e:
    print(f"\nDjango setup error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# 간단한 HTTP 응답 테스트
try:
    from django.http import JsonResponse
    from config.simple_health import simple_health_check
    
    # 가짜 request 객체 생성
    class FakeRequest:
        method = 'GET'
        path = '/api/health/'
    
    response = simple_health_check(FakeRequest())
    print(f"\nHealth check response: {response.content.decode()}")
except Exception as e:
    print(f"\nHealth check test error: {e}")