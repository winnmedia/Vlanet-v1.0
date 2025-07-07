"""
VideoPlanning/Calendar/ProjectCreate/Feedback API에서 자동 생성된 Django 모델
"""
from django.db import models
from django.contrib.auth.models import User


class VideoPlanningFromSpec(models.Model):
    """API 스펙에서 자동 생성된 VideoPlanning 모델"""
    title = models.CharField(max_length=255, null=True, blank=True)
    planning_text = models.CharField(max_length=255, null=True, blank=True)
    stories = models.JSONField(default=dict, null=True, blank=True)
    selected_story = models.JSONField(default=dict, null=True, blank=True)
    scenes = models.JSONField(default=dict, null=True, blank=True)
    shots = models.JSONField(default=dict, null=True, blank=True)
    storyboards = models.JSONField(default=dict, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    current_step = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'videoplanning_from_spec'
        verbose_name = 'VideoPlanning (API 스펙)'
        verbose_name_plural = 'VideoPlannings (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return self.title or str(self.pk)


class ProjectFromSpec(models.Model):
    """API 스펙에서 자동 생성된 Project 모델"""
    name = models.CharField(max_length=255, null=True, blank=True)
    manager = models.CharField(max_length=255, null=True, blank=True)
    consumer = models.CharField(max_length=255, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    color = models.CharField(max_length=255, null=True, blank=True)
    tone_manner = models.CharField(max_length=255, null=True, blank=True)
    genre = models.CharField(max_length=255, null=True, blank=True)
    concept = models.CharField(max_length=255, null=True, blank=True)
    created = models.CharField(max_length=255, null=True, blank=True)
    updated = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'project_from_spec'
        verbose_name = 'Project (API 스펙)'
        verbose_name_plural = 'Projects (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return self.name or str(self.pk)


class FeedbackFromSpec(models.Model):
    """API 스펙에서 자동 생성된 Feedback 모델"""
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback_from_spec'
        verbose_name = 'Feedback (API 스펙)'
        verbose_name_plural = 'Feedbacks (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return self.title or str(self.pk)


class UserFromSpec(models.Model):
    """API 스펙에서 자동 생성된 User 모델"""
    username = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=254, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_from_spec'
        verbose_name = 'User (API 스펙)'
        verbose_name_plural = 'Users (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return f'User({self.pk})'


class VideoAnalysisResultFromSpec(models.Model):
    """API 스펙에서 자동 생성된 VideoAnalysisResult 모델"""
    video_id = models.CharField(max_length=255, null=True, blank=True)
    analysis_status = models.CharField(max_length=255, null=True, blank=True)
    twelve_labs_video_id = models.CharField(max_length=255, null=True, blank=True)
    index_id = models.CharField(max_length=255, null=True, blank=True)
    analysis_data = models.JSONField(default=dict, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'videoanalysisresult_from_spec'
        verbose_name = 'VideoAnalysisResult (API 스펙)'
        verbose_name_plural = 'VideoAnalysisResults (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return f'VideoAnalysisResult({self.pk})'


class AIFeedbackItemFromSpec(models.Model):
    """API 스펙에서 자동 생성된 AIFeedbackItem 모델"""
    feedback_type = models.CharField(max_length=255, null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    teacher_personality = models.CharField(max_length=255, null=True, blank=True)
    feedback_content = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'aifeedbackitem_from_spec'
        verbose_name = 'AIFeedbackItem (API 스펙)'
        verbose_name_plural = 'AIFeedbackItems (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return f'AIFeedbackItem({self.pk})'


class IdempotencyRecordFromSpec(models.Model):
    """API 스펙에서 자동 생성된 IdempotencyRecord 모델"""
    idempotency_key = models.CharField(max_length=255, null=True, blank=True)
    project_id = models.IntegerField(null=True, blank=True)
    request_data = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'idempotencyrecord_from_spec'
        verbose_name = 'IdempotencyRecord (API 스펙)'
        verbose_name_plural = 'IdempotencyRecords (API 스펙)'
        ordering = ['-id']

    def __str__(self):
        return f'IdempotencyRecord({self.pk})'

