#!/usr/bin/env python3
"""최소한의 Django 서버 - 헬스체크만 처리"""
import os
import sys
from wsgiref.simple_server import make_server

# 환경변수 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
os.environ.setdefault('SECRET_KEY', 'temporary-secret-key-for-health-check')

# Django 앱 설정
def application(environ, start_response):
    path = environ.get('PATH_INFO', '/')
    
    if path in ['/api/health/', '/api/health', '/health/', '/health']:
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [b'{"status": "ok", "service": "vridge-backend", "type": "minimal"}']
    else:
        status = '404 Not Found'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b'Not Found']

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"Starting minimal Django server on port {port}...")
    
    with make_server('', port, application) as httpd:
        print(f"Server running on http://0.0.0.0:{port}")
        print(f"Health check: http://0.0.0.0:{port}/api/health/")
        httpd.serve_forever()