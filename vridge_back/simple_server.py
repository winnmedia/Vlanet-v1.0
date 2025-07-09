#!/usr/bin/env python3
"""
가장 간단한 HTTP 서버 - 의존성 없음
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import os
import sys

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'OK - Python HTTP Server Running')
    
    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # 로그 출력
        sys.stdout.write("%s - - [%s] %s\n" %
                         (self.client_address[0],
                          self.log_date_time_string(),
                          format%args))
        sys.stdout.flush()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    
    print(f"Starting simple HTTP server on port {port}")
    sys.stdout.flush()
    
    httpd = HTTPServer(server_address, HealthHandler)
    print(f"Server is ready at http://0.0.0.0:{port}")
    sys.stdout.flush()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()