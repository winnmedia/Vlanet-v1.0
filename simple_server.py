#!/usr/bin/env python3
"""가장 간단한 HTTP 서버 - Railway 테스트용"""
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"status": "ok", "message": "Simple server is running"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def log_message(self, format, *args):
        # 로그 출력
        print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server = HTTPServer(('0.0.0.0', port), SimpleHandler)
    print(f"🚀 Simple server running on port {port}")
    print(f"📍 Health check endpoint: http://0.0.0.0:{port}/api/health/")
    server.serve_forever()