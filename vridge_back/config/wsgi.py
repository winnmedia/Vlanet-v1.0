"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Railway 환경에서는 railway 설정 사용
if os.environ.get('RAILWAY_ENVIRONMENT'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_dev")

application = get_wsgi_application()
