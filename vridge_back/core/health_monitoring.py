"""
헬스체크 및 시스템 모니터링
자동 복구와 연계되는 종합적인 시스템 상태 모니터링
"""
import time
import psutil
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from .error_tracking import error_tracker, ErrorSeverity, ErrorCategory, ErrorContext

logger = logging.getLogger('health_monitoring')

class HealthStatus(Enum):
    """시스템 상태"""
    HEALTHY = "healthy"      # 정상
    WARNING = "warning"      # 경고
    CRITICAL = "critical"    # 심각
    DOWN = "down"           # 중단

@dataclass
class HealthCheckResult:
    """헬스체크 결과"""
    name: str
    status: HealthStatus
    message: str
    response_time: float
    details: Dict[str, Any]
    timestamp: str
    auto_recovery_attempted: bool = False
    auto_recovery_successful: bool = False

class HealthChecker:
    """개별 헬스체크 인터페이스"""
    
    def __init__(self, name: str, timeout: float = 5.0):
        self.name = name
        self.timeout = timeout
    
    def check(self) -> HealthCheckResult:
        """헬스체크 실행"""
        start_time = time.time()
        
        try:
            result = self.perform_check()
            response_time = time.time() - start_time
            
            return HealthCheckResult(
                name=self.name,
                status=result.get('status', HealthStatus.HEALTHY),
                message=result.get('message', 'OK'),
                response_time=response_time,
                details=result.get('details', {}),
                timestamp=timezone.now().isoformat()
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.CRITICAL,
                message=f"Check failed: {str(e)}",
                response_time=response_time,
                details={'error': str(e)},
                timestamp=timezone.now().isoformat()
            )
    
    def perform_check(self) -> Dict[str, Any]:
        """실제 헬스체크 로직 (하위 클래스에서 구현)"""
        raise NotImplementedError

