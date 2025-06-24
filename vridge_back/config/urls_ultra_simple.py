"""
초간단 URL 설정 - crashed 방지용
"""
from django.http import HttpResponse
from django.urls import path

def home(request):
    return HttpResponse("✅ Django is working! All systems operational.")

def health(request):
    return HttpResponse("OK")

urlpatterns = [
    path('', home),
    path('health/', health),
]