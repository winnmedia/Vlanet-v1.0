"""
백엔드 전용 URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection

def api_root(request):
    """API 루트 엔드포인트"""
    return JsonResponse({
        'message': 'VideoPlanet Backend API',
        'version': '1.0.0',
        'status': 'running',
        'environment': settings.DEBUG and 'development' or 'production',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/users/',
            'projects': '/api/projects/',
            'feedbacks': '/api/feedbacks/',
            'online': '/api/onlines/',
            'db_test': '/api/db_test/',
        }
    })

def db_test(request):
    """데이터베이스 연결 테스트"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Database connection successful',
            'database': connection.settings_dict.get('ENGINE', 'unknown'),
            'test_query': result[0] if result else None
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'database': connection.settings_dict.get('ENGINE', 'unknown')
        }, status=500)

# API URLs
api_patterns = [
    path('users/', include('users.urls')),
    path('projects/', include('projects.urls')),
    path('feedbacks/', include('feedbacks.urls')),
    path('onlines/', include('onlines.urls')),
    path('db_test/', db_test, name='db-test'),
]

urlpatterns = [
    # Root
    path('', api_root, name='api-root'),
    path('api/', api_root, name='api-root-alt'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(api_patterns)),
]

# Static/Media files
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin customization
admin.site.site_header = "VideoPlanet 관리자"
admin.site.site_title = "VideoPlanet"
admin.site.index_title = "관리자 대시보드"