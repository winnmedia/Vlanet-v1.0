"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

# 환경 변수에서 설정 모듈을 받아오거나 기본값 사용
if os.environ.get('RAILWAY_ENVIRONMENT'):
    # Railway 환경에서는 환경변수 또는 minimal 설정 사용
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.environ.get('DJANGO_SETTINGS_MODULE', "config.settings_minimal"))
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_base")

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
