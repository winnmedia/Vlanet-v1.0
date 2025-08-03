"""
영상 기획 WebSocket 라우팅 설정
"""
from django.urls import re_path
from . import websocket_consumers

websocket_urlpatterns = [
    # 영상 기획 실시간 협업
    re_path(r'ws/planning/(?P<planning_id>\d+)/collaborate/$', 
            websocket_consumers.VideoPlanningCollaborationConsumer.as_asgi()),
    
    # 개인 알림 WebSocket
    re_path(r'ws/notifications/$', 
            websocket_consumers.VideoPlanningNotificationConsumer.as_asgi()),
]