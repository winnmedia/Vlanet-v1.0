"""
최소 URL 설정 - 헬스체크와 기본 API만
"""
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def minimal_health(request):
    """최소 헬스체크"""
    return JsonResponse({
        'status': 'ok',
        'message': 'Minimal settings active',
        'cors': True
    })

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

urlpatterns = [
    path('', minimal_health, name='home'),
    path('health/', minimal_health, name='health'),
    path('api/', api_root, name='api_root'),
    path('api/video-planning/', include('video_planning.urls')),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/feedbacks/', include('feedbacks.urls')),
    path('users/', include('users.urls')),  # 기존 경로 호환성
]