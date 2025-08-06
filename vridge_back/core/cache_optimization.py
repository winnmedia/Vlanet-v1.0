"""
VideoPlanet 캐시 최적화 모듈
Redis를 활용한 고급 캐싱 전략 구현
"""

import hashlib
import json
import pickle
from typing import Any, Optional, Callable, Union
from functools import wraps
from datetime import timedelta

from django.core.cache import cache
from django.core.cache.backends.base import DEFAULT_TIMEOUT
from django.conf import settings
from django.utils import timezone
from django.db.models import QuerySet, Model
import logging

logger = logging.getLogger(__name__)

# 캐시 TTL 설정
CACHE_TTL = {
    'short': 60,          # 1분
    'medium': 300,        # 5분
    'long': 3600,         # 1시간
    'day': 86400,         # 24시간
    'week': 604800        # 7일
}


class CacheKeyGenerator:
    """캐시 키 생성 클래스"""
    
    @staticmethod
    def generate_key(prefix: str, *args, **kwargs) -> str:
        """일관된 캐시 키 생성"""
        key_parts = [prefix]
        
        # 인자를 문자열로 변환
        for arg in args:
            if isinstance(arg, (Model, QuerySet)):
                key_parts.append(str(arg.__class__.__name__))
                if hasattr(arg, 'pk'):
                    key_parts.append(str(arg.pk))
            else:
                key_parts.append(str(arg))
                
        # 키워드 인자 처리
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            kwargs_str = '_'.join([f"{k}={v}" for k, v in sorted_kwargs])
            key_parts.append(kwargs_str)
            
        # 키 길이가 너무 길면 해시화
        full_key = ':'.join(key_parts)
        if len(full_key) > 250:
            hash_suffix = hashlib.md5(full_key.encode()).hexdigest()[:8]
            full_key = f"{full_key[:200]}_{hash_suffix}"
            
        return full_key
        
    @staticmethod
    def generate_queryset_key(queryset: QuerySet) -> str:
        """쿼리셋을 위한 특별한 키 생성"""
        model_name = queryset.model.__name__
        query_str = str(queryset.query)
        query_hash = hashlib.md5(query_str.encode()).hexdigest()[:16]
        return f"qs:{model_name}:{query_hash}"


class SmartCache:
    """지능형 캐싱 클래스"""
    
    def __init__(self):
        self.cache = cache
        self.stats = {'hits': 0, 'misses': 0}
        
    def get_or_set(self, key: str, func: Callable, timeout: int = None,
                   version: int = None, force_refresh: bool = False) -> Any:
        """캐시에서 가져오거나 설정"""
        if force_refresh:
            value = None
        else:
            value = self.cache.get(key, version=version)
            
        if value is None:
            self.stats['misses'] += 1
            value = func()
            if value is not None:
                self.cache.set(key, value, timeout or CACHE_TTL['medium'], version=version)
                logger.debug(f"Cache miss and set: {key}")
        else:
            self.stats['hits'] += 1
            logger.debug(f"Cache hit: {key}")
            
        return value
        
    def delete_pattern(self, pattern: str):
        """패턴과 일치하는 모든 키 삭제"""
        if hasattr(self.cache, '_cache'):
            # Redis 백엔드
            try:
                from django_redis import get_redis_connection
                con = get_redis_connection("default")
                keys = con.keys(f"*{pattern}*")
                if keys:
                    con.delete(*keys)
                    logger.info(f"Deleted {len(keys)} cache keys matching pattern: {pattern}")
                    return len(keys)
            except Exception as e:
                logger.error(f"Failed to delete cache pattern {pattern}: {e}")
        return 0
        
    def get_stats(self) -> dict:
        """캐시 통계 반환"""
        total = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total * 100) if total > 0 else 0
        return {
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'total': total,
            'hit_rate': hit_rate
        }


# 싱글톤 인스턴스
smart_cache = SmartCache()


