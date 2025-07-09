#!/usr/bin/env python3
"""
최소한의 Python HTTP 서버
Railway 헬스체크를 통과하기 위한 단순 서버
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import os
import signal
import sys

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'OK - Python HTTP Server Running')
    
    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
    
    def log_message(self, format, *args):
        # 로그 메시지를 줄여서 노이즈 감소
        return

def signal_handler(sig, frame):
    print('Shutting down server...')
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    port = int(os.environ.get('PORT', 8000))
    server_address = ('', port)
    httpd = HTTPServer(server_address, HealthHandler)
    
    print(f'Server running on port {port}')
    httpd.serve_forever()