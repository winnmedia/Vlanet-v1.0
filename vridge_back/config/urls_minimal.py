"""
최소 URL 설정 - 헬스체크와 기본 API만
"""
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import sys
import os

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

urlpatterns = [
    path('', minimal_health, name='home'),
    path('health/', minimal_health, name='health'),
    path('debug/', debug_info, name='debug'),
    path('api/', api_root, name='api_root'),
    path('api/video-planning/', include('video_planning.urls')),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('users/', include('users.urls')),  # 기존 경로 호환성
]