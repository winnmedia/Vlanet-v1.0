"""간단한 URL 설정 - 마이그레이션 없이도 작동"""
from django.urls import path
from django.http import JsonResponse
from django.db import connection
from django.shortcuts import render
import os

def home(request):
    """홈페이지 뷰"""
    # Accept 헤더 확인하여 JSON 또는 HTML 반환
    if 'application/json' in request.META.get('HTTP_ACCEPT', ''):
        return JsonResponse({
            'message': 'VideoPlanet API is running on Railway!',
            'status': 'ok',
            'environment': os.environ.get('RAILWAY_ENVIRONMENT', 'unknown'),
            'database_url': 'configured' if os.environ.get('DATABASE_URL') else 'not configured',
            'endpoints': {
                'health': '/health/',
                'db_test': '/db_test/',
                'api': '/api/'
            }
        })
    else:
        # HTML 페이지 반환
        return render(request, 'index.html')

def health(request):
    """헬스체크 엔드포인트"""
    from django.http import HttpResponse
    return HttpResponse("OK", content_type="text/plain", status=200)

def db_test(request):
    """데이터베이스 연결 테스트"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Database connection successful',
            'database': connection.settings_dict.get('ENGINE', 'unknown'),
            'test_query': result[0] if result else None
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'database': connection.settings_dict.get('ENGINE', 'unknown')
        }, status=500)

urlpatterns = [
    path('', home, name='home'),
    path('api/', home, name='api-root'),
    path('health/', health, name='health'),
    path('db_test/', db_test, name='db-test'),
    path('api/db_test/', db_test, name='api-db-test'),
]