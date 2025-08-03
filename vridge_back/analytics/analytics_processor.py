"""
사용자 행동 분석 처리기
실시간 분석, 인사이트 생성, 추천 시스템
"""

from django.utils import timezone
from datetime import timedelta
from .models import *
import json
import statistics

class AnalyticsProcessor:
    """실시간 분석 및 인사이트 생성 엔진"""
    
    def __init__(self):
        self.insight_thresholds = {
            'long_step_duration': {
                1: 600000,  # 10분
                2: 300000,  # 5분
                3: 360000,  # 6분
                4: 480000   # 8분
            },
            'high_edit_count': 5,
            'high_clear_count': 3,
            'high_abandonment_rate': 0.3
        }
    
    def process_real_time_event(self, event):
        """실시간 이벤트 처리"""
        session = event.session
        
        # 이벤트 타입별 처리
        if event.event_type == 'step_enter':
            self._process_step_entry(session, event)
        elif event.event_type == 'form_interaction':
            self._process_form_interaction(session, event)
        elif event.event_type == 'generation_start':
            self._process_generation_start(session, event)
        elif event.event_type == 'error_occurred':
            self._process_error(session, event)
        
        # 실시간 인사이트 생성
        self._generate_real_time_insights(session)
    
    def _process_step_entry(self, session, event):
        """단계 진입 처리"""
        step = event.data.get('step')
        if not step:
            return
        
        # 이전 단계 시간 체크
        previous_step = step - 1
        if previous_step > 0:
            previous_metrics = PerformanceMetric.objects.filter(
                session=session, step=previous_step
            ).first()
            
            if previous_metrics and previous_metrics.step_duration > self.insight_thresholds['long_step_duration'].get(previous_step, 600000):
                self._create_insight(
                    session,
                    'time_warning',
                    'high',
                    f'단계 {previous_step}에서 예상보다 오랜 시간이 소요되었습니다.',
                    'show_ai_assistant'
                )
    
    def _process_form_interaction(self, session, event):
        """폼 인터랙션 처리"""
        field_name = event.data.get('fieldName')
        action = event.data.get('action')
        
        if action == 'clear' and field_name:
            # 지우기 액션이 많은 경우
            interaction, created = FormInteraction.objects.get_or_create(
                session=session,
                field_name=field_name,
                defaults={'clear_count': 1}
            )
            
            if not created:
                interaction.clear_count += 1
                interaction.save()
                
                # 임계값 초과시 인사이트 생성
                if interaction.clear_count >= self.insight_thresholds['high_clear_count']:
                    self._create_insight(
                        session,
                        'content_struggle',
                        'medium',
                        f'{field_name} 필드에서 어려움을 겪고 계시는 것 같습니다. 도움이 필요하신가요?',
                        'show_templates'
                    )
    
    def _process_generation_start(self, session, event):
        """생성 시작 처리"""
        generation_type = event.data.get('type')
        
        # 생성 시작 알림 (선택적)
        if generation_type == 'storyboard':
            self._create_insight(
                session,
                'generation_delay',
                'low',
                '스토리보드 생성이 시작되었습니다. 잠시만 기다려주세요.',
                'show_progress'
            )
    
    def _process_error(self, session, event):
        """에러 처리"""
        error_type = event.data.get('errorType')
        error_message = event.data.get('errorMessage')
        
        self._create_insight(
            session,
            'error_occurred',
            'high',
            f'오류가 발생했습니다: {error_message}',
            'contact_support'
        )
    
    def _generate_real_time_insights(self, session):
        """실시간 인사이트 생성"""
        current_time = timezone.now()
        
        # 세션 지속 시간 체크
        session_duration = (current_time - session.start_time).total_seconds() * 1000
        
        if session_duration > 1800000:  # 30분 이상
            existing_insight = UserInsight.objects.filter(
                session=session,
                insight_type='abandonment_risk',
                resolved=False
            ).first()
            
            if not existing_insight:
                self._create_insight(
                    session,
                    'abandonment_risk',
                    'high',
                    '작업 시간이 길어지고 있습니다. 저장하고 나중에 계속하시겠어요?',
                    'suggest_save'
                )
        
        # 폼 인터랙션 패턴 분석
        self._analyze_form_patterns(session)
        
        # 클릭 패턴 분석
        self._analyze_click_patterns(session)
    
    def _analyze_form_patterns(self, session):
        """폼 인터랙션 패턴 분석"""
        form_interactions = FormInteraction.objects.filter(session=session)
        
        for interaction in form_interactions:
            # 높은 편집 횟수 체크
            if interaction.change_count >= self.insight_thresholds['high_edit_count']:
                self._create_insight(
                    session,
                    'high_edit_count',
                    'medium',
                    f'{interaction.field_name} 필드를 많이 수정하고 계시네요. 예시나 템플릿이 도움이 될까요?',
                    'show_examples'
                )
            
            # 높은 포기율 체크
            if interaction.abandonment_rate >= self.insight_thresholds['high_abandonment_rate']:
                self._create_insight(
                    session,
                    'content_struggle',
                    'medium',
                    f'{interaction.field_name} 필드에서 어려움을 겪고 계시는 것 같습니다.',
                    'show_ai_assistant'
                )
    
    def _analyze_click_patterns(self, session):
        """클릭 패턴 분석"""
        clicks = ClickHeatmap.objects.filter(session=session)
        
        # 반복적인 재생성 요청 체크
        regenerate_clicks = clicks.filter(
            button_type__icontains='regenerate'
        ).aggregate(total=models.Sum('click_count'))['total'] or 0
        
        if regenerate_clicks >= 5:
            self._create_insight(
                session,
                'generation_dissatisfaction',
                'medium',
                '생성 결과가 만족스럽지 않으신가요? 더 구체적인 설명을 제공해보세요.',
                'improve_prompts'
            )
    
    def _create_insight(self, session, insight_type, severity, message, action_suggestion):
        """인사이트 생성"""
        # 중복 방지: 같은 타입의 해결되지 않은 인사이트가 있는지 확인
        existing = UserInsight.objects.filter(
            session=session,
            insight_type=insight_type,
            resolved=False
        ).first()
        
        if existing:
            return
        
        UserInsight.objects.create(
            session=session,
            insight_type=insight_type,
            severity=severity,
            message=message,
            action_suggestion=action_suggestion
        )
    
    def generate_daily_analytics(self, date=None):
        """일일 분석 통계 생성"""
        if not date:
            date = timezone.now().date()
        
        sessions = UserSession.objects.filter(start_time__date=date)
        total_sessions = sessions.count()
        
        if total_sessions == 0:
            return
        
        # 기본 통계
        total_users = sessions.filter(user__isnull=False).values('user').distinct().count()
        average_duration = sessions.aggregate(
            avg=models.Avg('duration')
        )['avg'] or 0
        average_duration_minutes = average_duration / 1000 / 60
        
        # 완료율 통계
        completion_rate = sessions.aggregate(
            avg=models.Avg('completion_rate')
        )['avg'] or 0
        
        # 단계별 완료율
        step_completions = {}
        for step in range(1, 5):
            count = sessions.filter(final_step__gte=step).count()
            step_completions[f'step_{step}_completion'] = (
                count / total_sessions * 100 if total_sessions > 0 else 0
            )
        
        # 단계별 평균 시간
        step_durations = {}
        for step in range(1, 5):
            avg_duration = PerformanceMetric.objects.filter(
                session__start_time__date=date,
                step=step
            ).aggregate(avg=models.Avg('step_duration'))['avg'] or 0
            step_durations[f'average_step_{step}_duration'] = avg_duration / 1000 / 60
        
        # 에러 통계
        total_errors = UserEvent.objects.filter(
            timestamp__date=date,
            event_type='error_occurred'
        ).count()
        
        # 인기 요소들
        most_clicked_button = ClickHeatmap.objects.filter(
            session__start_time__date=date
        ).values('button_type').annotate(
            total=models.Sum('click_count')
        ).order_by('-total').first()
        
        most_edited_field = FormInteraction.objects.filter(
            session__start_time__date=date
        ).values('field_name').annotate(
            total=models.Sum('change_count')
        ).order_by('-total').first()
        
        # 일일 분석 저장 또는 업데이트
        daily_analytics, created = DailyAnalytics.objects.get_or_create(
            date=date,
            defaults={
                'total_sessions': total_sessions,
                'total_users': total_users,
                'average_session_duration': average_duration_minutes,
                'completion_rate': completion_rate,
                'step_1_completion': step_completions['step_1_completion'],
                'step_2_completion': step_completions['step_2_completion'],
                'step_3_completion': step_completions['step_3_completion'],
                'step_4_completion': step_completions['step_4_completion'],
                'average_step_1_duration': step_durations['average_step_1_duration'],
                'average_step_2_duration': step_durations['average_step_2_duration'],
                'average_step_3_duration': step_durations['average_step_3_duration'],
                'average_step_4_duration': step_durations['average_step_4_duration'],
                'total_errors': total_errors,
                'most_clicked_button': most_clicked_button['button_type'] if most_clicked_button else '',
                'most_edited_field': most_edited_field['field_name'] if most_edited_field else '',
            }
        )
        
        if not created:
            # 업데이트
            daily_analytics.total_sessions = total_sessions
            daily_analytics.total_users = total_users
            daily_analytics.average_session_duration = average_duration_minutes
            daily_analytics.completion_rate = completion_rate
            daily_analytics.step_1_completion = step_completions['step_1_completion']
            daily_analytics.step_2_completion = step_completions['step_2_completion']
            daily_analytics.step_3_completion = step_completions['step_3_completion']
            daily_analytics.step_4_completion = step_completions['step_4_completion']
            daily_analytics.total_errors = total_errors
            daily_analytics.most_clicked_button = most_clicked_button['button_type'] if most_clicked_button else ''
            daily_analytics.most_edited_field = most_edited_field['field_name'] if most_edited_field else ''
            daily_analytics.save()
        
        return daily_analytics
    
    def get_optimization_recommendations(self, session_id):
        """세션별 최적화 추천"""
        try:
            session = UserSession.objects.get(session_id=session_id)
        except UserSession.DoesNotExist:
            return []
        
        recommendations = []
        
        # 성능 메트릭 기반 추천
        metrics = PerformanceMetric.objects.filter(session=session)
        for metric in metrics:
            if metric.efficiency_score < 50:
                recommendations.append({
                    'type': 'efficiency',
                    'priority': 'high',
                    'message': f'단계 {metric.step}의 효율성이 낮습니다. AI 도움 기능을 사용해보세요.',
                    'action': 'enable_ai_assistant'
                })
            
            if metric.frustration_score > 60:
                recommendations.append({
                    'type': 'frustration',
                    'priority': 'high',
                    'message': f'단계 {metric.step}에서 어려움을 겪고 계시는 것 같습니다. 템플릿을 사용해보세요.',
                    'action': 'suggest_templates'
                })
        
        # 폼 인터랙션 기반 추천
        form_interactions = FormInteraction.objects.filter(session=session)
        for interaction in form_interactions:
            if interaction.clear_count > 2:
                recommendations.append({
                    'type': 'content_help',
                    'priority': 'medium',
                    'message': f'{interaction.field_name} 필드의 예시를 참고해보세요.',
                    'action': 'show_examples'
                })
        
        return recommendations
    
    def predict_user_needs(self, session_id):
        """사용자 필요사항 예측"""
        try:
            session = UserSession.objects.get(session_id=session_id)
        except UserSession.DoesNotExist:
            return []
        
        predictions = []
        current_time = timezone.now()
        session_duration = (current_time - session.start_time).total_seconds() * 1000
        
        # 시간 기반 예측
        if session_duration > 900000 and session.final_step == 1:  # 15분 이상 1단계
            predictions.append({
                'need': 'content_inspiration',
                'confidence': 0.85,
                'suggestion': 'AI 기획안 예시를 제공하여 영감을 줄 것을 제안'
            })
        
        if session.final_step == 4:  # 스토리보드 단계
            recent_regenerations = ClickHeatmap.objects.filter(
                session=session,
                button_type__icontains='regenerate'
            ).aggregate(total=models.Sum('click_count'))['total'] or 0
            
            if recent_regenerations > 3:
                predictions.append({
                    'need': 'better_prompts',
                    'confidence': 0.9,
                    'suggestion': '더 구체적인 프롬프트 작성 가이드 제공'
                })
        
        return predictions