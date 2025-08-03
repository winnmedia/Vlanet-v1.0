from django.urls import path
from . import views

urlpatterns = [
    # 실시간 추적
    path('track/', views.TrackEventView.as_view(), name='track_event'),
    path('session/', views.SessionAnalyticsView.as_view(), name='session_analytics'),
    
    # 대시보드 데이터
    path('dashboard/', views.DashboardDataView.as_view(), name='dashboard_data'),
    path('realtime/', views.RealtimeMetricsView.as_view(), name='realtime_metrics'),
    
    # 인사이트 및 피드백
    path('insights/', views.UserInsightsView.as_view(), name='user_insights'),
    path('feedback/', views.FeedbackView.as_view(), name='user_feedback'),
]