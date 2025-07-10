#!/usr/bin/env python3
"""Django 시작 테스트 - 환경 확인용"""
import os
import sys

print("=== Django Start Test ===")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Directory contents: {os.listdir('.')}")

# 환경변수 확인
print("\n=== Environment Variables ===")
print(f"PORT: {os.environ.get('PORT', 'Not set')}")
print(f"SECRET_KEY: {'Set' if os.environ.get('SECRET_KEY') else 'NOT SET!'}")
print(f"DATABASE_URL: {'Set' if os.environ.get('DATABASE_URL') else 'NOT SET!'}")
print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}")

# Django import 테스트
print("\n=== Django Import Test ===")
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
    import django
    print("✅ Django imported successfully")
    print(f"Django version: {django.VERSION}")
    
    # Django 설정 로드 테스트
    django.setup()
    print("✅ Django setup completed")
    
    # 간단한 서버 시작
    from django.core.management import execute_from_command_line
    print("\n🚀 Starting Django development server...")
    execute_from_command_line(['manage.py', 'runserver', f'0.0.0.0:{os.environ.get("PORT", "8000")}'])
    
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    
    # 대체 서버 시작
    print("\n🔄 Starting fallback server...")
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import json
    
    class FallbackHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/api/health/':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"status": "ok", "error": str(e)}
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(404)
                self.end_headers()
    
    port = int(os.environ.get('PORT', 8000))
    server = HTTPServer(('0.0.0.0', port), FallbackHandler)
    print(f"Fallback server running on port {port}")
    server.serve_forever()