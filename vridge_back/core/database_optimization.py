"""
VideoPlanet 데이터베이스 최적화 모듈
N+1 문제 해결, 쿼리 최적화, 인덱스 관리
"""

from django.db import models
from django.db.models import Prefetch, Count, Q, F, Sum
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class OptimizedQueryMixin:
    """쿼리 최적화를 위한 믹스인 클래스"""
    
    def get_optimized_queryset(self):
        """최적화된 쿼리셋 반환"""
        queryset = super().get_queryset()
        
        # 모델별 최적화 전략 적용
        model_name = self.model.__name__.lower()
        
        optimization_strategies = {
            'project': self._optimize_project_queryset,
            'feedback': self._optimize_feedback_queryset,
            'user': self._optimize_user_queryset,
            'videoplanning': self._optimize_videoplanning_queryset
        }
        
        if model_name in optimization_strategies:
            queryset = optimization_strategies[model_name](queryset)
            
        return queryset
        
    def _optimize_project_queryset(self, queryset):
        """프로젝트 쿼리셋 최적화"""
        return queryset.select_related(
            'user',
            'basic_plan'
        ).prefetch_related(
            'members',
            'schedule_set',
            Prefetch(
                'files',
                queryset=self.model.files.model.objects.filter(
                    is_deleted=False
                ).only('id', 'file_name', 'file_url', 'created_at')
            )
        ).annotate(
            member_count=Count('members'),
            file_count=Count('files', filter=Q(files__is_deleted=False)),
            schedule_count=Count('schedule_set')
        )
        
    def _optimize_feedback_queryset(self, queryset):
        """피드백 쿼리셋 최적화"""
        return queryset.select_related(
            'user',
            'project'
        ).prefetch_related(
            Prefetch(
                'comments',
                queryset=self.model.comments.model.objects.select_related(
                    'user'
                ).only(
                    'id', 'content', 'time_stamp', 'created_at',
                    'user__id', 'user__name', 'user__profile_image'
                ).order_by('time_stamp')
            ),
            Prefetch(
                'reactions',
                queryset=self.model.reactions.model.objects.select_related(
                    'user'
                ).only('id', 'reaction', 'user__id', 'user__name')
            )
        ).annotate(
            comment_count=Count('comments'),
            reaction_count=Count('reactions')
        )
        
    def _optimize_user_queryset(self, queryset):
        """사용자 쿼리셋 최적화"""
        return queryset.prefetch_related(
            'projects_as_owner',
            'projects_as_member',
            'notifications'
        ).annotate(
            owned_project_count=Count('projects_as_owner'),
            member_project_count=Count('projects_as_member'),
            unread_notification_count=Count(
                'notifications',
                filter=Q(notifications__is_read=False)
            )
        )
        
    def _optimize_videoplanning_queryset(self, queryset):
        """영상 기획 쿼리셋 최적화"""
        return queryset.select_related(
            'user',
            'project'
        ).prefetch_related(
            'images',
            'storyboards'
        ).only(
            'id', 'title', 'genre', 'concept', 'created_at',
            'user__id', 'user__name',
            'project__id', 'project__title'
        )


class CacheOptimizationMixin:
    """캐시 최적화를 위한 믹스인 클래스"""
    
    cache_timeout = 300  # 5분
    
    def get_cached_or_compute(self, cache_key, compute_func, timeout=None):
        """캐시에서 가져오거나 계산 후 캐시에 저장"""
        if timeout is None:
            timeout = self.cache_timeout
            
        result = cache.get(cache_key)
        if result is None:
            result = compute_func()
            cache.set(cache_key, result, timeout)
            logger.debug(f"Cache miss for {cache_key}, computed and cached")
        else:
            logger.debug(f"Cache hit for {cache_key}")
            
        return result
        
    def invalidate_cache_pattern(self, pattern):
        """패턴과 일치하는 캐시 키 무효화"""
        from django.core.cache import cache
        from django.core.cache.backends.base import DEFAULT_TIMEOUT
        
        if hasattr(cache, '_cache'):
            # Redis 백엔드인 경우
            try:
                keys = cache._cache.keys(f"*{pattern}*")
                if keys:
                    cache.delete_many([key.decode() for key in keys])
                    logger.info(f"Invalidated {len(keys)} cache keys matching pattern: {pattern}")
            except Exception as e:
                logger.error(f"Failed to invalidate cache pattern {pattern}: {e}")


