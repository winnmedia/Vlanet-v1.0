#!/home/호스팅계정/.local/bin/python3
"""
가비아 웹호스팅용 WSGI 설정
Passenger 환경에서 Django 실행
"""
import sys
import os

# 프로젝트 경로 설정
sys.path.insert(0, '/home/호스팅계정/videoplanet')
sys.path.insert(0, '/home/호스팅계정/videoplanet/vridge_back')

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.gabia')

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
