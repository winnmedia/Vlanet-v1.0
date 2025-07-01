from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def health_check(request):
    """헬스체크 엔드포인트"""
    return JsonResponse({
        "status": "healthy",
        "service": "vridge-backend",
        "message": "Service is running",
        "cors_test": True,
        "method": request.method,
        "headers": {
            "origin": request.META.get('HTTP_ORIGIN', 'No origin'),
            "host": request.META.get('HTTP_HOST', 'No host')
        }
    })


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