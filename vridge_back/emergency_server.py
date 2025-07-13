#!/usr/bin/env python3
"""
응급 서버 - Django 시작 실패 시 최소한의 헬스체크 제공
"""
import os
import json
from wsgiref.simple_server import make_server

def cors_headers():
    """CORS 헤더 반환"""
    return [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'),
        ('Access-Control-Allow-Credentials', 'true'),
    ]

def application(environ, start_response):
    """간단한 WSGI 애플리케이션"""
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # CORS preflight 처리
    if method == 'OPTIONS':
        start_response('200 OK', [
            ('Content-Type', 'application/json'),
        ] + cors_headers())
        return [b'{}']
    
    # 헬스체크 엔드포인트들
    if path in ['/health/', '/api/health/', '/']:
        response_data = {
            "status": "emergency_mode",
            "message": "Django 앱이 시작되지 않아 응급 서버로 대체",
            "timestamp": os.environ.get('RAILWAY_DEPLOYMENT_ID', 'unknown'),
            "endpoints": {
                "health": "/health/",
                "api_health": "/api/health/",
                "debug": "/debug/"
            }
        }
        
        response_body = json.dumps(response_data, ensure_ascii=False, indent=2).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers())
        return [response_body]
    
    # 디버그 정보
    elif path == '/debug/':
        debug_info = {
            "environment_variables": {
                "DJANGO_SETTINGS_MODULE": os.environ.get('DJANGO_SETTINGS_MODULE'),
                "DATABASE_URL": os.environ.get('DATABASE_URL', '')[:50] + '...' if os.environ.get('DATABASE_URL') else None,
                "SECRET_KEY": os.environ.get('SECRET_KEY', '')[:10] + '...' if os.environ.get('SECRET_KEY') else None,
                "RAILWAY_ENVIRONMENT": os.environ.get('RAILWAY_ENVIRONMENT'),
                "PORT": os.environ.get('PORT'),
            },
            "request_info": {
                "method": method,
                "path": path,
                "remote_addr": environ.get('REMOTE_ADDR'),
                "user_agent": environ.get('HTTP_USER_AGENT'),
            }
        }
        
        response_body = json.dumps(debug_info, ensure_ascii=False, indent=2).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers())
        return [response_body]
    
    # 404 - Not Found
    else:
        error_response = {
            "error": "Not Found",
            "message": f"Path '{path}' not found in emergency server",
            "available_paths": ["/health/", "/api/health/", "/debug/"]
        }
        
        response_body = json.dumps(error_response, ensure_ascii=False, indent=2).encode('utf-8')
        start_response('404 Not Found', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers())
        return [response_body]

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚨 응급 서버 시작 - 포트 {port}")
    print(f"헬스체크: http://localhost:{port}/health/")
    print(f"디버그: http://localhost:{port}/debug/")
    
    with make_server('', port, application) as httpd:
        httpd.serve_forever()