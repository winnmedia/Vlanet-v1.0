"""
Production URL Configuration - 프론트엔드와 백엔드 통합
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import JsonResponse

def api_root(request):
    """API 루트 엔드포인트"""
    return JsonResponse({
        'message': 'VideoPlanet API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/users/',
            'projects': '/api/projects/',
            'feedbacks': '/api/feedbacks/',
            'online': '/api/onlines/',
            'admin': '/admin/',
        }
    })

# API URLs
api_patterns = [
    path('', api_root, name='api-root'),
    path('users/', include('users.urls')),
    path('projects/', include('projects.urls')),
    path('feedbacks/', include('feedbacks.urls')),
    path('onlines/', include('onlines.urls')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(api_patterns)),
    
    # Media files
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # React App - 모든 나머지 경로는 React로
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react-app'),
]

# Static files (CSS, JavaScript, Images)
if settings.DEBUG:
    urlpatterns = static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + urlpatterns
    urlpatterns = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + urlpatterns

# Admin customization
admin.site.site_header = "VideoPlanet 관리자"
admin.site.site_title = "VideoPlanet"
admin.site.index_title = "관리자 대시보드"