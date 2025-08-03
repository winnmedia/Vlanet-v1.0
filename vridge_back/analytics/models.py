from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class UserSession(models.Model):
    """사용자 세션 정보"""
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)  # milliseconds
    page_url = models.URLField()
    user_agent = models.TextField()
    ip_address = models.GenericIPAddressField()
    completion_rate = models.FloatField(default=0.0)  # 0-100
    final_step = models.IntegerField(default=1)  # 마지막 도달 단계
    
    class Meta:
        db_table = 'analytics_user_session'
        ordering = ['-start_time']

class UserEvent(models.Model):
    """사용자 행동 이벤트"""
    EVENT_TYPES = [
        ('page_enter', '페이지 진입'),
        ('page_exit', '페이지 이탈'),
        ('step_enter', '단계 진입'),
        ('step_exit', '단계 이탈'),
        ('form_interaction', '폼 인터랙션'),
        ('button_click', '버튼 클릭'),
        ('generation_start', '생성 시작'),
        ('generation_complete', '생성 완료'),
        ('content_edit', '콘텐츠 편집'),
        ('save_action', '저장 액션'),
        ('error_occurred', '오류 발생'),
        ('user_satisfaction', '사용자 만족도'),
        ('tab_hidden', '탭 숨김'),
        ('tab_visible', '탭 표시'),
        ('scroll_pause', '스크롤 일시정지'),
    ]
    
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='events')
    event_id = models.CharField(max_length=100, unique=True, db_index=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(default=dict)  # 이벤트별 상세 데이터
    
    class Meta:
        db_table = 'analytics_user_event'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['session', 'event_type']),
            models.Index(fields=['timestamp']),
        ]

class FormInteraction(models.Model):
    """폼 인터랙션 상세 분석"""
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='form_interactions')
    field_name = models.CharField(max_length=100)
    focus_count = models.IntegerField(default=0)
    change_count = models.IntegerField(default=0)
    clear_count = models.IntegerField(default=0)
    total_time = models.IntegerField(default=0)  # milliseconds
    max_length = models.IntegerField(default=0)
    first_focus_time = models.DateTimeField(null=True, blank=True)
    last_blur_time = models.DateTimeField(null=True, blank=True)
    abandonment_rate = models.FloatField(default=0.0)
    
    class Meta:
        db_table = 'analytics_form_interaction'
        unique_together = ['session', 'field_name']

class ClickHeatmap(models.Model):
    """클릭 히트맵 데이터"""
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='clicks')
    step = models.IntegerField()
    button_type = models.CharField(max_length=100)
    click_count = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'analytics_click_heatmap'
        unique_together = ['session', 'step', 'button_type']

class PerformanceMetric(models.Model):
    """성능 지표"""
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='performance_metrics')
    step = models.IntegerField()
    step_duration = models.IntegerField()  # milliseconds
    efficiency_score = models.FloatField(default=0.0)  # 0-100
    engagement_score = models.FloatField(default=0.0)  # 0-100
    frustration_score = models.FloatField(default=0.0)  # 0-100
    
    class Meta:
        db_table = 'analytics_performance_metric'
        unique_together = ['session', 'step']

class UserInsight(models.Model):
    """사용자 인사이트 및 추천"""
    INSIGHT_TYPES = [
        ('time_warning', '시간 경고'),
        ('content_struggle', '콘텐츠 작성 어려움'),
        ('generation_delay', '생성 지연'),
        ('high_edit_count', '높은 편집 횟수'),
        ('abandonment_risk', '이탈 위험'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
    ]
    
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='insights')
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    message = models.TextField()
    action_suggestion = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'analytics_user_insight'
        ordering = ['-created_at']

class DailyAnalytics(models.Model):
    """일일 분석 통계"""
    date = models.DateField(unique=True, db_index=True)
    total_sessions = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    average_session_duration = models.FloatField(default=0.0)  # minutes
    completion_rate = models.FloatField(default=0.0)  # percentage
    step_1_completion = models.FloatField(default=0.0)
    step_2_completion = models.FloatField(default=0.0)
    step_3_completion = models.FloatField(default=0.0)
    step_4_completion = models.FloatField(default=0.0)
    average_step_1_duration = models.FloatField(default=0.0)  # minutes
    average_step_2_duration = models.FloatField(default=0.0)
    average_step_3_duration = models.FloatField(default=0.0)
    average_step_4_duration = models.FloatField(default=0.0)
    total_errors = models.IntegerField(default=0)
    most_clicked_button = models.CharField(max_length=100, blank=True)
    most_edited_field = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'analytics_daily_analytics'
        ordering = ['-date']

class A_BTestGroup(models.Model):
    """A/B 테스트 그룹"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    control_group_size = models.IntegerField(default=50)  # percentage
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_ab_test_group'

class A_BTestAssignment(models.Model):
    """A/B 테스트 할당"""
    GROUP_TYPES = [
        ('control', '대조군'),
        ('variant', '실험군'),
    ]
    
    test_group = models.ForeignKey(A_BTestGroup, on_delete=models.CASCADE, related_name='assignments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group_type = models.CharField(max_length=10, choices=GROUP_TYPES)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_ab_test_assignment'
        unique_together = ['test_group', 'user']

class UserFeedback(models.Model):
    """사용자 피드백"""
    FEEDBACK_TYPES = [
        ('satisfaction', '만족도'),
        ('bug_report', '버그 신고'),
        ('feature_request', '기능 요청'),
        ('general', '일반 피드백'),
    ]
    
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='feedback')
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    rating = models.IntegerField(null=True, blank=True)  # 1-5 stars
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'analytics_user_feedback'
        ordering = ['-created_at']