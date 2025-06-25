"""디버깅용 최소 URL 설정"""
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'VideoPlanet API is running on Railway'
    })

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
]