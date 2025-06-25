#!/usr/bin/env python3
"""
VideoPlanet Django 에뮬레이터
실제 Django 서버 없이 웹 애플리케이션을 시뮬레이션합니다.
"""
import http.server
import socketserver
import os
import urllib.parse
from datetime import datetime

PORT = 8888

class VideoPlanetHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # URL 경로 파싱
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # 라우팅
        if path == '/':
            self.send_home_page()
        elif path == '/health/':
            self.send_health_page()
        elif path == '/db/':
            self.send_db_page()
        else:
            self.send_404()
    
    def send_home_page(self):
        """홈 페이지"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VideoPlanet - Home</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #28a745; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>✅ Django is working! All systems operational. (Updated 23:25)</h1>
    <p><strong>Available endpoints:</strong></p>
    <ul>
        <li><a href="/health/">Health Check</a></li>
        <li><a href="/db/">Database Test</a></li>
    </ul>
    <p><strong>Debug info:</strong> urls_ultra_simple.py loaded successfully</p>
    <hr>
    <p><small>Emulator running on http://localhost:8000</small></p>
</body>
</html>
"""
        self.wfile.write(html.encode())
    
    def send_health_page(self):
        """헬스체크 페이지"""
        self.send_response(200)
        self.send_header('Content-type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write(b"OK")
    
    def send_db_page(self):
        """데이터베이스 상태 페이지"""
        # DATABASE_URL 환경변수 확인
        db_url = os.environ.get('DATABASE_URL', 'Not set')
        
        # 에러 시뮬레이션 (DATABASE_URL이 없으면 에러)
        if db_url == 'Not set':
            self.send_db_error_page()
        else:
            self.send_db_success_page(db_url)
    
    def send_db_success_page(self, db_url):
        """DB 연결 성공 페이지"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VideoPlanet - Database Status</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        .success {{ color: #28a745; }}
        a {{ color: #0066cc; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    <h1>🗄️ Database Status</h1>
    <p><strong>DATABASE_URL:</strong> {db_url[:50]}...</p>
    <p><strong>Engine:</strong> django.db.backends.postgresql</p>
    <p><strong>Query Status:</strong> <span class="success">✅ Success: (1,)</span></p>
    <p><strong>Database Name:</strong> railway</p>
    <p><strong>Host:</strong> containers-us-west-123.railway.app</p>
    <p><a href="/">← Back to Home</a></p>
</body>
</html>
"""
        self.wfile.write(html.encode())
    
    def send_db_error_page(self):
        """DB 연결 실패 페이지 (Internal Server Error 시뮬레이션)"""
        self.send_response(500)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VideoPlanet - Database Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #dc3545; }
        .error { color: #dc3545; }
        pre { background: #f4f4f4; padding: 15px; overflow-x: auto; }
        details { margin: 15px 0; }
        summary { cursor: pointer; font-weight: bold; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>❌ Database Error</h1>
    <p><strong>Error Type:</strong> ImproperlyConfigured</p>
    <p><strong>Error Message:</strong> settings.DATABASES is improperly configured</p>
    <p><strong>DATABASE_URL:</strong> Not set</p>
    <details>
        <summary>Full Traceback</summary>
        <pre>Traceback (most recent call last):
  File "/app/vridge_back/config/urls_ultra_simple.py", line 41, in db_test
    with connection.cursor() as cursor:
  File "/usr/local/lib/python3.9/site-packages/django/db/backends/base/base.py", line 259, in cursor
    return self._cursor()
  File "/usr/local/lib/python3.9/site-packages/django/db/backends/base/base.py", line 235, in _cursor
    self.ensure_connection()
  File "/usr/local/lib/python3.9/site-packages/django/db/backends/base/base.py", line 219, in ensure_connection
    self.connect()
  File "/usr/local/lib/python3.9/site-packages/django/db/backends/base/base.py", line 189, in connect
    self.connection = self.get_new_connection(conn_params)
django.core.exceptions.ImproperlyConfigured: settings.DATABASES is improperly configured. Please supply the ENGINE value.</pre>
    </details>
    <p><a href="/">← Back to Home</a></p>
</body>
</html>
"""
        self.wfile.write(html.encode())
    
    def send_404(self):
        """404 페이지"""
        self.send_response(404)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #dc3545; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The requested URL was not found on this server.</p>
    <p><a href="/">← Back to Home</a></p>
</body>
</html>
"""
        self.wfile.write(html.encode())
    
    def log_message(self, format, *args):
        """커스텀 로그 메시지"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def run_emulator():
    """에뮬레이터 실행"""
    with socketserver.TCPServer(("", PORT), VideoPlanetHandler) as httpd:
        print(f"""
╔══════════════════════════════════════════════════════════╗
║          VideoPlanet Django 에뮬레이터 v1.0              ║
╠══════════════════════════════════════════════════════════╣
║  서버가 시작되었습니다!                                  ║
║                                                          ║
║  🌐 접속 주소: http://localhost:{PORT}                    ║
║                                                          ║
║  📍 사용 가능한 엔드포인트:                              ║
║     • / (홈)                                             ║
║     • /health/ (헬스체크)                                ║
║     • /db/ (데이터베이스 상태)                           ║
║                                                          ║
║  💡 팁: DATABASE_URL 환경변수를 설정하면                 ║
║     /db/ 페이지가 성공 상태를 표시합니다.               ║
║                                                          ║
║  종료: Ctrl+C                                            ║
╚══════════════════════════════════════════════════════════╝
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n에뮬레이터를 종료합니다...")
            return

if __name__ == "__main__":
    run_emulator()