"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Railway 환경에서는 항상 settings_minimal 사용
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_minimal")

application = get_wsgi_application()
