#!/usr/bin/env python3
"""
응급 서버 - Django 시작 실패 시 최소한의 헬스체크 제공
"""
import os
import json
from wsgiref.simple_server import make_server

def cors_headers(environ=None):
    """CORS 헤더 반환"""
    # 허용된 origin 목록
    allowed_origins = [
        'https://vlanet.net',
        'https://www.vlanet.net',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
    
    # Request에서 Origin 헤더 가져오기
    origin = None
    if environ:
        origin = environ.get('HTTP_ORIGIN', '')
    
    # Origin이 허용된 목록에 있으면 해당 origin 반환, 아니면 첫 번째 허용된 origin 반환
    allowed_origin = origin if origin in allowed_origins else allowed_origins[0]
    
    return [
        ('Access-Control-Allow-Origin', allowed_origin),
        ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRFToken'),
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
        ] + cors_headers(environ))
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
        ] + cors_headers(environ))
        return [response_body]
    
    # 프론트엔드 API 요청들에 대한 모형 응답
    elif path == '/api/projects/project_list/' or path == '/api/projects/':
        mock_projects = {
            "results": [],
            "message": "응급 모드: 프로젝트 데이터를 로드할 수 없습니다",
            "emergency_mode": True
        }
        response_body = json.dumps(mock_projects, ensure_ascii=False).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers(environ))
        return [response_body]
    
    elif path.startswith('/api/users/notifications'):
        mock_notifications = {
            "results": [],
            "count": 0,
            "message": "응급 모드: 알림 데이터를 로드할 수 없습니다",
            "emergency_mode": True
        }
        response_body = json.dumps(mock_notifications, ensure_ascii=False).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers(environ))
        return [response_body]
    
    elif path == '/api/projects/invitations/' or path.startswith('/api/projects/') and 'invitations' in path:
        mock_invitations = {
            "results": [],
            "message": "응급 모드: 초대 데이터를 로드할 수 없습니다",
            "emergency_mode": True
        }
        response_body = json.dumps(mock_invitations, ensure_ascii=False).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers(environ))
        return [response_body]
    
    elif path.startswith('/api/users/') and method == 'GET':
        mock_user = {
            "id": 0,
            "email": "emergency@mode.com",
            "nickname": "응급모드",
            "profile_image": None,
            "message": "응급 모드: 사용자 데이터를 로드할 수 없습니다",
            "emergency_mode": True
        }
        response_body = json.dumps(mock_user, ensure_ascii=False).encode('utf-8')
        start_response('200 OK', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers(environ))
        return [response_body]
    
    elif path.startswith('/api/'):
        # 모든 기타 API 요청에 대한 기본 응답
        mock_response = {
            "message": "응급 모드: 이 API는 현재 사용할 수 없습니다",
            "path": path,
            "method": method,
            "emergency_mode": True,
            "status": "service_unavailable"
        }
        response_body = json.dumps(mock_response, ensure_ascii=False).encode('utf-8')
        start_response('503 Service Unavailable', [
            ('Content-Type', 'application/json; charset=utf-8'),
        ] + cors_headers(environ))
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
        ] + cors_headers(environ))
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
        ] + cors_headers(environ))
        return [response_body]

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚨 응급 서버 시작 - 포트 {port}")
    print(f"헬스체크: http://localhost:{port}/health/")
    print(f"디버그: http://localhost:{port}/debug/")
    
    with make_server('', port, application) as httpd:
        httpd.serve_forever()