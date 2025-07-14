#!/usr/bin/env python3
"""간단한 테스트 서버"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class TestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            response = f"""
            <html>
            <body>
                <h1>Railway Test Server</h1>
                <p>Python Version: {sys.version}</p>
                <p>Working Directory: {os.getcwd()}</p>
                <p>Environment Variables:</p>
                <ul>
                    <li>SECRET_KEY: {'Set' if os.environ.get('SECRET_KEY') else 'Not Set'}</li>
                    <li>DATABASE_URL: {'Set' if os.environ.get('DATABASE_URL') else 'Not Set'}</li>
                    <li>DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not Set')}</li>
                    <li>PORT: {os.environ.get('PORT', 'Not Set')}</li>
                </ul>
            </body>
            </html>
            """.encode()
            self.wfile.write(response)
        else:
            super().do_GET()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server = HTTPServer(('0.0.0.0', port), TestHandler)
    print(f"Test server running on port {port}")
    server.serve_forever()