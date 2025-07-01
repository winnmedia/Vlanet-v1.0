from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def health_check(request):
    """헬스체크 엔드포인트"""
    return JsonResponse({
        "status": "healthy",
        "service": "vridge-backend",
        "message": "Service is running"
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