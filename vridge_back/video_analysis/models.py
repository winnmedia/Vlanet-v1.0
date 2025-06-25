"""
AI 영상 분석 결과 모델
"""
from django.db import models
from django.conf import settings
from feedbacks.models import FeedBack
import json


class VideoAnalysisResult(models.Model):
    """AI 영상 분석 결과"""
    
    ANALYSIS_STATUS_CHOICES = [
        ('pending', '대기중'),
        ('processing', '분석중'),
        ('completed', '완료'),
        ('failed', '실패'),
    ]
    
    feedback = models.OneToOneField(
        FeedBack, 
        on_delete=models.CASCADE,
        related_name='ai_analysis'
    )
    
    status = models.CharField(
        max_length=20,
        choices=ANALYSIS_STATUS_CHOICES,
        default='pending'
    )
    
    # 전체 점수
    overall_score = models.FloatField(null=True, blank=True)
    
    # 분석 결과 (JSON)
    analysis_data = models.JSONField(default=dict)
    
    # 처리 시간
    processing_time = models.FloatField(null=True, blank=True)
    
    # AI 서버 정보
    ai_server_url = models.URLField(blank=True)
    ai_model_version = models.CharField(max_length=50, blank=True)
    
    # 생성/수정 시간
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 에러 정보
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'video_analysis_results'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis for {self.feedback.title} - {self.status}"
    
    @property
    def feedback_list(self):
        """분석 피드백 리스트 반환"""
        return self.analysis_data.get('feedback', [])
    
    @property
    def technical_info(self):
        """기술적 분석 정보 반환"""
        return self.analysis_data.get('technical_analysis', {})
    
    @property
    def improvement_suggestions(self):
        """개선 제안 리스트 반환"""
        return self.analysis_data.get('improvement_suggestions', [])


class AIFeedbackItem(models.Model):
    """AI 피드백 항목"""
    
    FEEDBACK_TYPES = [
        ('composition', '구도'),
        ('lighting', '조명'),
        ('audio', '음성'),
        ('stability', '안정성'),
        ('color', '색감'),
        ('motion', '움직임'),
        ('editing', '편집'),
        ('storytelling', '스토리텔링'),
    ]
    
    analysis_result = models.ForeignKey(
        VideoAnalysisResult,
        on_delete=models.CASCADE,
        related_name='feedback_items'
    )
    
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    score = models.FloatField()  # 0-10 점수
    message = models.TextField()  # 피드백 메시지
    timestamp = models.FloatField()  # 영상 내 시점 (초)
    confidence = models.FloatField(default=1.0)  # AI 신뢰도
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_feedback_items'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.get_feedback_type_display()} - {self.score}/10"


class AIAnalysisSettings(models.Model):
    """AI 분석 설정"""
    
    # 분석 활성화 여부
    is_enabled = models.BooleanField(default=False)
    
    # AI 서버 설정
    ai_server_url = models.URLField(
        default='',
        help_text='GCP GPU 서버 URL'
    )
    api_key = models.CharField(max_length=255, blank=True)
    
    # 분석 옵션
    analyze_composition = models.BooleanField(default=True)
    analyze_lighting = models.BooleanField(default=True)
    analyze_audio = models.BooleanField(default=True)
    analyze_stability = models.BooleanField(default=True)
    analyze_color = models.BooleanField(default=True)
    analyze_motion = models.BooleanField(default=True)
    
    # 성능 설정
    max_video_duration = models.IntegerField(
        default=300,  # 5분
        help_text='분석할 최대 영상 길이 (초)'
    )
    analysis_timeout = models.IntegerField(
        default=600,  # 10분
        help_text='분석 타임아웃 (초)'
    )
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'ai_analysis_settings'
        verbose_name = 'AI 분석 설정'
        verbose_name_plural = 'AI 분석 설정'
    
    def save(self, *args, **kwargs):
        # 싱글톤 패턴 - 하나의 설정만 허용
        if not self.pk and AIAnalysisSettings.objects.exists():
            raise ValueError('AI 분석 설정은 하나만 존재할 수 있습니다.')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """현재 AI 분석 설정 반환"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def __str__(self):
        status = "활성화" if self.is_enabled else "비활성화"
        return f"AI 분석 설정 - {status}"