class DatabaseIndexManager:
    """데이터베이스 인덱스 관리 클래스"""
    
    @staticmethod
    def create_missing_indexes():
        """누락된 인덱스 생성"""
        from django.db import connection
        
        index_definitions = [
            # 프로젝트 관련 인덱스
            {
                'name': 'idx_project_user_status',
                'table': 'projects_project',
                'columns': ['user_id', 'status'],
                'condition': None
            },
            {
                'name': 'idx_project_created_at',
                'table': 'projects_project',
                'columns': ['created_at'],
                'condition': None
            },
            # 피드백 관련 인덱스
            {
                'name': 'idx_feedback_user_created',
                'table': 'feedbacks_feedback',
                'columns': ['user_id', 'created_at'],
                'condition': None
            },
            {
                'name': 'idx_feedback_project',
                'table': 'feedbacks_feedback',
                'columns': ['project_id'],
                'condition': 'project_id IS NOT NULL'
            },
            # 피드백 코멘트 인덱스
            {
                'name': 'idx_feedback_comment_feedback',
                'table': 'feedbacks_feedbackcomment',
                'columns': ['feedback_id', 'time_stamp'],
                'condition': None
            },
            # 사용자 관련 인덱스
            {
                'name': 'idx_user_email',
                'table': 'users_user',
                'columns': ['email'],
                'condition': None
            },
            {
                'name': 'idx_user_login_method',
                'table': 'users_user',
                'columns': ['login_method'],
                'condition': None
            },
            # 영상 기획 인덱스
            {
                'name': 'idx_videoplanning_user',
                'table': 'video_planning_videoplanning',
                'columns': ['user_id', 'created_at'],
                'condition': None
            }
        ]
        
        created_indexes = []
        
        with connection.cursor() as cursor:
            for index_def in index_definitions:
                try:
                    # 인덱스 존재 여부 확인
                    cursor.execute(
                        "SELECT 1 FROM pg_indexes WHERE indexname = %s",
                        [index_def['name']]
                    )
                    
                    if not cursor.fetchone():
                        # 인덱스 생성
                        columns_str = ', '.join(index_def['columns'])
                        condition_str = f" WHERE {index_def['condition']}" if index_def['condition'] else ""
                        
                        sql = f"""
                        CREATE INDEX CONCURRENTLY IF NOT EXISTS {index_def['name']}
                        ON {index_def['table']} ({columns_str}){condition_str}
                        """
                        
                        cursor.execute(sql)
                        created_indexes.append(index_def['name'])
                        logger.info(f"Created index: {index_def['name']}")
                        
                except Exception as e:
                    logger.error(f"Failed to create index {index_def['name']}: {e}")
                    
        return created_indexes
        
    @staticmethod
    def analyze_slow_queries():
        """느린 쿼리 분석"""
        from django.db import connection
        
        slow_queries = []
        
        with connection.cursor() as cursor:
            try:
                # pg_stat_statements 확장이 설치되어 있는지 확인
                cursor.execute(
                    "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'"
                )
                
                if cursor.fetchone():
                    # 느린 쿼리 조회 (평균 실행 시간 100ms 이상)
                    cursor.execute("""
                        SELECT 
                            query,
                            calls,
                            mean_exec_time,
                            total_exec_time,
                            rows
                        FROM pg_stat_statements
                        WHERE mean_exec_time > 100
                        ORDER BY mean_exec_time DESC
                        LIMIT 20
                    """)
                    
                    for row in cursor.fetchall():
                        slow_queries.append({
                            'query': row[0][:200],  # 쿼리 처음 200자
                            'calls': row[1],
                            'mean_time_ms': row[2],
                            'total_time_ms': row[3],
                            'rows': row[4]
                        })
                        
            except Exception as e:
                logger.error(f"Failed to analyze slow queries: {e}")
                
        return slow_queries
        
    @staticmethod
    def optimize_database_settings():
        """데이터베이스 설정 최적화 제안"""
        from django.db import connection
        
        recommendations = []
        
        with connection.cursor() as cursor:
            try:
                # 현재 설정 확인
                settings_to_check = [
                    ('shared_buffers', '256MB', '메모리의 25% 권장'),
                    ('effective_cache_size', '1GB', '메모리의 50-75% 권장'),
                    ('work_mem', '4MB', '복잡한 쿼리가 많으면 증가'),
                    ('maintenance_work_mem', '64MB', 'VACUUM 성능 향상'),
                    ('random_page_cost', '4', 'SSD의 경우 1.1로 설정'),
                    ('checkpoint_completion_target', '0.9', '체크포인트 부하 분산'),
                    ('wal_buffers', '16MB', 'Write 성능 향상'),
                    ('default_statistics_target', '100', '쿼리 플래너 정확도 향상')
                ]
                
                for setting_name, recommended, description in settings_to_check:
                    cursor.execute(
                        "SELECT setting FROM pg_settings WHERE name = %s",
                        [setting_name]
                    )
                    result = cursor.fetchone()
                    
                    if result:
                        current_value = result[0]
                        recommendations.append({
                            'setting': setting_name,
                            'current': current_value,
                            'recommended': recommended,
                            'description': description
                        })
                        
            except Exception as e:
                logger.error(f"Failed to get database settings: {e}")
                
        return recommendations


