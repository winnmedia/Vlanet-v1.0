#!/usr/bin/env python3
"""간단한 헬스체크 서버 - Railway 헬스체크 전용"""
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"status": "ok", "message": "VideoPlanet API is healthy"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # 로그 스팸 방지
        if '/api/health/' in args[0]:
            return
        super().log_message(format, *args)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server = HTTPServer(('::', port), HealthCheckHandler)
    print(f"Health check server running on [::]:{port}")
    server.serve_forever()