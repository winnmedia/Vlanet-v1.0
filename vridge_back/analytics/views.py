from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q, F
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
import json

from .models import UserEvent, UserSession, FeatureUsage, PerformanceMetric, ABTestExperiment
from projects.models import Project
from users.models import User
from feedbacks.models import Feedback, FeedbackComment


class AnalyticsDashboardView(View):
    """실시간 분석 대시보드 API"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        # 캐시 키
        cache_key = 'analytics_dashboard_data'
        cached_data = cache.get(cache_key)
        
        if cached_data and not request.GET.get('refresh'):
            return JsonResponse(cached_data)
        
        # 시간 범위 설정
        now = timezone.now()
        today = now.date()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        yesterday = now - timedelta(days=1)
        
        data = {
            'timestamp': now.isoformat(),
            'metrics': {
                'users': self._get_user_metrics(today, last_30_days),
                'projects': self._get_project_metrics(today, last_30_days),
                'engagement': self._get_engagement_metrics(last_7_days),
                'performance': self._get_performance_metrics(yesterday),
                'features': self._get_feature_usage(last_7_days),
                'realtime': self._get_realtime_metrics(),
            }
        }
        
        # 5분간 캐시
        cache.set(cache_key, data, 300)
        
        return JsonResponse(data)
    
    def _get_user_metrics(self, today, last_30_days):
        """사용자 관련 메트릭"""
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_30d = User.objects.filter(date_joined__gte=last_30_days).count()
        
        # DAU/MAU
        dau = UserEvent.objects.filter(
            created__date=today
        ).values('user').distinct().count()
        
        mau = UserEvent.objects.filter(
            created__gte=last_30_days
        ).values('user').distinct().count()
        
        # 로그인 방법별 분포
        login_methods = User.objects.values('login_method').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return {
            'total': total_users,
            'new_today': new_users_today,
            'new_30d': new_users_30d,
            'dau': dau,
            'mau': mau,
            'dau_mau_ratio': round(dau / mau * 100, 2) if mau > 0 else 0,
            'login_methods': list(login_methods),
        }
    
    def _get_project_metrics(self, today, last_30_days):
        """프로젝트 관련 메트릭"""
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(
            Q(basic_plan__end_date__gte=today) |
            Q(confirmation__end_date__gte=today)
        ).count()
        
        completed_projects = Project.objects.filter(
            video_delivery__status='complete'
        ).count()
        
        # 프로젝트 생성 추이
        project_trend = Project.objects.filter(
            created__gte=last_30_days
        ).extra(
            select={'day': 'DATE(created)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        # 평균 프로젝트 완료 시간
        completed_with_duration = Project.objects.filter(
            video_delivery__status='complete',
            video_delivery__end_date__isnull=False,
            basic_plan__start_date__isnull=False
        ).annotate(
            duration_days=F('video_delivery__end_date') - F('basic_plan__start_date')
        )
        
        avg_completion_time = None
        if completed_with_duration.exists():
            durations = [p.duration_days.days for p in completed_with_duration if p.duration_days]
            avg_completion_time = sum(durations) / len(durations) if durations else None
        
        return {
            'total': total_projects,
            'active': active_projects,
            'completed': completed_projects,
            'completion_rate': round(completed_projects / total_projects * 100, 2) if total_projects > 0 else 0,
            'avg_completion_days': round(avg_completion_time, 1) if avg_completion_time else None,
            'creation_trend': list(project_trend),
        }
    
    def _get_engagement_metrics(self, last_7_days):
        """사용자 참여 메트릭"""
        # 평균 세션 시간
        sessions = UserSession.objects.filter(
            started_at__gte=last_7_days,
            duration_seconds__isnull=False
        )
        avg_session_duration = sessions.aggregate(
            avg=Avg('duration_seconds')
        )['avg'] or 0
        
        # 페이지뷰
        page_views = UserEvent.objects.filter(
            event_type='page_view',
            created__gte=last_7_days
        ).count()
        
        # 피드백 활동
        feedback_count = FeedbackComment.objects.filter(
            created__gte=last_7_days
        ).count()
        
        # 가장 많이 사용되는 기능
        top_features = UserEvent.objects.filter(
            event_type='feature_use',
            created__gte=last_7_days
        ).values('event_name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return {
            'avg_session_seconds': round(avg_session_duration, 0),
            'avg_session_minutes': round(avg_session_duration / 60, 1),
            'page_views_7d': page_views,
            'feedback_comments_7d': feedback_count,
            'top_features': list(top_features),
        }
    
    def _get_performance_metrics(self, yesterday):
        """성능 메트릭"""
        # API 응답 시간
        api_metrics = PerformanceMetric.objects.filter(
            metric_type='api_response',
            timestamp__gte=yesterday
        ).aggregate(
            avg_ms=Avg('duration_ms'),
            p50=models.Percentile('duration_ms', 0.5),
            p95=models.Percentile('duration_ms', 0.95),
            p99=models.Percentile('duration_ms', 0.99),
        )
        
        # 느린 엔드포인트
        slow_endpoints = PerformanceMetric.objects.filter(
            metric_type='api_response',
            timestamp__gte=yesterday,
            duration_ms__gt=1000  # 1초 이상
        ).values('endpoint').annotate(
            avg_ms=Avg('duration_ms'),
            count=Count('id')
        ).order_by('-avg_ms')[:5]
        
        # 에러율
        total_requests = PerformanceMetric.objects.filter(
            metric_type='api_response',
            timestamp__gte=yesterday
        ).count()
        
        error_requests = PerformanceMetric.objects.filter(
            metric_type='api_response',
            timestamp__gte=yesterday,
            status_code__gte=400
        ).count()
        
        error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'api_response': {
                'avg_ms': round(api_metrics.get('avg_ms', 0), 2),
                'p50_ms': round(api_metrics.get('p50', 0), 2),
                'p95_ms': round(api_metrics.get('p95', 0), 2),
                'p99_ms': round(api_metrics.get('p99', 0), 2),
            },
            'slow_endpoints': list(slow_endpoints),
            'error_rate': round(error_rate, 2),
            'total_requests_24h': total_requests,
        }
    
    def _get_feature_usage(self, last_7_days):
        """기능별 사용 통계"""
        feature_stats = FeatureUsage.objects.filter(
            date__gte=last_7_days.date()
        ).values('feature_name').annotate(
            total_uses=Sum('total_uses'),
            unique_users=Sum('unique_users'),
            success_rate=Avg(F('success_count') / (F('success_count') + F('error_count')) * 100)
        ).order_by('-total_uses')
        
        return list(feature_stats)
    
    def _get_realtime_metrics(self):
        """실시간 메트릭 (최근 5분)"""
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        
        # 현재 활성 사용자
        active_users = UserEvent.objects.filter(
            created__gte=five_minutes_ago
        ).values('user').distinct().count()
        
        # 최근 이벤트
        recent_events = UserEvent.objects.filter(
            created__gte=five_minutes_ago
        ).values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return {
            'active_users_now': active_users,
            'recent_events': list(recent_events),
            'timestamp': timezone.now().isoformat(),
        }


class EventTrackingView(View):
    """이벤트 추적 API"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # 사용자 확인
            user = request.user if request.user.is_authenticated else None
            
            # 이벤트 생성
            event = UserEvent.objects.create(
                user=user,
                event_type=data.get('event_type', 'custom'),
                event_name=data.get('event_name', ''),
                event_data=data.get('event_data', {}),
                session_id=data.get('session_id', ''),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                page_url=data.get('page_url', ''),
                referrer=request.META.get('HTTP_REFERER', ''),
                device_type=self._detect_device_type(request),
            )
            
            # 세션 업데이트
            if data.get('session_id'):
                self._update_session(data['session_id'], user, event)
            
            # 기능 사용 통계 업데이트
            if event.event_type == 'feature_use':
                self._update_feature_usage(event.event_name)
            
            return JsonResponse({
                'status': 'success',
                'event_id': event.id
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    
    def _get_client_ip(self, request):
        """클라이언트 IP 추출"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _detect_device_type(self, request):
        """디바이스 타입 감지"""
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        if 'mobile' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            return 'tablet'
        else:
            return 'desktop'
    
    def _update_session(self, session_id, user, event):
        """세션 정보 업데이트"""
        session, created = UserSession.objects.get_or_create(
            session_id=session_id,
            defaults={'user': user} if user else {}
        )
        
        if event.event_type == 'page_view':
            session.page_views += 1
            session.exit_page = event.page_url
            
            if created:
                session.landing_page = event.page_url
        
        session.events_count += 1
        session.save()
    
    def _update_feature_usage(self, feature_name):
        """기능 사용 통계 업데이트"""
        today = timezone.now().date()
        
        feature_usage, created = FeatureUsage.objects.get_or_create(
            feature_name=feature_name,
            date=today,
            defaults={'total_uses': 0, 'unique_users': 0}
        )
        
        feature_usage.total_uses += 1
        feature_usage.save()


class ABTestView(View):
    """A/B 테스트 관리 API"""
    
    def get(self, request):
        """사용자의 A/B 테스트 할당 조회"""
        if not request.user.is_authenticated:
            return JsonResponse({'experiments': []})
        
        active_experiments = ABTestExperiment.objects.filter(
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        
        assignments = []
        for experiment in active_experiments:
            assignment, created = ABTestAssignment.objects.get_or_create(
                user=request.user,
                experiment=experiment,
                defaults={
                    'variant': self._assign_variant(experiment)
                }
            )
            
            assignments.append({
                'experiment_name': experiment.name,
                'variant': assignment.variant,
            })
        
        return JsonResponse({'experiments': assignments})
    
    def _assign_variant(self, experiment):
        """A/B 테스트 변형 할당"""
        import random
        
        # 트래픽 비율에 따라 실험 참여 결정
        if random.randint(1, 100) > experiment.traffic_percentage:
            return 'control'
        
        # 50:50 랜덤 할당
        return 'treatment' if random.random() > 0.5 else 'control'