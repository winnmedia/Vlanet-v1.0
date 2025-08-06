"""
시스템 관련 URL 패턴
"""
from django.urls import path
from . import views

app_name = 'system'

urlpatterns = [
    # 헬스체크
    path('health/', views.health_check, name='health_check'),
    
    # API 루트
    path('', views.api_root, name='api_root'),
    
    # 시스템 정보
    path('system/migrations/', views.migration_status, name='migration_status'),
    path('version/', views.version_info, name='version_info'),
    
    # OPTIONS (CORS)
    path('options/', views.options_handler, name='options'),
]