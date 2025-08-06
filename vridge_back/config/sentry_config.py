"""
Sentry 설정 모듈
실시간 에러 모니터링 및 성능 추적
"""
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging
import os

def init_sentry():
    """Sentry 초기화"""
    
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    ENVIRONMENT = os.environ.get('DJANGO_ENV', 'development')
    
    if not SENTRY_DSN:
        logging.warning("Sentry DSN not configured. Monitoring disabled.")
        return
    
    # 로깅 통합 설정
    logging_integration = LoggingIntegration(
        level=logging.INFO,        # INFO 레벨 이상 캡처
        event_level=logging.ERROR   # ERROR 레벨 이상만 이벤트로
    )
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='endpoint',
                middleware_spans=True,
                signals_spans=True,
                cache_spans=True,
            ),
            RedisIntegration(),
            CeleryIntegration(
                monitor_beat_tasks=True,
                propagate_traces=True,
            ),
            logging_integration,
        ],
        
        # 성능 모니터링
        traces_sample_rate=0.1 if ENVIRONMENT == 'production' else 1.0,
        profiles_sample_rate=0.1 if ENVIRONMENT == 'production' else 1.0,
        
        # 환경 설정
        environment=ENVIRONMENT,
        release=os.environ.get('RAILWAY_GIT_COMMIT_SHA', 'unknown'),
        
        # 에러 필터링
        before_send=before_send_filter,
        before_send_transaction=before_send_transaction_filter,
        
        # 추가 설정
        attach_stacktrace=True,
        send_default_pii=False,  # PII 정보 전송 비활성화
        
        # 무시할 에러
        ignore_errors=[
            'DisallowedHost',
            'Http404',
            'PermissionDenied',
            'SuspiciousOperation',
        ],
        
        # 브레드크럼 설정
        max_breadcrumbs=50,
        
        # 릴리즈 헬스
        auto_session_tracking=True,
    )

def before_send_filter(event, hint):
    """
    이벤트 전송 전 필터링
    민감한 정보 제거 및 불필요한 이벤트 필터링
    """
    
    # 개발 환경에서는 콘솔에도 출력
    if os.environ.get('DJANGO_ENV') == 'development':
        logging.error(f"Sentry Event: {event.get('message', 'No message')}")
    
    # 민감한 정보 제거
    if 'request' in event:
        request = event['request']
        
        # 헤더에서 민감한 정보 제거
        if 'headers' in request:
            sensitive_headers = ['Authorization', 'Cookie', 'X-CSRFToken']
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[REDACTED]'
        
        # 쿠키 정보 제거
        if 'cookies' in request:
            request['cookies'] = '[REDACTED]'
        
        # POST 데이터에서 비밀번호 제거
        if 'data' in request:
            if isinstance(request['data'], dict):
                for key in ['password', 'password1', 'password2', 'token', 'secret']:
                    if key in request['data']:
                        request['data'][key] = '[REDACTED]'
    
    # 특정 URL 패턴 무시
    if 'request' in event and 'url' in event['request']:
        ignored_paths = ['/health/', '/api/health/', '/admin/jsi18n/']
        for path in ignored_paths:
            if path in event['request']['url']:
                return None
    
    # 테스트 환경 이벤트 무시
    if 'tags' in event and event['tags'].get('test') == 'true':
        return None
    
    return event

def before_send_transaction_filter(event, hint):
    """
    트랜잭션 이벤트 필터링
    성능 모니터링 데이터 필터링
    """
    
    # 헬스체크 트랜잭션 무시
    if event.get('transaction') in ['/health/', '/api/health/']:
        return None
    
    # 정적 파일 트랜잭션 무시
    if event.get('transaction', '').startswith('/static/'):
        return None
    
    # 미디어 파일 트랜잭션 무시
    if event.get('transaction', '').startswith('/media/'):
        return None
    
    return event

def capture_message(message, level='info', **kwargs):
    """
    커스텀 메시지 캡처 헬퍼
    """
    extra_context = kwargs.get('extra', {})
    tags = kwargs.get('tags', {})
    
    with sentry_sdk.push_scope() as scope:
        for key, value in extra_context.items():
            scope.set_extra(key, value)
        for key, value in tags.items():
            scope.set_tag(key, value)
        
        sentry_sdk.capture_message(message, level=level)

def capture_exception(exception, **kwargs):
    """
    커스텀 예외 캡처 헬퍼
    """
    extra_context = kwargs.get('extra', {})
    tags = kwargs.get('tags', {})
    
    with sentry_sdk.push_scope() as scope:
        for key, value in extra_context.items():
            scope.set_extra(key, value)
        for key, value in tags.items():
            scope.set_tag(key, value)
        
        sentry_sdk.capture_exception(exception)

# 성능 모니터링 데코레이터
def monitor_performance(op_name):
    """
    함수 성능 모니터링 데코레이터
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with sentry_sdk.start_span(op=op_name) as span:
                span.set_tag('function', func.__name__)
                try:
                    result = func(*args, **kwargs)
                    span.set_status('ok')
                    return result
                except Exception as e:
                    span.set_status('error')
                    span.set_tag('error', str(e))
                    raise
        return wrapper
    return decorator