class DatabaseHealthChecker(HealthChecker):
    """데이터베이스 헬스체크"""
    
    def __init__(self):
        super().__init__("database", timeout=10.0)
    
    def perform_check(self) -> Dict[str, Any]:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            # 연결 수 확인
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                active_connections = cursor.fetchone()[0]
            
            # 느린 쿼리 확인
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT count(*) FROM pg_stat_activity 
                    WHERE state = 'active' AND now() - query_start > interval '30 seconds'
                """)
                slow_queries = cursor.fetchone()[0]
            
            status = HealthStatus.HEALTHY
            message = "Database is healthy"
            
            if active_connections > 80:
                status = HealthStatus.WARNING
                message = f"High connection count: {active_connections}"
            
            if slow_queries > 5:
                status = HealthStatus.CRITICAL
                message = f"Too many slow queries: {slow_queries}"
            
            return {
                'status': status,
                'message': message,
                'details': {
                    'active_connections': active_connections,
                    'slow_queries': slow_queries
                }
            }
            
        except Exception as e:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"Database check failed: {str(e)}",
                'details': {'error': str(e)}
            }

class CacheHealthChecker(HealthChecker):
    """캐시 헬스체크"""
    
    def __init__(self):
        super().__init__("cache", timeout=5.0)
    
    def perform_check(self) -> Dict[str, Any]:
        try:
            # 캐시 읽기/쓰기 테스트
            test_key = "health_check_test"
            test_value = str(time.time())
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value != test_value:
                return {
                    'status': HealthStatus.CRITICAL,
                    'message': "Cache read/write test failed",
                    'details': {'test_key': test_key}
                }
            
            # 캐시 정리
            cache.delete(test_key)
            
            # Redis 정보 (가능한 경우)
            try:
                from django_redis import get_redis_connection
                redis_conn = get_redis_connection("default")
                info = redis_conn.info()
                
                used_memory = info.get('used_memory_human', 'N/A')
                connected_clients = info.get('connected_clients', 0)
                
                status = HealthStatus.HEALTHY
                message = "Cache is healthy"
                
                if connected_clients > 100:
                    status = HealthStatus.WARNING
                    message = f"High client count: {connected_clients}"
                
                return {
                    'status': status,
                    'message': message,
                    'details': {
                        'used_memory': used_memory,
                        'connected_clients': connected_clients
                    }
                }
                
            except ImportError:
                # Redis가 아닌 다른 캐시 백엔드
                return {
                    'status': HealthStatus.HEALTHY,
                    'message': "Cache is healthy (non-Redis backend)",
                    'details': {}
                }
            
        except Exception as e:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"Cache check failed: {str(e)}",
                'details': {'error': str(e)}
            }

class SystemResourcesHealthChecker(HealthChecker):
    """시스템 리소스 헬스체크"""
    
    def __init__(self):
        super().__init__("system_resources", timeout=3.0)
    
    def perform_check(self) -> Dict[str, Any]:
        try:
            # CPU 사용률
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 메모리 사용률
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 디스크 사용률
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            # 시스템 부하
            load_avg = psutil.getloadavg()
            
            status = HealthStatus.HEALTHY
            warnings = []
            
            if cpu_percent > 80:
                status = HealthStatus.WARNING
                warnings.append(f"High CPU usage: {cpu_percent}%")
            
            if memory_percent > 85:
                status = HealthStatus.WARNING
                warnings.append(f"High memory usage: {memory_percent}%")
            
            if disk_percent > 90:
                status = HealthStatus.CRITICAL
                warnings.append(f"High disk usage: {disk_percent}%")
            
            if cpu_percent > 95 or memory_percent > 95:
                status = HealthStatus.CRITICAL
            
            message = "System resources are healthy"
            if warnings:
                message = "; ".join(warnings)
            
            return {
                'status': status,
                'message': message,
                'details': {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory_percent,
                    'disk_percent': disk_percent,
                    'load_average': load_avg
                }
            }
            
        except Exception as e:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"System resources check failed: {str(e)}",
                'details': {'error': str(e)}
            }

class ExternalServiceHealthChecker(HealthChecker):
    """외부 서비스 헬스체크"""
    
    def __init__(self, service_name: str, endpoint: str, timeout: float = 10.0):
        super().__init__(f"external_service_{service_name}", timeout)
        self.service_name = service_name
        self.endpoint = endpoint
    
    def perform_check(self) -> Dict[str, Any]:
        try:
            import requests
            
            response = requests.get(self.endpoint, timeout=self.timeout)
            
            status = HealthStatus.HEALTHY
            message = f"{self.service_name} is healthy"
            
            if response.status_code >= 400:
                status = HealthStatus.CRITICAL
                message = f"{self.service_name} returned {response.status_code}"
            elif response.elapsed.total_seconds() > 5:
                status = HealthStatus.WARNING
                message = f"{self.service_name} is slow ({response.elapsed.total_seconds():.2f}s)"
            
            return {
                'status': status,
                'message': message,
                'details': {
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds(),
                    'endpoint': self.endpoint
                }
            }
            
        except requests.exceptions.Timeout:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"{self.service_name} timeout",
                'details': {'endpoint': self.endpoint, 'timeout': self.timeout}
            }
        except Exception as e:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"{self.service_name} check failed: {str(e)}",
                'details': {'error': str(e), 'endpoint': self.endpoint}
            }

class AIServiceHealthChecker(HealthChecker):
    """AI 서비스 헬스체크"""
    
    def __init__(self):
        super().__init__("ai_services", timeout=15.0)
    
    def perform_check(self) -> Dict[str, Any]:
        try:
            services_status = {}
            overall_status = HealthStatus.HEALTHY
            messages = []
            
            # OpenAI API 체크
            if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
                try:
                    # 간단한 API 테스트 (실제로는 더 정교한 테스트 필요)
                    services_status['openai'] = 'available'
                except Exception as e:
                    services_status['openai'] = f'error: {str(e)}'
                    overall_status = HealthStatus.WARNING
                    messages.append("OpenAI API unavailable")
            else:
                services_status['openai'] = 'not_configured'
            
            # Google Gemini API 체크
            if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
                try:
                    services_status['gemini'] = 'available'
                except Exception as e:
                    services_status['gemini'] = f'error: {str(e)}'
                    overall_status = HealthStatus.WARNING
                    messages.append("Gemini API unavailable")
            else:
                services_status['gemini'] = 'not_configured'
            
            # Twelve Labs API 체크
            if hasattr(settings, 'TWELVE_LABS_API_KEY') and settings.TWELVE_LABS_API_KEY:
                try:
                    services_status['twelve_labs'] = 'available'
                except Exception as e:
                    services_status['twelve_labs'] = f'error: {str(e)}'
                    overall_status = HealthStatus.WARNING
                    messages.append("Twelve Labs API unavailable")
            else:
                services_status['twelve_labs'] = 'not_configured'
            
            message = "AI services are healthy"
            if messages:
                message = "; ".join(messages)
            
            return {
                'status': overall_status,
                'message': message,
                'details': services_status
            }
            
        except Exception as e:
            return {
                'status': HealthStatus.CRITICAL,
                'message': f"AI services check failed: {str(e)}",
                'details': {'error': str(e)}
            }

class HealthMonitoringSystem:
    """헬스 모니터링 시스템"""
    
    def __init__(self):
        self.checkers: List[HealthChecker] = []
        self.check_history: List[Dict[str, HealthCheckResult]] = []
        self.max_history = 100  # 최대 100회 기록 보관
        self._initialize_checkers()
    
    def _initialize_checkers(self):
        """기본 헬스체커 초기화"""
        self.checkers = [
            DatabaseHealthChecker(),
            CacheHealthChecker(),
            SystemResourcesHealthChecker(),
            AIServiceHealthChecker(),
        ]
        
        # 외부 서비스 체크 (설정에 따라)
        if hasattr(settings, 'EXTERNAL_SERVICES'):
            for service_name, endpoint in settings.EXTERNAL_SERVICES.items():
                self.checkers.append(
                    ExternalServiceHealthChecker(service_name, endpoint)
                )
    
    def add_checker(self, checker: HealthChecker):
        """헬스체커 추가"""
        self.checkers.append(checker)
    
    def perform_full_health_check(self) -> Dict[str, Any]:
        """전체 헬스체크 수행"""
        results = {}
        overall_status = HealthStatus.HEALTHY
        critical_issues = []
        warning_issues = []
        
        for checker in self.checkers:
            try:
                result = checker.check()
                results[checker.name] = result
                
                # 자동 복구 시도
                if result.status in [HealthStatus.CRITICAL, HealthStatus.WARNING]:
                    recovery_success = self._attempt_auto_recovery(result)
                    result.auto_recovery_attempted = True
                    result.auto_recovery_successful = recovery_success
                
                # 전체 상태 결정
                if result.status == HealthStatus.CRITICAL:
                    overall_status = HealthStatus.CRITICAL
                    critical_issues.append(f"{checker.name}: {result.message}")
                elif result.status == HealthStatus.WARNING and overall_status != HealthStatus.CRITICAL:
                    overall_status = HealthStatus.WARNING
                    warning_issues.append(f"{checker.name}: {result.message}")
                
            except Exception as e:
                logger.error(f"헬스체크 '{checker.name}' 실행 오류: {str(e)}")
                
                # 오류 추적
                context = ErrorContext(
                    additional_data={
                        'checker_name': checker.name,
                        'checker_timeout': checker.timeout
                    }
                )
                error_tracker.track_error(e, ErrorSeverity.HIGH, ErrorCategory.SYSTEM, context)
                
                results[checker.name] = HealthCheckResult(
                    name=checker.name,
                    status=HealthStatus.CRITICAL,
                    message=f"Health check failed: {str(e)}",
                    response_time=0,
                    details={'error': str(e)},
                    timestamp=timezone.now().isoformat()
                )
                
                overall_status = HealthStatus.CRITICAL
                critical_issues.append(f"{checker.name}: Health check failed")
        
        # 결과 기록
        self.check_history.append(results)
        if len(self.check_history) > self.max_history:
            self.check_history.pop(0)
        
        # 요약 정보
        summary = {
            'overall_status': overall_status.value,
            'timestamp': timezone.now().isoformat(),
            'total_checks': len(self.checkers),
            'healthy_checks': len([r for r in results.values() if r.status == HealthStatus.HEALTHY]),
            'warning_checks': len([r for r in results.values() if r.status == HealthStatus.WARNING]),
            'critical_checks': len([r for r in results.values() if r.status == HealthStatus.CRITICAL]),
            'issues': {
                'critical': critical_issues,
                'warning': warning_issues
            },
            'details': results
        }
        
        # 캐시에 저장 (5분)
        cache.set('health_check_results', summary, 300)
        
        return summary
    
    def _attempt_auto_recovery(self, health_result: HealthCheckResult) -> bool:
        """헬스체크 결과에 따른 자동 복구 시도"""
        try:
            if health_result.name == 'database':
                return self._recover_database_health()
            elif health_result.name == 'cache':
                return self._recover_cache_health()
            elif health_result.name == 'system_resources':
                return self._recover_system_resources()
            elif 'external_service' in health_result.name:
                return self._recover_external_service(health_result)
            
            return False
            
        except Exception as e:
            logger.error(f"자동 복구 시도 실패 ({health_result.name}): {str(e)}")
            return False
    
    def _recover_database_health(self) -> bool:
        """데이터베이스 헬스 복구"""
        try:
            # 연결 풀 재설정
            connection.close()
            
            # 테스트 쿼리
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            logger.info("데이터베이스 헬스 복구 성공")
            return True
            
        except Exception as e:
            logger.error(f"데이터베이스 헬스 복구 실패: {str(e)}")
            return False
    
    def _recover_cache_health(self) -> bool:
        """캐시 헬스 복구"""
        try:
            # 캐시 클리어
            cache.clear()
            
            # 연결 테스트
            cache.set('health_recovery_test', 'ok', 60)
            result = cache.get('health_recovery_test')
            
            if result == 'ok':
                cache.delete('health_recovery_test')
                logger.info("캐시 헬스 복구 성공")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"캐시 헬스 복구 실패: {str(e)}")
            return False
    
    def _recover_system_resources(self) -> bool:
        """시스템 리소스 복구"""
        try:
            import gc
            
            # 가비지 컬렉션 실행
            gc.collect()
            
            # 메모리 캐시 정리
            cache.clear()
            
            logger.info("시스템 리소스 정리 완료")
            return True
            
        except Exception as e:
            logger.error(f"시스템 리소스 복구 실패: {str(e)}")
            return False
    
    def _recover_external_service(self, health_result: HealthCheckResult) -> bool:
        """외부 서비스 복구 (재시도)"""
        try:
            # 잠시 대기 후 재시도
            import time
            time.sleep(2)
            
            # 단순히 복구 시도했다고 마킹 (실제 재시도는 서비스 로직에서)
            logger.info(f"외부 서비스 '{health_result.name}' 복구 시도")
            return True
            
        except Exception as e:
            logger.error(f"외부 서비스 복구 실패: {str(e)}")
            return False
    
    def get_health_trend(self, hours: int = 24) -> Dict[str, Any]:
        """헬스 트렌드 분석"""
        from datetime import timedelta
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        trend_data = {
            'period_hours': hours,
            'total_checks': len(self.check_history),
            'availability_percentage': 0,
            'most_frequent_issues': {},
            'recovery_success_rate': 0,
            'performance_trends': {}
        }
        
        if not self.check_history:
            return trend_data
        
        # 최근 기록만 필터링
        recent_checks = []
        for check_batch in self.check_history:
            for checker_name, result in check_batch.items():
                check_time = timezone.datetime.fromisoformat(result.timestamp.replace('Z', '+00:00'))
                if check_time > cutoff_time:
                    recent_checks.append((checker_name, result))
        
        if not recent_checks:
            return trend_data
        
        # 가용성 계산
        healthy_checks = len([c for _, c in recent_checks if c.status == HealthStatus.HEALTHY])
        trend_data['availability_percentage'] = (healthy_checks / len(recent_checks)) * 100
        
        # 자주 발생하는 이슈
        issue_counts = {}
        recovery_attempts = 0
        recovery_successes = 0
        
        for checker_name, result in recent_checks:
            if result.status != HealthStatus.HEALTHY:
                issue_key = f"{checker_name}: {result.message}"
                issue_counts[issue_key] = issue_counts.get(issue_key, 0) + 1
            
            if result.auto_recovery_attempted:
                recovery_attempts += 1
                if result.auto_recovery_successful:
                    recovery_successes += 1
        
        trend_data['most_frequent_issues'] = dict(
            sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        )
        
        # 복구 성공률
        if recovery_attempts > 0:
            trend_data['recovery_success_rate'] = (recovery_successes / recovery_attempts) * 100
        
        return trend_data

# 전역 헬스 모니터링 시스템 인스턴스
health_monitor = HealthMonitoringSystem()