"""간단한 URL 설정 - 마이그레이션 없이도 작동"""
from django.urls import path
from django.http import JsonResponse
import os

def home(request):
    """홈페이지 뷰"""
    return JsonResponse({
        'message': 'VideoPlanet API is running on Railway!',
        'status': 'ok',
        'environment': os.environ.get('RAILWAY_ENVIRONMENT', 'unknown'),
        'database_url': 'configured' if os.environ.get('DATABASE_URL') else 'not configured'
    })

def health(request):
    """헬스체크 엔드포인트"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'VideoPlanet Backend'
    })

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
]