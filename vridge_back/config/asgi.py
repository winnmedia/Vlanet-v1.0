"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

# Railway 환경에서는 railway 설정 사용
if os.environ.get('RAILWAY_ENVIRONMENT'):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway")

import django  # 환경변수 입력 후 django 모듈 불러오기

django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator, AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from feedbacks import routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "websocket": OriginValidator(
            AuthMiddlewareStack(
                # URLRouter 로 연결, 소비자의 라우트 연결 HTTP path를 조사
                URLRouter(routing.websocket_urlpatterns)
            ),
            [
                ".localhost",
                "http://localhost:3000",
                ".vlanet.net",
                "https://vlanet.net:443",
            ],
        ),
        "http": django_asgi_app,
    }
)
