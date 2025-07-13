#!/usr/bin/env python3
"""
Railway용 독립 실행 서버
Django 없이 즉시 실행 가능
"""
import os
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VlanetHandler(BaseHTTPRequestHandler):
    """Vlanet API 호환 핸들러"""
    
    def log_message(self, format, *args):
        """로그 메시지 커스터마이징"""
        logger.info(f"{self.address_string()} - {format % args}")
    
    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """GET 요청 처리"""
        self.handle_request('GET')
    
    def do_POST(self):
        """POST 요청 처리"""
        self.handle_request('POST')
    
    def send_cors_headers(self):
        """CORS 헤더 설정"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def send_json_response(self, data, status_code=200):
        """JSON 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_cors_headers()
        self.end_headers()
        
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(json_data.encode('utf-8'))
    
    def handle_request(self, method):
        """요청 라우팅 및 처리"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        logger.info(f"{method} {path} - {self.address_string()}")
        
        # 헬스체크 엔드포인트
        if path in ['/', '/health/', '/api/health/']:
            self.handle_health_check()
        
        # 디버그 정보
        elif path == '/debug/':
            self.handle_debug()
        
        # 프로젝트 API
        elif path in ['/api/projects/', '/api/projects/project_list/']:
            self.handle_projects()
        
        # 알림 API
        elif path.startswith('/api/users/notifications'):
            self.handle_notifications()
        
        # 초대 API
        elif 'invitations' in path:
            self.handle_invitations()
        
        # 사용자 API
        elif path.startswith('/api/users/'):
            self.handle_users()
        
        # 기타 API
        elif path.startswith('/api/'):
            self.handle_generic_api(path, method)
        
        # 404
        else:
            self.handle_not_found()
    
    def handle_health_check(self):
        """헬스체크 응답"""
        data = {
            "status": "ok",
            "service": "vlanet-standalone",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "railway_environment": os.environ.get('RAILWAY_ENVIRONMENT', 'unknown'),
            "message": "Standalone server running successfully"
        }
        self.send_json_response(data)
    
    def handle_debug(self):
        """디버그 정보"""
        data = {
            "server_info": {
                "type": "standalone_python_server",
                "port": os.environ.get('PORT', '8000'),
                "pid": os.getpid(),
            },
            "environment_variables": {
                "RAILWAY_ENVIRONMENT": os.environ.get('RAILWAY_ENVIRONMENT'),
                "DATABASE_URL": "Present" if os.environ.get('DATABASE_URL') else "Not set",
                "SECRET_KEY": "Present" if os.environ.get('SECRET_KEY') else "Not set",
                "PORT": os.environ.get('PORT'),
            },
            "request_info": {
                "client_address": self.address_string(),
                "server_version": self.version_string(),
            },
            "django_status": "Not loaded (standalone server mode)"
        }
        self.send_json_response(data)
    
    def handle_projects(self):
        """프로젝트 목록 API"""
        data = {
            "results": [],
            "count": 0,
            "message": "standalone 모드: 프로젝트 데이터를 불러올 수 없습니다",
            "standalone_mode": True,
            "instructions": "Django 서버가 복구되면 실제 데이터를 제공합니다"
        }
        self.send_json_response(data)
    
    def handle_notifications(self):
        """알림 API"""
        data = {
            "results": [],
            "count": 0,
            "message": "standalone 모드: 알림 데이터를 불러올 수 없습니다",
            "standalone_mode": True
        }
        self.send_json_response(data)
    
    def handle_invitations(self):
        """초대 API"""
        data = {
            "results": [],
            "message": "standalone 모드: 초대 데이터를 불러올 수 없습니다",
            "standalone_mode": True
        }
        self.send_json_response(data)
    
    def handle_users(self):
        """사용자 API"""
        data = {
            "id": 0,
            "email": "standalone@mode.com",
            "nickname": "standalone모드",
            "profile_image": None,
            "message": "standalone 모드: 사용자 데이터를 불러올 수 없습니다",
            "standalone_mode": True
        }
        self.send_json_response(data)
    
    def handle_generic_api(self, path, method):
        """기타 API 요청"""
        data = {
            "message": "standalone 모드: 이 API는 현재 사용할 수 없습니다",
            "path": path,
            "method": method,
            "standalone_mode": True,
            "status": "service_unavailable"
        }
        self.send_json_response(data, 503)
    
    def handle_not_found(self):
        """404 응답"""
        data = {
            "error": "Not Found",
            "message": f"Path '{self.path}' not found in standalone server",
            "available_endpoints": [
                "/health/", "/api/health/", "/debug/",
                "/api/projects/", "/api/users/notifications/",
                "/api/projects/invitations/"
            ]
        }
        self.send_json_response(data, 404)

def run_server():
    """서버 실행"""
    port = int(os.environ.get('PORT', 8000))
    
    logger.info("=" * 50)
    logger.info("🚀 Vlanet Standalone Server Starting")
    logger.info(f"Port: {port}")
    logger.info(f"Railway Environment: {os.environ.get('RAILWAY_ENVIRONMENT', 'Not set')}")
    logger.info(f"Process ID: {os.getpid()}")
    logger.info("=" * 50)
    
    server = HTTPServer(('0.0.0.0', port), VlanetHandler)
    
    logger.info(f"✅ Server ready on http://0.0.0.0:{port}")
    logger.info("Available endpoints:")
    logger.info("  - GET /health/ (헬스체크)")
    logger.info("  - GET /api/health/ (API 헬스체크)")
    logger.info("  - GET /debug/ (디버그 정보)")
    logger.info("  - GET /api/projects/ (프로젝트 목록)")
    logger.info("  - GET /api/users/notifications/ (알림)")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        raise
    finally:
        server.server_close()
        logger.info("🔚 Server closed")

if __name__ == '__main__':
    run_server()