from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import JSONField
from core.models import TimeStampedModel

User = get_user_model()

class UserEvent(TimeStampedModel):
    """사용자 행동 이벤트 추적"""
    
    EVENT_TYPES = [
        ('page_view', '페이지 조회'),
        ('button_click', '버튼 클릭'),
        ('feature_use', '기능 사용'),
        ('video_play', '비디오 재생'),
        ('video_pause', '비디오 일시정지'),
        ('video_complete', '비디오 완료'),
        ('feedback_submit', '피드백 제출'),
        ('project_create', '프로젝트 생성'),
        ('project_complete', '프로젝트 완료'),
        ('file_upload', '파일 업로드'),
        ('error', '에러 발생'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, db_index=True)
    event_name = models.CharField(max_length=200)
    event_data = models.JSONField(default=dict, blank=True)
    
    # 세션 정보
    session_id = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # 페이지 정보
    page_url = models.URLField(max_length=500, null=True, blank=True)
    referrer = models.URLField(max_length=500, null=True, blank=True)
    
    # 디바이스 정보
    device_type = models.CharField(max_length=20, null=True, blank=True)  # mobile, tablet, desktop
    browser = models.CharField(max_length=50, null=True, blank=True)
    os = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', '-created']),
            models.Index(fields=['event_type', '-created']),
            models.Index(fields=['session_id', '-created']),
            models.Index(fields=['created']),
        ]
        ordering = ['-created']

    def __str__(self):
        return f"{self.user.email} - {self.event_type} - {self.event_name}"


class UserSession(TimeStampedModel):
    """사용자 세션 정보"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    
    # 세션 시작/종료
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    # 세션 중 활동
    page_views = models.IntegerField(default=0)
    events_count = models.IntegerField(default=0)
    
    # 첫 페이지와 마지막 페이지
    landing_page = models.URLField(max_length=500, null=True, blank=True)
    exit_page = models.URLField(max_length=500, null=True, blank=True)
    
    # 전환 정보
    converted = models.BooleanField(default=False)
    conversion_type = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['started_at']),
            models.Index(fields=['session_id']),
        ]
        ordering = ['-started_at']


class FeatureUsage(TimeStampedModel):
    """기능별 사용 통계"""
    
    FEATURES = [
        ('project_create', '프로젝트 생성'),
        ('video_planning', '영상 기획'),
        ('video_upload', '영상 업로드'),
        ('feedback_system', '피드백 시스템'),
        ('calendar_view', '캘린더 보기'),
        ('export_pdf', 'PDF 내보내기'),
        ('ai_planning', 'AI 기획 생성'),
        ('insert_shots', '인서트샷 생성'),
    ]
    
    feature_name = models.CharField(max_length=50, choices=FEATURES, db_index=True)
    date = models.DateField(db_index=True)
    
    # 사용 횟수
    total_uses = models.IntegerField(default=0)
    unique_users = models.IntegerField(default=0)
    
    # 성공/실패
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    
    # 평균 소요 시간 (초)
    avg_duration = models.FloatField(null=True, blank=True)
    
    class Meta:
        unique_together = [['feature_name', 'date']]
        indexes = [
            models.Index(fields=['date', 'feature_name']),
        ]
        ordering = ['-date']


class PerformanceMetric(TimeStampedModel):
    """성능 메트릭"""
    
    METRIC_TYPES = [
        ('page_load', '페이지 로드'),
        ('api_response', 'API 응답'),
        ('db_query', 'DB 쿼리'),
        ('cache_hit', '캐시 히트율'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES, db_index=True)
    endpoint = models.CharField(max_length=200, db_index=True)
    
    # 측정값
    duration_ms = models.FloatField()  # 밀리초
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # 추가 정보
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    error = models.TextField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['metric_type', '-timestamp']),
            models.Index(fields=['endpoint', '-timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']


class ABTestExperiment(TimeStampedModel):
    """A/B 테스트 실험"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    hypothesis = models.TextField()
    
    # 실험 기간
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True, db_index=True)
    
    # 실험 설정
    traffic_percentage = models.IntegerField(default=50)  # 실험에 참여할 트래픽 비율
    control_name = models.CharField(max_length=50, default='control')
    treatment_name = models.CharField(max_length=50, default='treatment')
    
    # 결과
    conclusion = models.TextField(null=True, blank=True)
    winner = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        ordering = ['-created']


class ABTestAssignment(TimeStampedModel):
    """A/B 테스트 할당"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    experiment = models.ForeignKey(ABTestExperiment, on_delete=models.CASCADE)
    variant = models.CharField(max_length=50)  # 'control' or 'treatment'
    
    # 전환 추적
    converted = models.BooleanField(default=False)
    conversion_value = models.FloatField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = [['user', 'experiment']]
        indexes = [
            models.Index(fields=['experiment', 'variant']),
            models.Index(fields=['experiment', 'converted']),
        ]