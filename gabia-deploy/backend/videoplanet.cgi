#!/home/호스팅계정/.local/bin/python3
"""
가비아 웹호스팅용 CGI 스크립트
Apache CGI 환경에서 Django 실행
"""
import sys
import os

# 프로젝트 경로 설정
PROJECT_PATH = '/home/호스팅계정/videoplanet'
sys.path.insert(0, PROJECT_PATH)
sys.path.insert(0, os.path.join(PROJECT_PATH, 'vridge_back'))

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.gabia')

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# CGI 핸들러로 실행
from wsgiref.handlers import CGIHandler
CGIHandler().run(application)
