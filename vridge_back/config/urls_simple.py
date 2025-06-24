"""
가장 간단한 URL 설정 - Railway 테스트용
"""
from django.http import HttpResponse
from django.urls import path
from django.db import connection
import os

def home(request):
    return HttpResponse("🎉 Railway Django is working! VideoPlanet is alive!")

def health(request):
    return HttpResponse("OK")

def db_test(request):
    try:
        # 데이터베이스 연결 테스트
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        db_url = os.environ.get('DATABASE_URL', 'Not set')
        db_engine = connection.settings_dict['ENGINE']
        
        return HttpResponse(f"""
        <h1>🗄️ Database Status</h1>
        <p><strong>Connection:</strong> ✅ Success</p>
        <p><strong>Engine:</strong> {db_engine}</p>
        <p><strong>DATABASE_URL:</strong> {db_url[:50]}...</p>
        <p><strong>Query Result:</strong> {result}</p>
        """)
    except Exception as e:
        return HttpResponse(f"""
        <h1>❌ Database Error</h1>
        <p><strong>Error:</strong> {str(e)}</p>
        <p><strong>DATABASE_URL:</strong> {os.environ.get('DATABASE_URL', 'Not set')}</p>
        """)

def debug_all(request):
    """모든 요청에 대한 디버그 정보"""
    return HttpResponse(f"""
    <h1>🔍 Debug Info</h1>
    <p><strong>Path:</strong> {request.path}</p>
    <p><strong>Method:</strong> {request.method}</p>
    <p><strong>Available URLs:</strong></p>
    <ul>
        <li><a href="/">/ - Home</a></li>
        <li><a href="/health/">health/ - Health Check</a></li>
        <li><a href="/db/">db/ - Database Test</a></li>
        <li><a href="/debug/">debug/ - This page</a></li>
    </ul>
    <p><strong>Django Settings:</strong> {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}</p>
    """)

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
    path('db/', db_test, name='db_test'),
    path('debug/', debug_all, name='debug'),
]