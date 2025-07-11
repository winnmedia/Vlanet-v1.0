"""
성능 모니터링 및 최적화 도구
"""

import time
import logging
import functools
from datetime import datetime
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils.decorators import method_decorator


logger = logging.getLogger('performance')


class PerformanceMonitor:
    """
    성능 모니터링 클래스
    """
    
    def __init__(self):
        self.metrics = {
            'db_queries': [],
            'cache_hits': 0,
            'cache_misses': 0,
            'slow_requests': [],
            'api_calls': {},
        }
    
    def log_db_query(self, query, duration):
        """데이터베이스 쿼리 로깅"""
        if duration > 0.1:  # 100ms 이상
            self.metrics['db_queries'].append({
                'query': query,
                'duration': duration,
                'timestamp': datetime.now().isoformat()
            })
    
    def log_cache_hit(self):
        """캐시 히트 기록"""
        self.metrics['cache_hits'] += 1
    
    def log_cache_miss(self):
        """캐시 미스 기록"""
        self.metrics['cache_misses'] += 1
    
    def log_slow_request(self, path, duration):
        """느린 요청 기록"""
        if duration > 1.0:  # 1초 이상
            self.metrics['slow_requests'].append({
                'path': path,
                'duration': duration,
                'timestamp': datetime.now().isoformat()
            })
    
    def get_metrics(self):
        """메트릭 반환"""
        return self.metrics.copy()
    
    def reset_metrics(self):
        """메트릭 초기화"""
        self.metrics = {
            'db_queries': [],
            'cache_hits': 0,
            'cache_misses': 0,
            'slow_requests': [],
            'api_calls': {},
        }


# 전역 모니터 인스턴스
monitor = PerformanceMonitor()


# 데코레이터들

def measure_time(func):
    """실행 시간 측정 데코레이터"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        duration = end_time - start_time
        logger.info(f"{func.__name__} 실행 시간: {duration:.3f}초")
        
        return result
    return wrapper


def cache_result(timeout=300, key_prefix=''):
    """결과 캐싱 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 캐시 확인
            cached = cache.get(cache_key)
            if cached is not None:
                monitor.log_cache_hit()
                return cached
            
            # 캐시 미스
            monitor.log_cache_miss()
            result = func(*args, **kwargs)
            
            # 결과 캐싱
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


def optimize_db_queries(func):
    """데이터베이스 쿼리 최적화 데코레이터"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 쿼리 카운트 시작
        initial_queries = len(connection.queries)
        
        result = func(*args, **kwargs)
        
        # 실행된 쿼리 수
        query_count = len(connection.queries) - initial_queries
        
        if query_count > 10:
            logger.warning(f"{func.__name__}에서 {query_count}개의 쿼리 실행됨 (최적화 필요)")
        
        return result
    return wrapper


# 미들웨어

class PerformanceMiddleware:
    """
    요청 성능 측정 미들웨어
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 요청 시작 시간
        start_time = time.time()
        
        # 쿼리 카운트 시작
        initial_queries = len(connection.queries)
        
        response = self.get_response(request)
        
        # 실행 시간 계산
        duration = time.time() - start_time
        
        # 쿼리 수 계산
        query_count = len(connection.queries) - initial_queries
        
        # 느린 요청 로깅
        if duration > 1.0:
            monitor.log_slow_request(request.path, duration)
            logger.warning(f"느린 요청: {request.path} ({duration:.2f}초, {query_count}개 쿼리)")
        
        # 응답 헤더에 성능 정보 추가 (디버그 모드에서만)
        if settings.DEBUG:
            response['X-Response-Time'] = f"{duration:.3f}"
            response['X-DB-Query-Count'] = str(query_count)
        
        return response


# 쿼리 최적화 도구

def analyze_queries():
    """
    실행된 쿼리 분석
    """
    from django.db import connection
    from collections import defaultdict
    
    query_stats = defaultdict(lambda: {'count': 0, 'total_time': 0})
    
    for query in connection.queries:
        sql = query['sql']
        time = float(query.get('time', 0))
        
        # 테이블명 추출
        table_name = 'unknown'
        if 'FROM' in sql:
            parts = sql.split('FROM')[1].split()
            if parts:
                table_name = parts[0].strip('"').strip('`')
        
        query_stats[table_name]['count'] += 1
        query_stats[table_name]['total_time'] += time
    
    # 결과 출력
    print("\n📊 쿼리 분석 결과:")
    print("-" * 80)
    print(f"{'테이블':<30} {'쿼리 수':<10} {'총 시간(초)':<15} {'평균 시간(초)':<15}")
    print("-" * 80)
    
    for table, stats in sorted(query_stats.items(), 
                               key=lambda x: x[1]['total_time'], 
                               reverse=True):
        avg_time = stats['total_time'] / stats['count'] if stats['count'] > 0 else 0
        print(f"{table:<30} {stats['count']:<10} "
              f"{stats['total_time']:<15.3f} {avg_time:<15.3f}")
    
    total_queries = sum(s['count'] for s in query_stats.values())
    total_time = sum(s['total_time'] for s in query_stats.values())
    
    print("-" * 80)
    print(f"{'총계':<30} {total_queries:<10} {total_time:<15.3f}")
    print("\n💡 최적화 제안:")
    
    # 최적화 제안
    for table, stats in query_stats.items():
        if stats['count'] > 10:
            print(f"  - {table}: select_related() 또는 prefetch_related() 사용 고려")
        if stats['total_time'] > 0.5:
            print(f"  - {table}: 인덱스 추가 고려")