def cache_result(timeout: Union[int, str] = 'medium', 
                key_prefix: str = None,
                vary_on_user: bool = False):
    """함수 결과를 캐싱하는 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 키 생성
            if key_prefix:
                cache_key = key_prefix
            else:
                cache_key = f"{func.__module__}.{func.__name__}"
                
            # 사용자별 캐싱
            if vary_on_user and 'request' in kwargs:
                request = kwargs['request']
                if hasattr(request, 'user') and request.user.is_authenticated:
                    cache_key = f"{cache_key}:user_{request.user.id}"
                    
            # 인자 기반 키 생성
            cache_key = CacheKeyGenerator.generate_key(cache_key, *args, **kwargs)
            
            # timeout 처리
            if isinstance(timeout, str):
                actual_timeout = CACHE_TTL.get(timeout, CACHE_TTL['medium'])
            else:
                actual_timeout = timeout
                
            # 캐시에서 가져오거나 실행
            return smart_cache.get_or_set(
                cache_key,
                lambda: func(*args, **kwargs),
                timeout=actual_timeout
            )
            
        return wrapper
    return decorator


def cache_queryset(timeout: Union[int, str] = 'medium'):
    """쿼리셋 결과를 캐싱하는 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            queryset = func(self, *args, **kwargs)
            
            # 쿼리셋에 대한 유니크 키 생성
            cache_key = CacheKeyGenerator.generate_queryset_key(queryset)
            
            # timeout 처리
            if isinstance(timeout, str):
                actual_timeout = CACHE_TTL.get(timeout, CACHE_TTL['medium'])
            else:
                actual_timeout = timeout
                
            # 캐시 확인
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"QuerySet cache hit: {cache_key}")
                return cached_result
                
            # 쿼리 실행 및 캐싱
            result = list(queryset)  # 쿼리 실행
            cache.set(cache_key, result, actual_timeout)
            logger.debug(f"QuerySet cached: {cache_key}")
            
            return result
            
        return wrapper
    return decorator


class CacheInvalidator:
    """캐시 무효화 관리 클래스"""
    
    @staticmethod
    def invalidate_model_cache(model_class: type, instance_id: int = None):
        """모델 관련 캐시 무효화"""
        model_name = model_class.__name__
        
        if instance_id:
            # 특정 인스턴스 캐시 삭제
            patterns = [
                f"*{model_name}*{instance_id}*",
                f"*pk={instance_id}*"
            ]
        else:
            # 모든 모델 캐시 삭제
            patterns = [f"*{model_name}*"]
            
        deleted_count = 0
        for pattern in patterns:
            deleted_count += smart_cache.delete_pattern(pattern)
            
        logger.info(f"Invalidated {deleted_count} cache entries for {model_name}")
        return deleted_count
        
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """사용자 관련 모든 캐시 무효화"""
        patterns = [
            f"*user_{user_id}*",
            f"*user_id={user_id}*",
            f"*owner_id={user_id}*"
        ]
        
        deleted_count = 0
        for pattern in patterns:
            deleted_count += smart_cache.delete_pattern(pattern)
            
        logger.info(f"Invalidated {deleted_count} cache entries for user {user_id}")
        return deleted_count
        
    @staticmethod
    def invalidate_project_cache(project_id: int):
        """프로젝트 관련 모든 캐시 무효화"""
        patterns = [
            f"*project_{project_id}*",
            f"*project_id={project_id}*",
            f"*projects*{project_id}*"
        ]
        
        deleted_count = 0
        for pattern in patterns:
            deleted_count += smart_cache.delete_pattern(pattern)
            
        logger.info(f"Invalidated {deleted_count} cache entries for project {project_id}")
        return deleted_count


class CacheWarmer:
    """캐시 워밍 클래스 - 미리 캐시를 채워두는 기능"""
    
    @staticmethod
    def warm_user_cache(user_id: int):
        """사용자 관련 데이터 미리 캐싱"""
        from users.models import User
        from projects.models import Project
        
        try:
            user = User.objects.get(id=user_id)
            
            # 사용자 프로필 캐싱
            cache_key = f"user:profile:{user_id}"
            cache.set(cache_key, user, CACHE_TTL['long'])
            
            # 사용자 프로젝트 목록 캐싱
            projects = Project.objects.filter(user=user).select_related('basic_plan')
            cache_key = f"user:projects:{user_id}"
            cache.set(cache_key, list(projects), CACHE_TTL['medium'])
            
            logger.info(f"Warmed cache for user {user_id}")
            return True
            
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found for cache warming")
            return False
            
    @staticmethod
    def warm_project_cache(project_id: int):
        """프로젝트 관련 데이터 미리 캐싱"""
        from projects.models import Project
        from feedbacks.models import Feedback
        
        try:
            project = Project.objects.select_related(
                'user', 'basic_plan'
            ).prefetch_related(
                'members', 'files'
            ).get(id=project_id)
            
            # 프로젝트 상세 캐싱
            cache_key = f"project:detail:{project_id}"
            cache.set(cache_key, project, CACHE_TTL['medium'])
            
            # 프로젝트 피드백 목록 캐싱
            feedbacks = Feedback.objects.filter(
                project=project
            ).select_related('user')
            cache_key = f"project:feedbacks:{project_id}"
            cache.set(cache_key, list(feedbacks), CACHE_TTL['short'])
            
            logger.info(f"Warmed cache for project {project_id}")
            return True
            
        except Project.DoesNotExist:
            logger.error(f"Project {project_id} not found for cache warming")
            return False


