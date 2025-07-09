#!/usr/bin/env python3
"""
Railway 헬스체크 테스트용 초간단 서버
"""
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health/' or self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "ok",
                "service": "vridge-backend",
                "port": os.environ.get('PORT', '8000')
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            
    def log_message(self, format, *args):
        # 로그 출력
        print(f"{self.address_string()} - {format % args}")

def run_server():
    port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, HealthHandler)
    print(f"Simple health server starting on port {port}")
    print(f"Health endpoint: http://0.0.0.0:{port}/api/health/")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()