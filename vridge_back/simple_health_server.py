#!/usr/bin/env python3
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
                "version": "simple"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # 로그를 출력하여 Railway에서 확인 가능
        print(f"[{self.log_date_time_string()}] {format % args}")

def run():
    port = int(os.environ.get('PORT', 8000))
    server_address = ('', port)
    httpd = HTTPServer(server_address, HealthHandler)
    print(f"Starting simple health server on port {port}...")
    print(f"Health check endpoint: http://0.0.0.0:{port}/api/health/")
    httpd.serve_forever()

if __name__ == '__main__':
    run()