class QueryPerformanceMonitor:
    """쿼리 성능 모니터링 클래스"""
    
    @staticmethod
    def log_slow_query(query, execution_time, view_name=None):
        """느린 쿼리 로깅"""
        if execution_time > 1.0:  # 1초 이상
            logger.warning(
                f"Slow query detected in {view_name or 'unknown'}: "
                f"{execution_time:.2f}s - {query[:200]}"
            )
            
            # 캐시에 통계 저장
            cache_key = f"slow_query_stats_{timezone.now().strftime('%Y%m%d')}"
            stats = cache.get(cache_key, [])
            stats.append({
                'query': query[:500],
                'execution_time': execution_time,
                'view_name': view_name,
                'timestamp': timezone.now().isoformat()
            })
            cache.set(cache_key, stats, 86400)  # 24시간 보관
            
    @staticmethod
    def get_query_statistics():
        """쿼리 통계 조회"""
        from django.db import connection
        
        stats = {
            'total_queries': 0,
            'slow_queries': [],
            'most_frequent': [],
            'recommendations': []
        }
        
        # 오늘의 느린 쿼리 통계
        cache_key = f"slow_query_stats_{timezone.now().strftime('%Y%m%d')}"
        slow_queries = cache.get(cache_key, [])
        
        if slow_queries:
            stats['slow_queries'] = sorted(
                slow_queries,
                key=lambda x: x['execution_time'],
                reverse=True
            )[:10]
            
        # N+1 문제 감지
        with connection.cursor() as cursor:
            stats['total_queries'] = len(connection.queries)
            
            # 동일한 패턴의 쿼리가 반복되는 경우 N+1 문제 가능성
            query_patterns = {}
            for query in connection.queries:
                # SELECT 쿼리만 분석
                if query['sql'].startswith('SELECT'):
                    # 테이블명 추출 (간단한 패턴 매칭)
                    pattern = query['sql'].split('FROM')[1].split('WHERE')[0].strip() if 'FROM' in query['sql'] else ''
                    if pattern:
                        query_patterns[pattern] = query_patterns.get(pattern, 0) + 1
                        
            # 5회 이상 반복되는 패턴은 N+1 문제 가능성
            for pattern, count in query_patterns.items():
                if count > 5:
                    stats['recommendations'].append({
                        'type': 'n_plus_one',
                        'pattern': pattern,
                        'count': count,
                        'suggestion': 'select_related() 또는 prefetch_related() 사용 검토'
                    })
                    
        return stats


class BulkOperationOptimizer:
    """대량 작업 최적화 클래스"""
    
    @staticmethod
    def bulk_create_with_batch(model_class, objects, batch_size=1000):
        """배치 단위로 대량 생성"""
        created_objects = []
        
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            created = model_class.objects.bulk_create(batch, ignore_conflicts=True)
            created_objects.extend(created)
            logger.info(f"Created batch {i//batch_size + 1}: {len(created)} objects")
            
        return created_objects
        
    @staticmethod
    def bulk_update_with_batch(model_class, objects, fields, batch_size=1000):
        """배치 단위로 대량 업데이트"""
        updated_count = 0
        
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            model_class.objects.bulk_update(batch, fields, batch_size=batch_size)
            updated_count += len(batch)
            logger.info(f"Updated batch {i//batch_size + 1}: {len(batch)} objects")
            
        return updated_count
        
    @staticmethod
    def efficient_delete(queryset, batch_size=1000):
        """효율적인 대량 삭제 (소프트 삭제 권장)"""
        if hasattr(queryset.model, 'is_deleted'):
            # 소프트 삭제
            return queryset.update(is_deleted=True, deleted_at=timezone.now())
        else:
            # 하드 삭제 (배치 단위)
            deleted_count = 0
            while True:
                batch = list(queryset[:batch_size].values_list('pk', flat=True))
                if not batch:
                    break
                    
                count, _ = queryset.filter(pk__in=batch).delete()
                deleted_count += count
                logger.info(f"Deleted batch: {count} objects")
                
            return deleted_count