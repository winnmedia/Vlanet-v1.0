from django.db import models
from core import models as core_model


class FeedBack(core_model.TimeStampedModel):
    # Original file
    files = models.FileField(
        verbose_name="피드백 파일", upload_to="feedback_file", null=True, blank=True
    )
    
    # Encoded versions
    video_file_web = models.FileField(
        verbose_name="웹 최적화 버전", upload_to="feedback_file/web", null=True, blank=True
    )
    video_file_high = models.CharField(
        verbose_name="고화질 버전 경로", max_length=500, null=True, blank=True
    )
    video_file_medium = models.CharField(
        verbose_name="중화질 버전 경로", max_length=500, null=True, blank=True
    )
    video_file_low = models.CharField(
        verbose_name="저화질 버전 경로", max_length=500, null=True, blank=True
    )
    
    # Thumbnail - Temporarily changed to FileField due to missing Pillow
    thumbnail = models.FileField(
        verbose_name="썸네일", upload_to="feedback_file/thumbnails", null=True, blank=True
    )
    
    # HLS streaming
    hls_playlist_url = models.CharField(
        verbose_name="HLS 플레이리스트 URL", max_length=500, null=True, blank=True
    )
    
    # Encoding status
    ENCODING_STATUS_CHOICES = [
        ('pending', '대기중'),
        ('processing', '처리중'),
        ('completed', '완료'),
        ('failed', '실패'),
        ('partial', '부분완료'),
    ]
    encoding_status = models.CharField(
        verbose_name="인코딩 상태",
        max_length=20,
        choices=ENCODING_STATUS_CHOICES,
        default='pending',
        null=True,
        blank=True
    )
    
    # Video metadata
    duration = models.FloatField(verbose_name="영상 길이(초)", null=True, blank=True)
    width = models.IntegerField(verbose_name="영상 너비", null=True, blank=True)
    height = models.IntegerField(verbose_name="영상 높이", null=True, blank=True)
    file_size = models.BigIntegerField(verbose_name="파일 크기(bytes)", null=True, blank=True)

    class Meta:
        verbose_name = "피드백 파일"
        verbose_name_plural = "피드백 파일"

    def __str__(self):
        if self.files:
            return f"{self.files.name}"
        else:
            return f"{self.id}"
    
    @property
    def video_file(self):
        """Backward compatibility property"""
        return self.files
    
    @property
    def is_video(self):
        """Check if uploaded file is a video"""
        if self.files:
            video_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
            return any(self.files.name.lower().endswith(ext) for ext in video_extensions)
        return False


class FeedBackMessage(core_model.TimeStampedModel):
    feedback = models.ForeignKey(
        "FeedBack",
        related_name="messages",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="피드백 파일",
    )
    user = models.ForeignKey(
        "users.User",
        related_name="messages",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="사용자",
    )
    text = models.TextField(verbose_name="내용", blank=False)

    class Meta:
        verbose_name = "피드백 대화방"
        verbose_name_plural = "피드백 대화방"


class FeedBackComment(core_model.TimeStampedModel):
    feedback = models.ForeignKey(
        "FeedBack",
        related_name="comments",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="피드백",
    )
    user = models.ForeignKey(
        "users.User",
        related_name="comments",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="사용자",
    )
    security = models.BooleanField(verbose_name="익명", default=False)
    title = models.TextField(verbose_name="제목", null=True, blank=False)
    section = models.TextField(verbose_name="구간", null=True, blank=False)
    text = models.TextField(verbose_name="내용", null=True, blank=False)

    class Meta:
        verbose_name = "피드백 등록"
        verbose_name_plural = "피드백 등록"
        ordering = ("-created",)

    def __str__(self):
        if self.feedback and hasattr(self.feedback, 'projects') and self.feedback.projects:
            return f"프로젝트 명 : {self.feedback.projects.name}"
        return f"피드백 댓글 #{self.id}"
