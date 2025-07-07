"""
최소 URL 설정 - 헬스체크와 기본 API만
"""
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import sys
import os
from django.core.management import call_command
from django.db import connection
import io
from contextlib import redirect_stdout

@csrf_exempt
def minimal_health(request):
    """최소 헬스체크"""
    try:
        return JsonResponse({
            'status': 'ok',
            'message': 'Minimal settings active',
            'cors': True
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt  
def api_root(request):
    """API 루트"""
    return JsonResponse({
        'message': 'VideoPlanet API',
        'version': '1.0',
        'endpoints': {
            'health': '/health/',
            'video-planning': '/api/video-planning/',
        }
    })

@csrf_exempt
def debug_info(request):
    """디버그 정보"""
    return HttpResponse(f"""
    <h1>VideoPlanet Debug Info</h1>
    <p>Python: {sys.version}</p>
    <p>Django Settings: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}</p>
    <p>Port: {os.environ.get('PORT', 'Not set')}</p>
    <p>Working Directory: {os.getcwd()}</p>
    """)

@csrf_exempt
def emergency_migrate(request):
    """긴급 마이그레이션 실행 - 웹에서 바로 실행 가능"""
    # 보안을 위한 간단한 키 체크
    secret = request.GET.get('secret', '')
    if secret != 'migrate2024':
        return JsonResponse({"error": "Unauthorized. Use ?secret=migrate2024"}, status=401)
    
    try:
        output = io.StringIO()
        result = {"status": "running", "steps": []}
        
        # 1. 마이그레이션 상태 확인
        with redirect_stdout(output):
            call_command('showmigrations', 'projects', 'video_planning')
        result["steps"].append({
            "name": "Check migrations",
            "output": output.getvalue()
        })
        output.truncate(0)
        
        # 2. 마이그레이션 실행
        with redirect_stdout(output):
            call_command('migrate', verbosity=2)
        result["steps"].append({
            "name": "Run migrations",
            "output": output.getvalue()
        })
        
        # 3. 테이블 확인
        with connection.cursor() as cursor:
            # PostgreSQL 또는 SQLite에 따라 다른 쿼리
            if 'postgresql' in connection.vendor:
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('video_planning', 'projects_project', 'projects_idempotencyrecord')
                """)
            else:
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    AND name IN ('video_planning', 'projects_project', 'projects_idempotencyrecord')
                """)
            
            tables = [row[0] for row in cursor.fetchall()]
            result["verified_tables"] = tables
            
            # projects_project 컬럼 확인
            if 'postgresql' in connection.vendor:
                cursor.execute("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'projects_project' 
                    AND column_name IN ('tone_manner', 'genre', 'concept')
                """)
            else:
                cursor.execute("PRAGMA table_info(projects_project)")
                columns = [row[1] for row in cursor.fetchall()]
                columns = [c for c in columns if c in ['tone_manner', 'genre', 'concept']]
                cursor.fetchall = lambda: [(c,) for c in columns]
            
            columns = [row[0] for row in cursor.fetchall()]
            result["verified_columns"] = columns
        
        result["status"] = "completed"
        result["success"] = True
        
        # 성공 여부 확인
        missing = []
        if 'video_planning' not in tables:
            missing.append('video_planning table')
        if 'projects_idempotencyrecord' not in tables:
            missing.append('projects_idempotencyrecord table')
        if 'tone_manner' not in columns:
            missing.append('projects_project.tone_manner column')
            
        if missing:
            result["warning"] = f"Missing: {', '.join(missing)}"
        else:
            result["message"] = "All migrations applied successfully!"
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }, status=500)

urlpatterns = [
    path('', minimal_health, name='home'),
    path('health/', minimal_health, name='health'),
    path('debug/', debug_info, name='debug'),
    path('api/', api_root, name='api_root'),
    
    # 긴급 마이그레이션 엔드포인트
    path('emergency-migrate/', emergency_migrate, name='emergency_migrate'),
    
    path('api/video-planning/', include('video_planning.urls')),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('users/', include('users.urls')),  # 기존 경로 호환성
]