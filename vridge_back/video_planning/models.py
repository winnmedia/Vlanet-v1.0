from django.db import models
from django.conf import settings
from django.utils import timezone


class VideoPlanning(models.Model):
    """영상 기획 정보를 저장하는 모델"""
    
    # 기본 정보
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='video_plannings')
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
        return f"{self.title} - {self.user.username}"
    
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