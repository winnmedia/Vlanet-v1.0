from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def health_check(request):
    """헬스체크 엔드포인트"""
    from django.db import connection
    import os
    
    # 기본 상태
    status = {
        "status": "healthy",
        "service": "vridge-backend",
        "message": "Service is running",
        "environment": os.environ.get('RAILWAY_ENVIRONMENT', 'unknown'),
        "settings": os.environ.get('DJANGO_SETTINGS_MODULE', 'unknown')
    }
    
    # 데이터베이스 연결 체크
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status["database"] = "connected"
    except Exception as e:
        status["database"] = f"error: {str(e)[:50]}"
        status["status"] = "unhealthy"
    
    # 필수 환경변수 체크
    status["env_check"] = {
        "SECRET_KEY": "set" if os.environ.get('SECRET_KEY') else "missing",
        "DATABASE_URL": "set" if os.environ.get('DATABASE_URL') else "missing",
        "PORT": os.environ.get('PORT', 'not set')
    }
    
    return JsonResponse(status)


@csrf_exempt
def root_view(request):
    """루트 경로 핸들러"""
    return JsonResponse({
        "message": "VRidge Backend API",
        "version": "1.0.0",
        "endpoints": {
            "users": "/users/",
            "projects": "/projects/",
            "feedbacks": "/feedbacks/",
            "onlines": "/onlines/",
            "admin": "/admin/",
            "health": "/health/"
        }
    })