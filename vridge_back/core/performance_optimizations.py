from django.db import connection
from django.core.cache import cache
from django.db.models import Prefetch, F, Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from functools import wraps
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import redis
from typing import List, Dict, Any

class QueryOptimizer:
    """데이터베이스 쿼리 최적화"""
    
    @staticmethod
    def optimize_project_list(user):
        """프로젝트 목록 최적화된 쿼리"""
        from projects.models import Project, Members
        from feedbacks.models import Feedback, FeedbackComment
        
        # 모든 관련 데이터를 한 번의 쿼리로 가져오기
        projects = Project.objects.filter(
            Q(members__user=user) | Q(user=user)
        ).select_related(
            'user',
            'basic_plan',
            'story_board',
            'filming',
            'video_edit',
            'post_work',
            'video_preview',
            'confirmation',
            'video_delivery',
            'feedback',
            'development_framework'
        ).prefetch_related(
            Prefetch(
                'members_set',
                queryset=Members.objects.select_related('user')
            ),
            Prefetch(
                'feedback__comments',
                queryset=FeedbackComment.objects.select_related('user').order_by('-created')[:5]
            ),
            'memo_set',
            'file_set'
        ).annotate(
            total_members=Count('members'),
            total_comments=Count('feedback__comments'),
            latest_activity=Max(
                models.Q(basic_plan__updated) |
                models.Q(feedback__comments__created)
            )
        ).distinct().order_by('-latest_activity')
        
        return projects
    
    @staticmethod
    def bulk_create_optimize(model_class, objects: List[Dict], batch_size: int = 1000):
        """대량 생성 최적화"""
        created_objects = []
        
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            created = model_class.objects.bulk_create(
                [model_class(**obj) for obj in batch],
                batch_size=batch_size,
                ignore_conflicts=True
            )
            created_objects.extend(created)
        
        return created_objects
    
    @staticmethod
    def optimize_feedback_query(project_id):
        """피드백 쿼리 최적화"""
        from feedbacks.models import Feedback, FeedbackComment
        
        feedback = Feedback.objects.select_related(
            'project',
            'project__user'
        ).prefetch_related(
            Prefetch(
                'comments',
                queryset=FeedbackComment.objects.select_related(
                    'user',
                    'parent'
                ).prefetch_related(
                    'replies',
                    'reactions'
                ).order_by('created')
            )
        ).get(project_id=project_id)
        
        return feedback


class CacheManager:
    """고급 캐싱 전략"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )
    
    def cache_result(self, key_prefix: str, timeout: int = 300):
        """결과 캐싱 데코레이터"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # 캐시 키 생성
                cache_key = f"{key_prefix}:{func.__name__}"
                if args:
                    cache_key += f":{':'.join(map(str, args))}"
                if kwargs:
                    cache_key += f":{':'.join(f'{k}={v}' for k, v in sorted(kwargs.items()))}"
                
                # 캐시 확인
                cached = cache.get(cache_key)
                if cached is not None:
                    return cached
                
                # 함수 실행
                result = func(*args, **kwargs)
                
                # 결과 캐싱
                cache.set(cache_key, result, timeout)
                
                return result
            
            return wrapper
        return decorator
    
    def invalidate_pattern(self, pattern: str):
        """패턴 기반 캐시 무효화"""
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)
    
    def get_or_set_many(self, keys_to_functions: Dict[str, callable], timeout: int = 300):
        """여러 키를 한 번에 처리"""
        # 존재하는 캐시 확인
        existing = cache.get_many(keys_to_functions.keys())
        
        # 없는 것들만 계산
        to_set = {}
        for key, func in keys_to_functions.items():
            if key not in existing:
                to_set[key] = func()
        
        # 새로운 값들 저장
        if to_set:
            cache.set_many(to_set, timeout)
        
        # 모든 값 반환
        return {**existing, **to_set}


class AsyncProcessor:
    """비동기 처리 최적화"""
    
    def __init__(self, max_workers: int = 10):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    async def process_batch_async(self, items: List[Any], processor_func: callable):
        """배치 비동기 처리"""
        loop = asyncio.get_event_loop()
        
        # 각 아이템을 비동기로 처리
        tasks = []
        for item in items:
            task = loop.run_in_executor(
                self.executor,
                processor_func,
                item
            )
            tasks.append(task)
        
        # 모든 작업 완료 대기
        results = await asyncio.gather(*tasks)
        
        return results
    
    def process_video_async(self, video_path: str):
        """비디오 처리 비동기화"""
        async def _process():
            # 썸네일 생성
            thumbnail_task = self.generate_thumbnail_async(video_path)
            
            # 메타데이터 추출
            metadata_task = self.extract_metadata_async(video_path)
            
            # 인코딩 준비
            encoding_task = self.prepare_encoding_async(video_path)
            
            # 모든 작업 병렬 실행
            thumbnail, metadata, encoding_ready = await asyncio.gather(
                thumbnail_task,
                metadata_task,
                encoding_task
            )
            
            return {
                'thumbnail': thumbnail,
                'metadata': metadata,
                'encoding_ready': encoding_ready
            }
        
        return asyncio.run(_process())


