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

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
    path('db/', db_test, name='db_test'),
]