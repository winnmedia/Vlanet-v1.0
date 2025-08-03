from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Avg, Count, Sum, F
from django.db.models.functions import TruncDate
from .models import *
from .serializers import *
from .analytics_processor import AnalyticsProcessor
import json
from datetime import datetime, timedelta

class TrackEventView(APIView):
    """개별 이벤트 추적"""
    
    def post(self, request):
        try:
            data = request.data
            session_id = data.get('sessionId')
            user_id = data.get('userId')
            event_type = data.get('eventType')
            event_data = data.get('data', {})
            
            # 세션 가져오기 또는 생성
            session, created = UserSession.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'user_id': user_id,
                    'page_url': request.META.get('HTTP_REFERER', ''),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self.get_client_ip(request),
                }
            )
            
            # 사용자 정보 업데이트 (로그인한 경우)
            if user_id and not session.user_id:
                session.user_id = user_id
                session.save()
            
            # 이벤트 생성
            event = UserEvent.objects.create(
                session=session,
                event_id=data.get('id', f"{session_id}_{timezone.now().timestamp()}"),
                event_type=event_type,
                data=event_data
            )
            
            # 실시간 처리
            processor = AnalyticsProcessor()
            processor.process_real_time_event(event)
            
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SessionAnalyticsView(APIView):
    """세션 분석 데이터 수집"""
    
    def post(self, request):
        try:
            data = request.data
            session_id = data.get('sessionId')
            
            session = UserSession.objects.get(session_id=session_id)
            
            # 폼 인터랙션 데이터 저장
            form_interactions = data.get('formInteractions', {})
            for field_name, stats in form_interactions.items():
                FormInteraction.objects.update_or_create(
                    session=session,
                    field_name=field_name,
                    defaults=stats
                )
            
            # 클릭 히트맵 데이터 저장
            click_heatmap = data.get('clickHeatmap', {})
            for key, count in click_heatmap.items():
                step, button_type = key.split('_', 1)
                ClickHeatmap.objects.update_or_create(
                    session=session,
                    step=int(step),
                    button_type=button_type,
                    defaults={'click_count': count}
                )
            
            # 성능 메트릭 저장
            performance_metrics = data.get('performanceMetrics', {})
            if performance_metrics:
                current_step = performance_metrics.get('currentStep')
                if current_step:
                    PerformanceMetric.objects.update_or_create(
                        session=session,
                        step=current_step,
                        defaults={
                            'step_duration': performance_metrics.get('stepDuration', 0),
                            'efficiency_score': self.calculate_efficiency_score(performance_metrics),
                            'engagement_score': self.calculate_engagement_score(performance_metrics),
                            'frustration_score': self.calculate_frustration_score(performance_metrics),
                        }
                    )
            
            # 세션 정보 업데이트
            session.end_time = timezone.now()
            session.duration = performance_metrics.get('sessionDuration', 0)
            session.completion_rate = performance_metrics.get('completionRate', 0)
            session.final_step = performance_metrics.get('currentStep', 1)
            session.save()
            
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def calculate_efficiency_score(self, metrics):
        # 효율성 점수 계산 로직
        ideal_times = {1: 300000, 2: 120000, 3: 180000, 4: 240000}
        current_step = metrics.get('currentStep', 1)
        step_duration = metrics.get('stepDuration', 0)
        ideal_time = ideal_times.get(current_step, 300000)
        
        if step_duration <= ideal_time:
            return 100
        else:
            return max(0, 100 - ((step_duration - ideal_time) / ideal_time * 100))
    
    def calculate_engagement_score(self, metrics):
        # 참여도 점수 계산 로직
        form_interactions = metrics.get('formInteractions', {})
        total_interactions = sum(
            field.get('focusCount', 0) + field.get('changeCount', 0)
            for field in form_interactions.values()
        )
        
        if 5 <= total_interactions <= 15:
            return 100
        elif total_interactions < 5:
            return (total_interactions / 5) * 100
        else:
            return max(0, 100 - ((total_interactions - 15) / 15 * 50))
    
    def calculate_frustration_score(self, metrics):
        # 좌절감 점수 계산 로직
        form_interactions = metrics.get('formInteractions', {})
        frustration_score = 0
        
        for field in form_interactions.values():
            frustration_score += field.get('clearCount', 0) * 15
            if field.get('abandonmentRate', 0) > 0.3:
                frustration_score += field.get('abandonmentRate', 0) * 30
        
        return min(100, frustration_score)

