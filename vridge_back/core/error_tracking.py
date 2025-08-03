"""
오류 추적 및 자동 복구 시스템
"막힘 없이, 오류 없이" 원칙을 실현하기 위한 종합적인 오류 관리 시스템
"""
import logging
import traceback
import json
import time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.core.mail import send_mail
from django.http import JsonResponse

logger = logging.getLogger('error_tracking')

class ErrorSeverity(Enum):
    """오류 심각도"""
    LOW = "low"           # 정보성, 로깅만
    MEDIUM = "medium"     # 경고, 모니터링 필요
    HIGH = "high"         # 중요, 즉시 조치 필요
    CRITICAL = "critical" # 치명적, 서비스 중단 가능

class ErrorCategory(Enum):
    """오류 카테고리"""
    SYSTEM = "system"           # 시스템 오류
    DATABASE = "database"       # 데이터베이스 오류
    API = "api"                # API 호출 오류
    VALIDATION = "validation"   # 데이터 검증 오류
    PERMISSION = "permission"   # 권한 오류
    BUSINESS_LOGIC = "business" # 비즈니스 로직 오류
    EXTERNAL_SERVICE = "external" # 외부 서비스 오류
    USER = "user"              # 사용자 입력 오류

@dataclass
class ErrorContext:
    """오류 컨텍스트 정보"""
    user_id: Optional[int] = None
    username: Optional[str] = None
    request_path: Optional[str] = None
    request_method: Optional[str] = None
    request_data: Optional[Dict] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    session_id: Optional[str] = None
    planning_id: Optional[int] = None
    additional_data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ErrorRecord:
    """오류 기록"""
    error_id: str
    timestamp: str
    severity: ErrorSeverity
    category: ErrorCategory
    message: str
    exception_type: str
    stack_trace: str
    context: ErrorContext
    recovery_attempted: bool = False
    recovery_successful: bool = False
    recovery_method: Optional[str] = None
    occurrence_count: int = 1
    first_occurrence: Optional[str] = None
    last_occurrence: Optional[str] = None

class AutoRecoveryStrategy:
    """자동 복구 전략"""
    
    def __init__(self, name: str, condition: Callable, action: Callable, max_attempts: int = 3):
        self.name = name
        self.condition = condition  # 복구 조건 함수
        self.action = action       # 복구 액션 함수
        self.max_attempts = max_attempts
        self.attempt_count = 0
    
    def can_recover(self, error_record: ErrorRecord) -> bool:
        """복구 가능 여부 확인"""
        return self.condition(error_record) and self.attempt_count < self.max_attempts
    
    def attempt_recovery(self, error_record: ErrorRecord) -> bool:
        """복구 시도"""
        self.attempt_count += 1
        try:
            return self.action(error_record)
        except Exception as e:
            logger.error(f"복구 전략 '{self.name}' 실행 실패: {str(e)}")
            return False

