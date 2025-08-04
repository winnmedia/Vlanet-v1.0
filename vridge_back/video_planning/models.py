from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MaxValueValidator, MinValueValidator
import json


class VideoPlanning(models.Model):
    """영상 기획 정보를 저장하는 모델"""
    
    # 기본 정보
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='video_plannings', null=True, blank=True)
    title = models.CharField(max_length=200)
    planning_text = models.TextField(help_text="초기 기획안 텍스트")
    
    # 생성된 데이터 (JSON 형태로 저장)
    stories = models.JSONField(default=list, help_text="생성된 스토리 목록")
    selected_story = models.JSONField(null=True, blank=True, help_text="선택된 스토리")
    
    scenes = models.JSONField(default=list, help_text="생성된 씬 목록")
    selected_scene = models.JSONField(null=True, blank=True, help_text="선택된 씬")
    
    shots = models.JSONField(default=list, help_text="생성된 숏 목록")
    selected_shot = models.JSONField(null=True, blank=True, help_text="선택된 숏")
    
    storyboards = models.JSONField(default=list, help_text="생성된 스토리보드(콘티) 목록")
    
    # 기획 옵션 (톤앤매너, 장르 등) - 확장된 구조
    planning_options = models.JSONField(default=dict, help_text="기획 옵션 (톤, 장르, 컨셉 등)")
    
    # 프로 옵션 - 영상 제작 전문 설정 (마이그레이션 0005에서 제거됨)
    # color_tone = models.JSONField(default=dict, help_text="컬러톤 설정 (primary, secondary, mood 등)")
    # camera_settings = models.JSONField(default=dict, help_text="카메라 설정 (해상도, 프레임레이트, 촬영기법 등)")
    # lighting_setup = models.JSONField(default=dict, help_text="조명 설정 (키라이트, 필라이트, 백라이트 등)")
    # audio_config = models.JSONField(default=dict, help_text="오디오 설정 (BGM, 효과음, 내레이션 등)")
    
    # AI 생성 옵션 (마이그레이션 0005에서 제거됨)
    # ai_generation_config = models.JSONField(default=dict, help_text="AI 생성 설정 (스타일, 품질, 모델 등)")
    # prompt_templates = models.JSONField(default=list, help_text="사용된 프롬프트 템플릿 목록")
    
    # 협업 관련 (마이그레이션 0005에서 제거됨)
    # collaboration_settings = models.JSONField(default=dict, help_text="협업 설정 (권한, 피드백 옵션 등)")
    # workflow_config = models.JSONField(default=dict, help_text="워크플로우 설정 (단계별 승인, 자동화 등)")
    
    # 상태 관리
    is_completed = models.BooleanField(default=False, help_text="기획 완료 여부")
    current_step = models.IntegerField(default=1, help_text="현재 진행 단계 (1-5)")
    
    # 메타데이터
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'video_planning'
        verbose_name = '영상 기획'
        verbose_name_plural = '영상 기획 목록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{self.title} - {username}"
    
    def save(self, *args, **kwargs):
        # 제목이 없으면 기획안 텍스트의 일부를 제목으로 사용
        if not self.title and self.planning_text:
            self.title = self.planning_text[:50] + "..." if len(self.planning_text) > 50 else self.planning_text
        super().save(*args, **kwargs)


class VideoPlanningImage(models.Model):
    """스토리보드 이미지를 저장하는 모델"""
    
    planning = models.ForeignKey(VideoPlanning, on_delete=models.CASCADE, related_name='images')
    frame_number = models.IntegerField()
    image_url = models.URLField(max_length=500)
    prompt_used = models.TextField(blank=True, help_text="이미지 생성에 사용된 프롬프트")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'video_planning_image'
        verbose_name = '스토리보드 이미지'
        verbose_name_plural = '스토리보드 이미지 목록'
        ordering = ['planning', 'frame_number']
        unique_together = ['planning', 'frame_number']
    
    def __str__(self):
        return f"{self.planning.title} - Frame {self.frame_number}"
    
    def get_thumbnail_url(self):
        """썸네일 URL 반환 (추후 이미지 최적화 시 사용)"""
        return self.image_url


