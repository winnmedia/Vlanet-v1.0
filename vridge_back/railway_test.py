#!/usr/bin/env python3
"""
Railway 테스트용 최소 서버
"""
import os
import sys

print("=" * 50)
print("RAILWAY TEST SERVER STARTING")
print(f"Python version: {sys.version}")
print(f"PORT: {os.environ.get('PORT', 'NOT SET')}")
print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'NOT SET')}")
print("=" * 50)

# 최소한의 Django 설정
try:
    from django.conf import settings
    from django.http import JsonResponse
    from django.urls import path
    from django.core.wsgi import get_wsgi_application
    
    if not settings.configured:
        settings.configure(
            DEBUG=True,
            SECRET_KEY='test-key',
            ROOT_URLCONF=__name__,
            ALLOWED_HOSTS=['*'],
            INSTALLED_APPS=[
                'django.contrib.contenttypes',
                'django.contrib.auth',
            ],
            MIDDLEWARE=[],
        )
    
    def health_view(request):
        return JsonResponse({
            'status': 'ok',
            'service': 'railway-test',
            'port': os.environ.get('PORT', 'unknown')
        })
    
    urlpatterns = [
        path('api/health/', health_view),
        path('', health_view),
    ]
    
    application = get_wsgi_application()
    
    if __name__ == '__main__':
        from django.core.management import execute_from_command_line
        port = os.environ.get('PORT', '8000')
        execute_from_command_line(['manage.py', 'runserver', f'0.0.0.0:{port}'])
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()