class CacheHealthMonitor:
    """캐시 상태 모니터링 클래스"""
    
    @staticmethod
    def check_cache_health() -> dict:
        """캐시 상태 점검"""
        health_status = {
            'is_healthy': False,
            'backend': None,
            'stats': {},
            'errors': []
        }
        
        try:
            # 캐시 연결 테스트
            test_key = 'health_check_test'
            test_value = timezone.now().isoformat()
            cache.set(test_key, test_value, 10)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value == test_value:
                health_status['is_healthy'] = True
                cache.delete(test_key)
            else:
                health_status['errors'].append('Cache read/write test failed')
                
            # 백엔드 정보 확인
            if hasattr(cache, '_cache'):
                health_status['backend'] = cache._cache.__class__.__name__
                
                # Redis인 경우 추가 정보
                if 'Redis' in health_status['backend']:
                    try:
                        from django_redis import get_redis_connection
                        con = get_redis_connection("default")
                        info = con.info()
                        health_status['stats'] = {
                            'used_memory_mb': info.get('used_memory', 0) / 1024 / 1024,
                            'connected_clients': info.get('connected_clients'),
                            'total_connections_received': info.get('total_connections_received'),
                            'keyspace_hits': info.get('keyspace_hits', 0),
                            'keyspace_misses': info.get('keyspace_misses', 0)
                        }
                        
                        # 히트율 계산
                        hits = health_status['stats']['keyspace_hits']
                        misses = health_status['stats']['keyspace_misses']
                        if hits + misses > 0:
                            health_status['stats']['hit_rate'] = (hits / (hits + misses)) * 100
                            
                    except Exception as e:
                        health_status['errors'].append(f'Redis stats error: {str(e)}')
                        
            # 앱 캐시 통계
            health_status['stats']['app_stats'] = smart_cache.get_stats()
            
        except Exception as e:
            health_status['errors'].append(f'Cache health check error: {str(e)}')
            
        return health_status
        
    @staticmethod
    def get_cache_metrics() -> dict:
        """캐시 메트릭 수집"""
        metrics = {
            'timestamp': timezone.now().isoformat(),
            'cache_operations': smart_cache.get_stats(),
            'backend_info': {},
            'top_keys': []
        }
        
        try:
            if hasattr(cache, '_cache') and 'Redis' in cache._cache.__class__.__name__:
                from django_redis import get_redis_connection
                con = get_redis_connection("default")
                
                # 상위 키 패턴 분석
                all_keys = con.keys('*')
                key_patterns = {}
                
                for key in all_keys[:1000]:  # 처음 1000개만 분석
                    key_str = key.decode() if isinstance(key, bytes) else key
                    pattern = key_str.split(':')[0] if ':' in key_str else key_str
                    key_patterns[pattern] = key_patterns.get(pattern, 0) + 1
                    
                # 상위 10개 패턴
                top_patterns = sorted(key_patterns.items(), key=lambda x: x[1], reverse=True)[:10]
                metrics['top_keys'] = [{'pattern': p, 'count': c} for p, c in top_patterns]
                
                # TTL 통계
                ttl_stats = {'no_ttl': 0, 'with_ttl': 0}
                for key in all_keys[:100]:  # 샘플링
                    ttl = con.ttl(key)
                    if ttl == -1:
                        ttl_stats['no_ttl'] += 1
                    else:
                        ttl_stats['with_ttl'] += 1
                        
                metrics['backend_info']['ttl_stats'] = ttl_stats
                
        except Exception as e:
            logger.error(f"Failed to collect cache metrics: {e}")
            
        return metrics