class DatabaseOptimizer:
    """데이터베이스 최적화"""
    
    @staticmethod
    def add_missing_indexes():
        """누락된 인덱스 추가"""
        with connection.cursor() as cursor:
            # 자주 사용되는 쿼리에 대한 인덱스
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_project_user_created ON projects_project(user_id, created DESC)",
                "CREATE INDEX IF NOT EXISTS idx_feedback_project_created ON feedbacks_feedback(project_id, created DESC)",
                "CREATE INDEX IF NOT EXISTS idx_comment_feedback_created ON feedbacks_feedbackcomment(feedback_id, created DESC)",
                "CREATE INDEX IF NOT EXISTS idx_event_user_type_created ON analytics_userevent(user_id, event_type, created DESC)",
                "CREATE INDEX IF NOT EXISTS idx_session_user_started ON analytics_usersession(user_id, started_at DESC)",
            ]
            
            for index in indexes:
                cursor.execute(index)
    
    @staticmethod
    def vacuum_analyze():
        """데이터베이스 최적화 (PostgreSQL)"""
        with connection.cursor() as cursor:
            cursor.execute("VACUUM ANALYZE")
    
    @staticmethod
    def get_slow_queries(threshold_ms: int = 1000):
        """느린 쿼리 분석"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    max_time
                FROM pg_stat_statements
                WHERE mean_time > %s
                ORDER BY mean_time DESC
                LIMIT 20
            """, [threshold_ms])
            
            return cursor.fetchall()


class MemoryOptimizer:
    """메모리 사용 최적화"""
    
    @staticmethod
    def chunked_queryset(queryset, chunk_size: int = 2000):
        """대용량 쿼리셋 청크 처리"""
        start = 0
        while True:
            chunk = queryset[start:start + chunk_size]
            if not chunk:
                break
            
            yield from chunk
            start += chunk_size
            
            # 메모리 정리
            import gc
            gc.collect()
    
    @staticmethod
    def optimize_file_upload(file_obj, chunk_size: int = 1024 * 1024):
        """파일 업로드 메모리 최적화"""
        import hashlib
        
        hasher = hashlib.sha256()
        total_size = 0
        
        # 청크 단위로 읽기
        for chunk in iter(lambda: file_obj.read(chunk_size), b''):
            hasher.update(chunk)
            total_size += len(chunk)
            
            # 대용량 파일 처리 시 진행률 업데이트
            if total_size % (10 * chunk_size) == 0:
                cache.set(
                    f'upload_progress_{file_obj.name}',
                    {'bytes': total_size, 'status': 'processing'},
                    60
                )
        
        return {
            'size': total_size,
            'checksum': hasher.hexdigest()
        }


class PerformanceMiddleware:
    """성능 모니터링 미들웨어"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 시작 시간
        start_time = time.time()
        
        # SQL 쿼리 카운트 시작
        initial_queries = len(connection.queries)
        
        # 응답 처리
        response = self.get_response(request)
        
        # 측정
        duration = (time.time() - start_time) * 1000  # ms
        query_count = len(connection.queries) - initial_queries
        
        # 헤더에 성능 정보 추가
        response['X-Response-Time'] = f'{duration:.2f}ms'
        response['X-DB-Query-Count'] = str(query_count)
        
        # 느린 요청 로깅
        if duration > 1000:  # 1초 이상
            from analytics.models import PerformanceMetric
            PerformanceMetric.objects.create(
                metric_type='api_response',
                endpoint=request.path,
                duration_ms=duration,
                user=request.user if request.user.is_authenticated else None,
                status_code=response.status_code
            )
        
        return response


# 성능 최적화 체크리스트
PERFORMANCE_CHECKLIST = {
    'database_indexes': True,
    'query_optimization': True,
    'caching_strategy': True,
    'lazy_loading': True,
    'pagination': True,
    'compression': True,
    'cdn_usage': True,
    'async_processing': True,
    'connection_pooling': True,
    'load_balancing': False,  # 추가 인프라 필요
    'horizontal_scaling': False,  # 추가 인프라 필요
    'code_profiling': True,
    'memory_optimization': True,
    'image_optimization': True,
    'minification': True,
}