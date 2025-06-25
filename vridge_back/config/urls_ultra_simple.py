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
    import traceback
    try:
        # Step 1: Check if DATABASE_URL exists
        db_url = os.environ.get('DATABASE_URL', 'Not set')
        
        # Step 2: Try to import and use connection
        from django.db import connection
        
        # Step 3: Get database settings
        try:
            db_settings = connection.settings_dict
            db_engine = db_settings.get('ENGINE', 'Unknown')
        except Exception as settings_error:
            db_engine = f"Error getting engine: {settings_error}"
            db_settings = {}
        
        # Step 4: Try to execute query
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            query_status = f"✅ Success: {result}"
        except Exception as query_error:
            query_status = f"❌ Query failed: {query_error}"
            result = None
        
        return HttpResponse(f"""
        <h1>🗄️ Database Status</h1>
        <p><strong>DATABASE_URL:</strong> {db_url[:50] if db_url != 'Not set' else 'Not set'}...</p>
        <p><strong>Engine:</strong> {db_engine}</p>
        <p><strong>Query Status:</strong> {query_status}</p>
        <p><strong>Database Name:</strong> {db_settings.get('NAME', 'Unknown')}</p>
        <p><strong>Host:</strong> {db_settings.get('HOST', 'Unknown')}</p>
        <p><a href="/">← Back to Home</a></p>
        """)
    except Exception as e:
        # Get full traceback for debugging
        tb = traceback.format_exc()
        return HttpResponse(f"""
        <h1>❌ Database Error</h1>
        <p><strong>Error Type:</strong> {type(e).__name__}</p>
        <p><strong>Error Message:</strong> {str(e)}</p>
        <p><strong>DATABASE_URL:</strong> {os.environ.get('DATABASE_URL', 'Not set')}</p>
        <details>
            <summary>Full Traceback</summary>
            <pre>{tb}</pre>
        </details>
        <p><a href="/">← Back to Home</a></p>
        """, status=500)

urlpatterns = [
    path('', home),
    path('api/', home),  # /api/ 경로 추가
    path('health/', health),
    path('db/', db_test),
    path('db_test/', db_test),  # /db_test/ 경로 추가
    path('api/db_test/', db_test),  # /api/db_test/ 경로 추가
]