"""
가장 간단한 URL 설정 - Railway 테스트용
"""
from django.http import HttpResponse
from django.urls import path

def home(request):
    return HttpResponse("🎉 Railway Django is working! VideoPlanet is alive!")

def health(request):
    return HttpResponse("OK")

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
]