class DashboardDataView(APIView):
    """대시보드 데이터 조회"""
    
    def get(self, request):
        try:
            # 날짜 범위 파라미터
            days = int(request.GET.get('days', 7))
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)
            
            # 기본 통계
            total_sessions = UserSession.objects.filter(
                start_time__date__gte=start_date
            ).count()
            
            total_users = UserSession.objects.filter(
                start_time__date__gte=start_date,
                user__isnull=False
            ).values('user').distinct().count()
            
            # 완료율 통계
            completion_stats = UserSession.objects.filter(
                start_time__date__gte=start_date
            ).aggregate(
                avg_completion=Avg('completion_rate'),
                step_4_count=Count('id', filter=models.Q(final_step=4)),
                total_count=Count('id')
            )
            
            completion_rate = completion_stats['avg_completion'] or 0
            full_completion_rate = (
                completion_stats['step_4_count'] / completion_stats['total_count'] * 100
                if completion_stats['total_count'] > 0 else 0
            )
            
            # 단계별 통계
            step_stats = []
            for step in range(1, 5):
                step_sessions = UserSession.objects.filter(
                    start_time__date__gte=start_date,
                    final_step__gte=step
                )
                
                avg_duration = PerformanceMetric.objects.filter(
                    session__start_time__date__gte=start_date,
                    step=step
                ).aggregate(avg_duration=Avg('step_duration'))['avg_duration'] or 0
                
                step_stats.append({
                    'step': step,
                    'completion_count': step_sessions.count(),
                    'completion_rate': (
                        step_sessions.count() / total_sessions * 100
                        if total_sessions > 0 else 0
                    ),
                    'average_duration': avg_duration / 1000 / 60,  # 분 단위
                })
            
            # 일일 트렌드
            daily_stats = UserSession.objects.filter(
                start_time__date__gte=start_date
            ).annotate(
                date=TruncDate('start_time')
            ).values('date').annotate(
                session_count=Count('id'),
                avg_duration=Avg('duration'),
                avg_completion=Avg('completion_rate')
            ).order_by('date')
            
            # 인기 버튼 및 필드
            popular_buttons = ClickHeatmap.objects.filter(
                session__start_time__date__gte=start_date
            ).values('button_type').annotate(
                total_clicks=Sum('click_count')
            ).order_by('-total_clicks')[:10]
            
            popular_fields = FormInteraction.objects.filter(
                session__start_time__date__gte=start_date
            ).values('field_name').annotate(
                total_interactions=Sum(F('focus_count') + F('change_count'))
            ).order_by('-total_interactions')[:10]
            
            # 에러 통계
            error_stats = UserEvent.objects.filter(
                timestamp__date__gte=start_date,
                event_type='error_occurred'
            ).values('data__errorType').annotate(
                count=Count('id')
            ).order_by('-count')
            
            return Response({
                'summary': {
                    'total_sessions': total_sessions,
                    'total_users': total_users,
                    'completion_rate': completion_rate,
                    'full_completion_rate': full_completion_rate,
                },
                'step_stats': step_stats,
                'daily_stats': list(daily_stats),
                'popular_buttons': list(popular_buttons),
                'popular_fields': list(popular_fields),
                'error_stats': list(error_stats),
                'date_range': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'days': days
                }
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserInsightsView(APIView):
    """사용자 인사이트 조회"""
    
    def get(self, request):
        session_id = request.GET.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = UserSession.objects.get(session_id=session_id)
            insights = UserInsight.objects.filter(session=session, resolved=False)
            
            serializer = UserInsightSerializer(insights, many=True)
            return Response({
                'insights': serializer.data,
                'session_info': {
                    'duration': session.duration,
                    'completion_rate': session.completion_rate,
                    'current_step': session.final_step
                }
            })
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class FeedbackView(APIView):
    """사용자 피드백 수집"""
    
    def post(self, request):
        try:
            data = request.data
            session_id = data.get('sessionId')
            
            session = UserSession.objects.get(session_id=session_id)
            
            feedback = UserFeedback.objects.create(
                session=session,
                feedback_type=data.get('feedbackType', 'general'),
                rating=data.get('rating'),
                message=data.get('message', '')
            )
            
            return Response({
                'status': 'success',
                'feedback_id': feedback.id
            })
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class RealtimeMetricsView(APIView):
    """실시간 메트릭 조회"""
    
    def get(self, request):
        # 현재 활성 세션들 (최근 30분 이내)
        active_threshold = timezone.now() - timedelta(minutes=30)
        active_sessions = UserSession.objects.filter(
            start_time__gte=active_threshold,
            end_time__isnull=True
        )
        
        # 실시간 통계
        current_users = active_sessions.count()
        
        # 단계별 분포
        step_distribution = {}
        for step in range(1, 5):
            step_distribution[f'step_{step}'] = active_sessions.filter(
                final_step=step
            ).count()
        
        # 평균 단계별 시간
        recent_metrics = PerformanceMetric.objects.filter(
            session__start_time__gte=active_threshold
        ).values('step').annotate(
            avg_duration=Avg('step_duration')
        )
        
        average_time_per_step = {}
        for metric in recent_metrics:
            average_time_per_step[f'step_{metric["step"]}'] = (
                metric['avg_duration'] / 1000 / 60  # 분 단위
            )
        
        # 실시간 완료율
        recent_sessions = UserSession.objects.filter(
            start_time__gte=active_threshold
        )
        completion_rate = recent_sessions.aggregate(
            avg_completion=Avg('completion_rate')
        )['avg_completion'] or 0
        
        # 실시간 에러율
        recent_errors = UserEvent.objects.filter(
            timestamp__gte=active_threshold,
            event_type='error_occurred'
        ).count()
        
        total_recent_events = UserEvent.objects.filter(
            timestamp__gte=active_threshold
        ).count()
        
        error_rate = (
            recent_errors / total_recent_events * 100
            if total_recent_events > 0 else 0
        )
        
        return Response({
            'current_users': current_users,
            'step_distribution': step_distribution,
            'average_time_per_step': average_time_per_step,
            'completion_rate': completion_rate,
            'error_rate': error_rate,
            'last_updated': timezone.now().isoformat()
        })