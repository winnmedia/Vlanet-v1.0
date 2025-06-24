"""
초간단 URL 설정 - crashed 방지용
"""
from django.http import HttpResponse
from django.urls import path
import os

def home(request):
    return HttpResponse("""
    <h1>✅ Django is working! All systems operational. (Updated 23:25)</h1>
    <p><strong>Available endpoints:</strong></p>
    <ul>
        <li><a href="/health/">Health Check</a></li>
        <li><a href="/db/">Database Test</a></li>
    </ul>
    <p><strong>Debug info:</strong> urls_ultra_simple.py loaded successfully</p>
    """)

def health(request):
    return HttpResponse("OK")

def db_test(request):
    try:
        from django.db import connection
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
        <p><a href="/">← Back to Home</a></p>
        """)
    except Exception as e:
        return HttpResponse(f"""
        <h1>❌ Database Error</h1>
        <p><strong>Error:</strong> {str(e)}</p>
        <p><strong>DATABASE_URL:</strong> {os.environ.get('DATABASE_URL', 'Not set')}</p>
        <p><a href="/">← Back to Home</a></p>
        """)

urlpatterns = [
    path('', home),
    path('health/', health),
    path('db/', db_test),
]