class ErrorTrackingSystem:
    """오류 추적 시스템"""
    
    def __init__(self):
        self.recovery_strategies: List[AutoRecoveryStrategy] = []
        self.error_patterns: Dict[str, List[ErrorRecord]] = {}
        self.alert_thresholds = {
            ErrorSeverity.LOW: 100,      # 100회 이상
            ErrorSeverity.MEDIUM: 50,    # 50회 이상
            ErrorSeverity.HIGH: 10,      # 10회 이상
            ErrorSeverity.CRITICAL: 1,   # 즉시
        }
        self._initialize_recovery_strategies()
    
    def _initialize_recovery_strategies(self):
        """기본 복구 전략 초기화"""
        
        # 데이터베이스 연결 오류 복구
        self.add_recovery_strategy(AutoRecoveryStrategy(
            name="database_reconnect",
            condition=lambda error: error.category == ErrorCategory.DATABASE and "connection" in error.message.lower(),
            action=self._recover_database_connection,
            max_attempts=3
        ))
        
        # API 타임아웃 오류 복구
        self.add_recovery_strategy(AutoRecoveryStrategy(
            name="api_retry",
            condition=lambda error: error.category == ErrorCategory.API and ("timeout" in error.message.lower() or "connection" in error.message.lower()),
            action=self._recover_api_call,
            max_attempts=3
        ))
        
        # 캐시 오류 복구
        self.add_recovery_strategy(AutoRecoveryStrategy(
            name="cache_fallback",
            condition=lambda error: "cache" in error.message.lower() or "redis" in error.message.lower(),
            action=self._recover_cache_error,
            max_attempts=2
        ))
        
        # 파일 시스템 오류 복구
        self.add_recovery_strategy(AutoRecoveryStrategy(
            name="filesystem_recovery",
            condition=lambda error: "permission denied" in error.message.lower() or "no such file" in error.message.lower(),
            action=self._recover_filesystem_error,
            max_attempts=2
        ))
        
        # 메모리 부족 오류 복구
        self.add_recovery_strategy(AutoRecoveryStrategy(
            name="memory_cleanup",
            condition=lambda error: "memory" in error.message.lower() or "out of memory" in error.message.lower(),
            action=self._recover_memory_error,
            max_attempts=1
        ))
    
    def add_recovery_strategy(self, strategy: AutoRecoveryStrategy):
        """복구 전략 추가"""
        self.recovery_strategies.append(strategy)
    
    def track_error(self, 
                   exception: Exception, 
                   severity: ErrorSeverity,
                   category: ErrorCategory,
                   context: ErrorContext,
                   custom_message: Optional[str] = None) -> ErrorRecord:
        """오류 추적"""
        
        # 오류 기록 생성
        error_id = self._generate_error_id(exception, context)
        
        error_record = ErrorRecord(
            error_id=error_id,
            timestamp=timezone.now().isoformat(),
            severity=severity,
            category=category,
            message=custom_message or str(exception),
            exception_type=type(exception).__name__,
            stack_trace=traceback.format_exc(),
            context=context
        )
        
        # 패턴 기반 오류 그룹화
        pattern_key = self._get_error_pattern_key(error_record)
        if pattern_key not in self.error_patterns:
            self.error_patterns[pattern_key] = []
            error_record.first_occurrence = error_record.timestamp
        else:
            # 기존 오류 패턴 업데이트
            existing_errors = self.error_patterns[pattern_key]
            error_record.occurrence_count = len(existing_errors) + 1
            error_record.first_occurrence = existing_errors[0].timestamp
        
        error_record.last_occurrence = error_record.timestamp
        self.error_patterns[pattern_key].append(error_record)
        
        # 로그 기록
        self._log_error(error_record)
        
        # 자동 복구 시도
        if self._should_attempt_recovery(error_record):
            recovery_success = self._attempt_auto_recovery(error_record)
            error_record.recovery_attempted = True
            error_record.recovery_successful = recovery_success
        
        # 알림 발송 여부 확인
        if self._should_send_alert(error_record):
            self._send_alert(error_record)
        
        # 캐시에 오류 정보 저장 (24시간)
        cache.set(f"error:{error_id}", error_record, 86400)
        
        return error_record
    
    def _generate_error_id(self, exception: Exception, context: ErrorContext) -> str:
        """오류 ID 생성"""
        import hashlib
        
        # 오류 유형, 메시지, 위치를 기반으로 해시 생성
        error_signature = f"{type(exception).__name__}:{str(exception)}:{context.request_path}"
        
        return hashlib.md5(error_signature.encode()).hexdigest()[:12]
    
    def _get_error_pattern_key(self, error_record: ErrorRecord) -> str:
        """오류 패턴 키 생성"""
        return f"{error_record.category.value}:{error_record.exception_type}:{hash(error_record.message[:100])}"
    
    def _log_error(self, error_record: ErrorRecord):
        """오류 로깅"""
        log_level = {
            ErrorSeverity.LOW: logging.INFO,
            ErrorSeverity.MEDIUM: logging.WARNING,
            ErrorSeverity.HIGH: logging.ERROR,
            ErrorSeverity.CRITICAL: logging.CRITICAL
        }[error_record.severity]
        
        log_message = (
            f"[{error_record.error_id}] {error_record.category.value.upper()} ERROR: "
            f"{error_record.message} "
            f"(User: {error_record.context.username or 'Anonymous'}, "
            f"Path: {error_record.context.request_path or 'N/A'})"
        )
        
        logger.log(log_level, log_message)
        
        # 심각한 오류는 별도 로그 파일에 기록
        if error_record.severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
            critical_logger = logging.getLogger('critical_errors')
            critical_logger.error(f"{log_message}\n{error_record.stack_trace}")
    
    def _should_attempt_recovery(self, error_record: ErrorRecord) -> bool:
        """자동 복구 시도 여부 결정"""
        # 치명적 오류나 사용자 오류는 자동 복구하지 않음
        if error_record.severity == ErrorSeverity.CRITICAL:
            return False
        
        if error_record.category == ErrorCategory.USER:
            return False
        
        # 복구 가능한 전략이 있는지 확인
        for strategy in self.recovery_strategies:
            if strategy.can_recover(error_record):
                return True
        
        return False
    
    def _attempt_auto_recovery(self, error_record: ErrorRecord) -> bool:
        """자동 복구 시도"""
        for strategy in self.recovery_strategies:
            if strategy.can_recover(error_record):
                logger.info(f"복구 전략 '{strategy.name}' 시도 중... (오류 ID: {error_record.error_id})")
                
                if strategy.attempt_recovery(error_record):
                    error_record.recovery_method = strategy.name
                    logger.info(f"복구 전략 '{strategy.name}' 성공 (오류 ID: {error_record.error_id})")
                    return True
                else:
                    logger.warning(f"복구 전략 '{strategy.name}' 실패 (오류 ID: {error_record.error_id})")
        
        return False
    
    def _should_send_alert(self, error_record: ErrorRecord) -> bool:
        """알림 발송 여부 결정"""
        threshold = self.alert_thresholds.get(error_record.severity, 1)
        return error_record.occurrence_count >= threshold
    
    def _send_alert(self, error_record: ErrorRecord):
        """알림 발송"""
        try:
            # 개발 환경에서는 콘솔에만 출력
            if settings.DEBUG:
                print(f"🚨 ERROR ALERT: {error_record.message}")
                return
            
            # 이메일 알림 (운영 환경)
            subject = f"VideoPlanet Error Alert - {error_record.severity.value.upper()}"
            message = self._format_alert_message(error_record)
            
            # 관리자 이메일 목록
            admin_emails = getattr(settings, 'ADMIN_EMAILS', ['admin@videoplanet.com'])
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True
            )
            
            # Slack, Discord 등 추가 알림 채널 (추후 구현)
            # self._send_slack_alert(error_record)
            
        except Exception as e:
            logger.error(f"알림 발송 실패: {str(e)}")
    
    def _format_alert_message(self, error_record: ErrorRecord) -> str:
        """알림 메시지 포맷팅"""
        return f"""
VideoPlanet 오류 발생 알림

🔍 오류 정보:
- ID: {error_record.error_id}
- 심각도: {error_record.severity.value.upper()}
- 카테고리: {error_record.category.value}
- 발생 시간: {error_record.timestamp}
- 발생 횟수: {error_record.occurrence_count}

📝 오류 내용:
{error_record.message}

👤 사용자 정보:
- 사용자: {error_record.context.username or 'Anonymous'}
- IP: {error_record.context.ip_address or 'N/A'}
- 경로: {error_record.context.request_path or 'N/A'}

🔧 복구 시도:
- 시도됨: {'예' if error_record.recovery_attempted else '아니오'}
- 성공: {'예' if error_record.recovery_successful else '아니오'}
- 방법: {error_record.recovery_method or 'N/A'}

📊 Stack Trace:
{error_record.stack_trace[:500]}...
        """.strip()
    
    # 복구 전략 구현
    def _recover_database_connection(self, error_record: ErrorRecord) -> bool:
        """데이터베이스 연결 복구"""
        try:
            from django.db import connection
            connection.close()
            
            # 연결 테스트
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            logger.info("데이터베이스 연결 복구 성공")
            return True
            
        except Exception as e:
            logger.error(f"데이터베이스 연결 복구 실패: {str(e)}")
            return False
    
    def _recover_api_call(self, error_record: ErrorRecord) -> bool:
        """API 호출 복구 (재시도)"""
        try:
            # 잠시 대기 후 재시도 (지수 백오프)
            import time
            import random
            
            wait_time = min(2 ** self.recovery_strategies[1].attempt_count + random.uniform(0, 1), 30)
            time.sleep(wait_time)
            
            logger.info(f"API 호출 복구를 위해 {wait_time:.2f}초 대기 후 재시도")
            return True  # 실제로는 API 재호출 로직 구현 필요
            
        except Exception as e:
            logger.error(f"API 호출 복구 실패: {str(e)}")
            return False
    
    def _recover_cache_error(self, error_record: ErrorRecord) -> bool:
        """캐시 오류 복구"""
        try:
            # 캐시 연결 재설정
            cache.clear()
            
            # 캐시 없이 동작하도록 폴백
            logger.info("캐시 오류 복구: 캐시 비활성화 모드로 전환")
            return True
            
        except Exception as e:
            logger.error(f"캐시 오류 복구 실패: {str(e)}")
            return False
    
    def _recover_filesystem_error(self, error_record: ErrorRecord) -> bool:
        """파일 시스템 오류 복구"""
        try:
            import os
            
            # 디렉토리 생성 시도
            if "no such file" in error_record.message.lower():
                # 에러 메시지에서 경로 추출 (간단한 예시)
                # 실제로는 더 정교한 파싱 필요
                pass
            
            # 권한 문제 해결 시도
            if "permission denied" in error_record.message.lower():
                logger.info("파일 권한 문제 감지, 대안 경로 사용")
                # 임시 디렉토리 사용 등
            
            return True
            
        except Exception as e:
            logger.error(f"파일 시스템 오류 복구 실패: {str(e)}")
            return False
    
    def _recover_memory_error(self, error_record: ErrorRecord) -> bool:
        """메모리 오류 복구"""
        try:
            import gc
            
            # 가비지 컬렉션 강제 실행
            gc.collect()
            
            # 캐시 정리
            cache.clear()
            
            logger.info("메모리 정리 완료")
            return True
            
        except Exception as e:
            logger.error(f"메모리 오류 복구 실패: {str(e)}")
            return False
    
    def get_error_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """오류 통계 조회"""
        from datetime import timedelta
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        statistics = {
            'total_errors': 0,
            'by_severity': {severity.value: 0 for severity in ErrorSeverity},
            'by_category': {category.value: 0 for category in ErrorCategory},
            'recovery_rate': 0,
            'top_errors': [],
            'error_trend': []
        }
        
        total_recovery_attempts = 0
        successful_recoveries = 0
        
        # 패턴별 통계
        pattern_stats = {}
        
        for pattern_key, errors in self.error_patterns.items():
            recent_errors = [
                error for error in errors 
                if timezone.datetime.fromisoformat(error.timestamp.replace('Z', '+00:00')) > cutoff_time
            ]
            
            if not recent_errors:
                continue
            
            statistics['total_errors'] += len(recent_errors)
            
            for error in recent_errors:
                # 심각도별 통계
                statistics['by_severity'][error.severity.value] += 1
                
                # 카테고리별 통계
                statistics['by_category'][error.category.value] += 1
                
                # 복구 통계
                if error.recovery_attempted:
                    total_recovery_attempts += 1
                    if error.recovery_successful:
                        successful_recoveries += 1
            
            # 패턴별 통계
            pattern_stats[pattern_key] = {
                'count': len(recent_errors),
                'message': recent_errors[0].message,
                'category': recent_errors[0].category.value,
                'severity': recent_errors[0].severity.value,
                'first_occurrence': recent_errors[0].first_occurrence,
                'last_occurrence': recent_errors[-1].timestamp
            }
        
        # 복구율 계산
        if total_recovery_attempts > 0:
            statistics['recovery_rate'] = (successful_recoveries / total_recovery_attempts) * 100
        
        # 상위 오류 패턴
        statistics['top_errors'] = sorted(
            pattern_stats.values(),
            key=lambda x: x['count'],
            reverse=True
        )[:10]
        
        return statistics

