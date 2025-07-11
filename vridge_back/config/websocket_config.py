"""
웹소켓 및 실시간 기능 설정
Django Channels를 위한 프로덕션 설정
"""

import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application


def get_websocket_application():
    """
    웹소켓 애플리케이션 설정
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
    
    # Django ASGI 애플리케이션
    django_asgi_app = get_asgi_application()
    
    # 웹소켓 라우팅 import (circular import 방지)
    from feedbacks import routing as feedback_routing
    from chat import routing as chat_routing
    
    # 전체 라우팅 결합
    websocket_urlpatterns = []
    websocket_urlpatterns.extend(feedback_routing.websocket_urlpatterns)
    websocket_urlpatterns.extend(chat_routing.websocket_urlpatterns)
    
    # 프로토콜 라우터
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        ),
    })
    
    return application


def configure_channels(settings_module):
    """
    Channels 설정을 동적으로 구성
    settings.py에서 호출하여 사용
    """
    
    # Redis URL 확인
    REDIS_URL = os.environ.get('REDIS_URL')
    
    if REDIS_URL:
        # Redis를 사용한 프로덕션 설정
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    "hosts": [REDIS_URL],
                    "capacity": 1500,
                    "expiry": 10,
                    "group_expiry": 86400,  # 24시간
                    "channel_capacity": {
                        "http.request": 1000,
                        "websocket.send": 100,
                    },
                },
            },
        }
    else:
        # 개발용 InMemory 레이어
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
                'CONFIG': {
                    "capacity": 100,
                    "expiry": 60,
                },
            },
        }
    
    return CHANNEL_LAYERS


# 웹소켓 연결 관리 클래스
class WebSocketManager:
    """
    웹소켓 연결 상태 관리
    """
    
    def __init__(self):
        self.connections = {}
        self.reconnect_attempts = {}
    
    def add_connection(self, user_id, channel_name):
        """연결 추가"""
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(channel_name)
    
    def remove_connection(self, user_id, channel_name):
        """연결 제거"""
        if user_id in self.connections:
            self.connections[user_id].remove(channel_name)
            if not self.connections[user_id]:
                del self.connections[user_id]
    
    def get_user_connections(self, user_id):
        """사용자의 모든 연결 반환"""
        return self.connections.get(user_id, [])
    
    def is_user_online(self, user_id):
        """사용자 온라인 상태 확인"""
        return user_id in self.connections


# 전역 매니저 인스턴스
ws_manager = WebSocketManager()


# 웹소켓 미들웨어
class WebSocketAuthMiddleware:
    """
    웹소켓 인증 미들웨어
    JWT 토큰 기반 인증
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        from urllib.parse import parse_qs
        from channels.db import database_sync_to_async
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth.models import AnonymousUser
        
        # 쿼리 파라미터에서 토큰 추출
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            try:
                # 토큰 검증
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                
                # 사용자 조회
                from users.models import User
                scope['user'] = await database_sync_to_async(
                    User.objects.get
                )(id=user_id)
            except Exception:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
        
        return await self.app(scope, receive, send)


# 재연결 로직
class ReconnectingWebSocket:
    """
    자동 재연결을 지원하는 웹소켓 클라이언트 (프론트엔드용 예시)
    """
    
    JS_CODE = """
    class ReconnectingWebSocket {
        constructor(url, options = {}) {
            this.url = url;
            this.options = {
                maxReconnectAttempts: 5,
                reconnectInterval: 1000,
                maxReconnectInterval: 30000,
                reconnectDecay: 1.5,
                timeoutInterval: 2000,
                ...options
            };
            
            this.reconnectAttempts = 0;
            this.reconnectInterval = this.options.reconnectInterval;
            this.shouldReconnect = true;
            this.messageQueue = [];
            
            this.connect();
        }
        
        connect() {
            this.ws = new WebSocket(this.url);
            this.connectTimeout = setTimeout(() => {
                this.ws.close();
            }, this.options.timeoutInterval);
            
            this.ws.onopen = (event) => {
                clearTimeout(this.connectTimeout);
                this.reconnectAttempts = 0;
                this.reconnectInterval = this.options.reconnectInterval;
                
                // 큐에 있던 메시지 전송
                while (this.messageQueue.length > 0) {
                    const message = this.messageQueue.shift();
                    this.ws.send(message);
                }
                
                if (this.onopen) this.onopen(event);
            };
            
            this.ws.onclose = (event) => {
                clearTimeout(this.connectTimeout);
                if (this.onclose) this.onclose(event);
                
                if (this.shouldReconnect && 
                    this.reconnectAttempts < this.options.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect();
                    }, this.reconnectInterval);
                    
                    // 재연결 간격 증가
                    this.reconnectInterval = Math.min(
                        this.reconnectInterval * this.options.reconnectDecay,
                        this.options.maxReconnectInterval
                    );
                }
            };
            
            this.ws.onerror = (event) => {
                if (this.onerror) this.onerror(event);
            };
            
            this.ws.onmessage = (event) => {
                if (this.onmessage) this.onmessage(event);
            };
        }
        
        send(data) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(data);
            } else {
                this.messageQueue.push(data);
            }
        }
        
        close() {
            this.shouldReconnect = false;
            this.ws.close();
        }
    }
    """


# 프로덕션 웹소켓 설정 가이드
PRODUCTION_GUIDE = """
# 프로덕션 웹소켓 배포 가이드

## 1. Daphne 설치 및 설정
```bash
pip install daphne
```

## 2. Daphne 실행 (Procfile 또는 start.sh)
```bash
daphne -b 0.0.0.0 -p $PORT config.asgi:application
```

## 3. Nginx 웹소켓 프록시 설정
```nginx
location /ws {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

## 4. 환경변수 설정
- REDIS_URL: Redis 연결 문자열
- WEBSOCKET_ACCEPT_ALL_ORIGINS: False (프로덕션)

## 5. 스케일링 고려사항
- Redis Cluster 사용 고려
- 로드 밸런서에서 Sticky Session 설정
- 헬스체크 엔드포인트 구현
"""


# 웹소켓 헬스체크
async def websocket_health_check(scope, receive, send):
    """
    웹소켓 헬스체크 엔드포인트
    /ws/health/ 로 접근
    """
    await send({
        'type': 'websocket.accept',
    })
    
    await send({
        'type': 'websocket.send',
        'text': json.dumps({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
        })
    })
    
    await send({
        'type': 'websocket.close',
    })


# 웹소켓 모니터링
class WebSocketMonitor:
    """
    웹소켓 연결 모니터링
    """
    
    def __init__(self):
        self.metrics = {
            'total_connections': 0,
            'active_connections': 0,
            'messages_sent': 0,
            'messages_received': 0,
            'errors': 0,
        }
    
    def on_connect(self):
        self.metrics['total_connections'] += 1
        self.metrics['active_connections'] += 1
    
    def on_disconnect(self):
        self.metrics['active_connections'] -= 1
    
    def on_message_sent(self):
        self.metrics['messages_sent'] += 1
    
    def on_message_received(self):
        self.metrics['messages_received'] += 1
    
    def on_error(self):
        self.metrics['errors'] += 1
    
    def get_metrics(self):
        return self.metrics.copy()


# 전역 모니터 인스턴스
ws_monitor = WebSocketMonitor()