# 캐시 워밍

def warm_cache():
    """
    자주 사용되는 데이터를 미리 캐싱
    """
    from projects.models import Project
    from users.models import User
    
    print("🔥 캐시 워밍 시작...")
    
    # 활성 프로젝트 캐싱
    active_projects = Project.objects.filter(
        is_active=True
    ).select_related('user', 'feedback').prefetch_related('member_list')
    
    for project in active_projects:
        cache_key = f"project:{project.id}"
        cache.set(cache_key, project, 3600)
    
    print(f"✅ {active_projects.count()}개 프로젝트 캐싱 완료")
    
    # 활성 사용자 캐싱
    active_users = User.objects.filter(
        is_active=True,
        last_login__isnull=False
    )
    
    for user in active_users:
        cache_key = f"user:{user.id}"
        cache.set(cache_key, user, 3600)
    
    print(f"✅ {active_users.count()}명 사용자 캐싱 완료")


# 성능 테스트

def load_test(url, num_requests=100, num_concurrent=10):
    """
    간단한 부하 테스트
    """
    import concurrent.futures
    import requests
    
    print(f"🚀 부하 테스트 시작: {url}")
    print(f"   요청 수: {num_requests}")
    print(f"   동시 연결: {num_concurrent}")
    
    def make_request():
        start = time.time()
        try:
            response = requests.get(url, timeout=30)
            duration = time.time() - start
            return {
                'status': response.status_code,
                'duration': duration,
                'success': response.status_code == 200
            }
        except Exception as e:
            return {
                'status': 0,
                'duration': time.time() - start,
                'success': False,
                'error': str(e)
            }
    
    # 동시 실행
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(make_request) for _ in range(num_requests)]
        
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
    
    # 결과 분석
    successful = sum(1 for r in results if r['success'])
    failed = num_requests - successful
    durations = [r['duration'] for r in results if r['success']]
    
    if durations:
        avg_duration = sum(durations) / len(durations)
        min_duration = min(durations)
        max_duration = max(durations)
    else:
        avg_duration = min_duration = max_duration = 0
    
    print("\n📊 테스트 결과:")
    print(f"   성공: {successful}/{num_requests} ({successful/num_requests*100:.1f}%)")
    print(f"   실패: {failed}")
    print(f"   평균 응답 시간: {avg_duration:.3f}초")
    print(f"   최소 응답 시간: {min_duration:.3f}초")
    print(f"   최대 응답 시간: {max_duration:.3f}초")
    print(f"   처리량: {successful/sum(durations):.1f} req/sec" if durations else "")


# 데이터베이스 인덱스 제안

def suggest_indexes():
    """
    인덱스 추가 제안
    """
    suggestions = []
    
    # 자주 조회되는 필드 확인
    common_lookups = {
        'projects.Project': ['user', 'created', 'is_active'],
        'feedbacks.FeedBack': ['project', 'created'],
        'feedbacks.FeedBackItem': ['feedback', 'user', 'created'],
        'users.User': ['email', 'username', 'is_active'],
    }
    
    for model_path, fields in common_lookups.items():
        app_label, model_name = model_path.split('.')
        
        for field in fields:
            suggestions.append({
                'model': model_name,
                'field': field,
                'sql': f"CREATE INDEX idx_{model_name.lower()}_{field} "
                      f"ON {app_label}_{model_name.lower()} ({field});"
            })
    
    print("\n🔍 인덱스 추가 제안:")
    for suggestion in suggestions:
        print(f"\n모델: {suggestion['model']}")
        print(f"필드: {suggestion['field']}")
        print(f"SQL: {suggestion['sql']}")
    
    return suggestions


# Sentry 통합 (프로덕션 모니터링)

def setup_sentry():
    """
    Sentry 설정
    """
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                DjangoIntegration(),
                RedisIntegration(),
            ],
            traces_sample_rate=0.1,  # 10% 샘플링
            send_default_pii=False,  # 개인정보 전송 안함
            environment=settings.ENVIRONMENT,
            release=settings.VERSION,
            
            # 성능 모니터링
            profiles_sample_rate=0.1,
            
            # 필터링
            before_send=lambda event, hint: event if not settings.DEBUG else None,
            
            # 무시할 에러
            ignore_errors=[
                'KeyboardInterrupt',
                'SystemExit',
                'Http404',
            ],
        )
        
        logger.info("Sentry 모니터링 활성화됨")