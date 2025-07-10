#!/usr/bin/env python3
"""WSGI 애플리케이션 단순 테스트"""
import os
import sys

print("=== WSGI Simple Test ===")
print(f"Working Directory: {os.getcwd()}")
print(f"Python Path: {sys.path}")

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
os.environ.setdefault('SECRET_KEY', 'test-secret-key')
os.environ.setdefault('DATABASE_URL', 'postgresql://test')

try:
    from django.core.wsgi import get_wsgi_application
    print("Django WSGI import: ✓")
    
    application = get_wsgi_application()
    print("WSGI application created: ✓")
    
    # 간단한 요청 시뮬레이션
    environ = {
        'REQUEST_METHOD': 'GET',
        'PATH_INFO': '/api/health/',
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '8000',
        'wsgi.url_scheme': 'http',
    }
    
    def start_response(status, headers):
        print(f"Response Status: {status}")
        for header in headers:
            print(f"Header: {header}")
    
    response = application(environ, start_response)
    print(f"Response: {list(response)}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()