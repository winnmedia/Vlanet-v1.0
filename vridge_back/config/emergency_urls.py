"""
긴급 URL 설정 - 최소한의 의존성으로 작동
"""
from django.urls import path
from django.http import HttpResponse

def emergency_health(request):
    """가장 기본적인 헬스체크 - 의존성 없음"""
    return HttpResponse("OK", content_type="text/plain", status=200)

urlpatterns = [
    path("health/", emergency_health),
    path("api/health/", emergency_health),
    path("", emergency_health),  # 루트 경로도 헬스체크로
]