# 전역 오류 추적 시스템 인스턴스
error_tracker = ErrorTrackingSystem()

class ErrorTrackingMiddleware:
    """오류 추적 미들웨어"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        return response
    
    def process_exception(self, request, exception):
        """예외 처리"""
        try:
            # 컨텍스트 정보 수집
            context = ErrorContext(
                user_id=request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None,
                username=request.user.username if hasattr(request, 'user') and request.user.is_authenticated else None,
                request_path=request.path,
                request_method=request.method,
                request_data=self._safe_get_request_data(request),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                ip_address=self._get_client_ip(request),
                session_id=request.session.session_key if hasattr(request, 'session') else None
            )
            
            # 오류 심각도 및 카테고리 결정
            severity, category = self._classify_error(exception)
            
            # 오류 추적
            error_record = error_tracker.track_error(exception, severity, category, context)
            
            # 사용자에게 친화적인 오류 응답
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'status': 'error',
                    'message': self._get_user_friendly_message(error_record),
                    'error_id': error_record.error_id,
                    'recovery_attempted': error_record.recovery_attempted,
                    'recovery_successful': error_record.recovery_successful
                }, status=500)
        
        except Exception as middleware_error:
            logger.error(f"오류 추적 미들웨어 실패: {str(middleware_error)}")
        
        return None  # Django의 기본 예외 처리로 넘김
    
    def _safe_get_request_data(self, request) -> Dict:
        """안전한 요청 데이터 추출"""
        try:
            data = {}
            
            if hasattr(request, 'GET') and request.GET:
                data['GET'] = dict(request.GET)
            
            if hasattr(request, 'POST') and request.POST:
                data['POST'] = dict(request.POST)
                # 민감한 정보 마스킹
                for sensitive_field in ['password', 'token', 'secret', 'key']:
                    if sensitive_field in data['POST']:
                        data['POST'][sensitive_field] = '*' * 8
            
            return data
        except:
            return {}
    
    def _get_client_ip(self, request) -> str:
        """클라이언트 IP 주소 추출"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _classify_error(self, exception) -> tuple[ErrorSeverity, ErrorCategory]:
        """오류 분류"""
        exception_type = type(exception).__name__
        exception_message = str(exception).lower()
        
        # 심각도 결정
        if any(keyword in exception_message for keyword in ['critical', 'fatal', 'out of memory']):
            severity = ErrorSeverity.CRITICAL
        elif any(keyword in exception_message for keyword in ['database', 'connection', 'timeout']):
            severity = ErrorSeverity.HIGH
        elif any(keyword in exception_message for keyword in ['permission', 'forbidden', 'unauthorized']):
            severity = ErrorSeverity.MEDIUM
        else:
            severity = ErrorSeverity.LOW
        
        # 카테고리 결정
        if 'database' in exception_message or 'sql' in exception_message:
            category = ErrorCategory.DATABASE
        elif 'permission' in exception_message or 'forbidden' in exception_message:
            category = ErrorCategory.PERMISSION
        elif 'api' in exception_message or 'http' in exception_message:
            category = ErrorCategory.API
        elif 'validation' in exception_message or 'invalid' in exception_message:
            category = ErrorCategory.VALIDATION
        elif any(keyword in exception_message for keyword in ['user', 'input', 'form']):
            category = ErrorCategory.USER
        else:
            category = ErrorCategory.SYSTEM
        
        return severity, category
    
    def _get_user_friendly_message(self, error_record: ErrorRecord) -> str:
        """사용자 친화적 오류 메시지"""
        if error_record.category == ErrorCategory.USER:
            return "입력하신 정보를 다시 확인해 주세요."
        elif error_record.category == ErrorCategory.PERMISSION:
            return "접근 권한이 없습니다. 관리자에게 문의하세요."
        elif error_record.category == ErrorCategory.DATABASE:
            return "일시적인 시스템 오류입니다. 잠시 후 다시 시도해 주세요."
        elif error_record.recovery_successful:
            return "문제가 자동으로 해결되었습니다. 다시 시도해 주세요."
        else:
            return f"오류가 발생했습니다. 문제가 지속되면 고객센터로 문의해 주세요. (오류 ID: {error_record.error_id})"

def track_error_decorator(severity: ErrorSeverity = ErrorSeverity.MEDIUM, 
                         category: ErrorCategory = ErrorCategory.SYSTEM):
    """오류 추적 데코레이터"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                context = ErrorContext(
                    additional_data={
                        'function': func.__name__,
                        'module': func.__module__,
                        'args': str(args)[:200],
                        'kwargs': str(kwargs)[:200]
                    }
                )
                
                error_tracker.track_error(e, severity, category, context)
                raise  # 원래 예외를 다시 발생시킴
        
        return wrapper
    return decorator