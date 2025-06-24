"""
AI 영상 분석 URL 설정
"""
from django.urls import path
from . import views

app_name = 'video_analysis'

urlpatterns = [
    # 영상 분석 실행
    path('analyze/', views.analyze_video_api, name='analyze_video'),
    
    # 분석 결과 조회
    path('result/<int:analysis_id>/', views.get_analysis_result, name='get_analysis_result'),
    
    # AI 시스템 상태
    path('status/', views.ai_status, name='ai_status'),
    
    # 사용자 분석 히스토리
    path('history/', views.user_analysis_history, name='user_analysis_history'),
]