class VideoPlanningProTemplate(models.Model):
    """영상 기획 프로 템플릿 모델"""
    
    name = models.CharField(max_length=100, help_text="템플릿 이름")
    category = models.CharField(max_length=50, help_text="카테고리 (corporate, creative, educational 등)")
    description = models.TextField(help_text="템플릿 설명")
    
    # 템플릿 설정
    default_color_tone = models.JSONField(help_text="기본 컬러톤 설정")
    default_camera_settings = models.JSONField(help_text="기본 카메라 설정")
    default_lighting_setup = models.JSONField(help_text="기본 조명 설정")
    default_audio_config = models.JSONField(help_text="기본 오디오 설정")
    
    # 메타데이터
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0, help_text="사용 횟수")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'video_planning_pro_template'
        verbose_name = '영상 기획 프로 템플릿'
        verbose_name_plural = '영상 기획 프로 템플릿 목록'
        ordering = ['-usage_count', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"
    
    def increment_usage(self):
        """사용 횟수 증가"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class VideoPlanningCollaboration(models.Model):
    """영상 기획 협업 모델"""
    
    ROLE_CHOICES = [
        ('owner', '소유자'),
        ('editor', '편집자'),
        ('viewer', '뷰어'),
        ('reviewer', '리뷰어'),
    ]
    
    STATUS_CHOICES = [
        ('invited', '초대됨'),
        ('accepted', '수락됨'),
        ('declined', '거절됨'),
        ('removed', '제거됨'),
    ]
    
    planning = models.ForeignKey(VideoPlanning, on_delete=models.CASCADE, related_name='collaborations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='invited')
    
    # 권한 설정
    can_edit = models.BooleanField(default=False)
    can_comment = models.BooleanField(default=True)
    can_approve = models.BooleanField(default=False)
    can_invite = models.BooleanField(default=False)
    
    # 메타데이터
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='video_planning_invitations_sent')
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'video_planning_collaboration'
        verbose_name = '영상 기획 협업'
        verbose_name_plural = '영상 기획 협업 목록'
        unique_together = ['planning', 'user']
        indexes = [
            models.Index(fields=['planning', 'status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.planning.title} - {self.user.username} ({self.get_role_display()})"
    
    def accept_invitation(self):
        """초대 수락"""
        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.save()
    
    def decline_invitation(self):
        """초대 거절"""
        self.status = 'declined'
        self.responded_at = timezone.now()
        self.save()
    
    def update_last_access(self):
        """마지막 접근 시간 업데이트"""
        self.last_accessed = timezone.now()
        self.save(update_fields=['last_accessed'])


class VideoPlanningAIPrompt(models.Model):
    """AI 프롬프트 관리 모델"""
    
    TYPE_CHOICES = [
        ('story', '스토리 생성'),
        ('scene', '씬 생성'),
        ('shot', '숏 생성'),
        ('image', '이미지 생성'),
        ('storyboard', '스토리보드 생성'),
    ]
    
    planning = models.ForeignKey(VideoPlanning, on_delete=models.CASCADE, related_name='ai_prompts')
    prompt_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    original_prompt = models.TextField(help_text="원본 프롬프트")
    enhanced_prompt = models.TextField(help_text="AI로 향상된 프롬프트")
    
    # 생성 결과
    generation_result = models.JSONField(null=True, blank=True, help_text="AI 생성 결과")
    is_successful = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, help_text="오류 메시지")
    
    # 성능 메트릭
    generation_time = models.FloatField(null=True, blank=True, help_text="생성 시간(초)")
    tokens_used = models.IntegerField(null=True, blank=True, help_text="사용된 토큰 수")
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text="예상 비용")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'video_planning_ai_prompt'
        verbose_name = 'AI 프롬프트'
        verbose_name_plural = 'AI 프롬프트 목록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['planning', 'prompt_type']),
            models.Index(fields=['is_successful', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_prompt_type_display()} - {self.planning.title}"
    
    def get_success_rate(self):
        """해당 기획의 성공률 반환"""
        total = VideoPlanningAIPrompt.objects.filter(planning=self.planning).count()
        successful = VideoPlanningAIPrompt.objects.filter(planning=self.planning, is_successful=True).count()
        return (successful / total * 100) if total > 0 else 0


class VideoPlanningAnalytics(models.Model):
    """영상 기획 분석 데이터 모델"""
    
    planning = models.OneToOneField(VideoPlanning, on_delete=models.CASCADE, related_name='analytics')
    
    # 사용 통계
    view_count = models.IntegerField(default=0)
    edit_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    collaboration_count = models.IntegerField(default=0)
    
    # AI 사용 통계
    ai_generation_count = models.IntegerField(default=0)
    ai_success_rate = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    total_tokens_used = models.IntegerField(default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0)
    
    # 성능 메트릭
    avg_generation_time = models.FloatField(default=0.0)
    completion_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    quality_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    
    # 시간 추적
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'video_planning_analytics'
        verbose_name = '영상 기획 분석'
        verbose_name_plural = '영상 기획 분석 목록'
    
    def __str__(self):
        return f"{self.planning.title} - Analytics"
    
    def update_metrics(self):
        """메트릭 업데이트"""
        # AI 프롬프트 성공률 계산
        ai_prompts = self.planning.ai_prompts.all()
        if ai_prompts.exists():
            successful = ai_prompts.filter(is_successful=True).count()
            self.ai_success_rate = (successful / ai_prompts.count()) * 100
            self.ai_generation_count = ai_prompts.count()
            self.total_tokens_used = sum(p.tokens_used or 0 for p in ai_prompts)
            self.total_cost = sum(p.cost_estimate or 0 for p in ai_prompts)
            
            # 평균 생성 시간
            times = [p.generation_time for p in ai_prompts if p.generation_time]
            if times:
                self.avg_generation_time = sum(times) / len(times)
        
        # 협업 통계
        self.collaboration_count = self.planning.collaborations.filter(status='accepted').count()
        
        # 완성도 계산
        completion_factors = [
            bool(self.planning.selected_story),
            bool(self.planning.selected_scene),
            bool(self.planning.selected_shot),
            bool(self.planning.storyboards),
            self.planning.is_completed
        ]
        self.completion_percentage = (sum(completion_factors) / len(completion_factors)) * 100
        
        self.save()
    
    def get_efficiency_rating(self):
        """효율성 등급 반환"""
        if self.ai_success_rate >= 90 and self.avg_generation_time <= 10:
            return 'excellent'
        elif self.ai_success_rate >= 75 and self.avg_generation_time <= 20:
            return 'good'
        elif self.ai_success_rate >= 60:
            return 'average'
        else:
            return 'needs_improvement'