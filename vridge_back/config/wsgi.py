"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

# 강제로 설정 모듈 지정
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.test"

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
