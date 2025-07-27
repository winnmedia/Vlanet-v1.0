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
        try:
            if self.files and hasattr(self.files, 'name'):
                video_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
                return any(self.files.name.lower().endswith(ext) for ext in video_extensions)
        except Exception:
            pass
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
    DISPLAY_MODE_CHOICES = [
        ('anonymous', '익명'),
        ('nickname', '닉네임'),
        ('realname', '실명'),
    ]
    
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
    display_mode = models.CharField(
        verbose_name="표시 모드",
        max_length=20,
        choices=DISPLAY_MODE_CHOICES,
        default='anonymous',
        help_text="피드백 작성자 표시 방식"
    )
    nickname = models.CharField(
        verbose_name="닉네임",
        max_length=20,
        null=True,
        blank=True,
        help_text="닉네임 모드일 때 사용할 이름"
    )
    title = models.TextField(verbose_name="제목", null=True, blank=False)
    section = models.TextField(verbose_name="구간", null=True, blank=False)
    text = models.TextField(verbose_name="내용", null=True, blank=False)
    
    # 새로운 필드 추가
    is_important = models.BooleanField(
        verbose_name="중요표시", 
        default=False,
        help_text="중요한 피드백 표시"
    )
    parent = models.ForeignKey(
        'self',
        related_name='replies',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="부모 댓글"
    )

    class Meta:
        verbose_name = "피드백 등록"
        verbose_name_plural = "피드백 등록"
        ordering = ("-created",)
        indexes = [
            models.Index(fields=['feedback', '-created']),  # 피드백별 코멘트 조회 최적화
            models.Index(fields=['user']),  # 사용자별 코멘트 조회
            models.Index(fields=['parent']),  # 답글 조회 최적화
            models.Index(fields=['is_important']),  # 중요 피드백 조회
        ]

    def __str__(self):
        if self.feedback and hasattr(self.feedback, 'projects') and self.feedback.projects:
            return f"프로젝트 명 : {self.feedback.projects.name}"
        return f"피드백 댓글 #{self.id}"


class FeedbackReaction(core_model.TimeStampedModel):
    REACTION_CHOICES = [
        ('like', '좋아요'),
        ('dislike', '싫어요'),
    ]
    
    comment = models.ForeignKey(
        FeedBackComment,
        related_name='reactions',
        on_delete=models.CASCADE,
        verbose_name="피드백 댓글"
    )
    user = models.ForeignKey(
        "users.User",
        related_name='feedback_reactions',
        on_delete=models.CASCADE,
        verbose_name="사용자"
    )
    reaction = models.CharField(
        max_length=10,
        choices=REACTION_CHOICES,
        verbose_name="반응"
    )
    
    class Meta:
        verbose_name = "피드백 반응"
        verbose_name_plural = "피드백 반응"
        unique_together = ['comment', 'user']  # 사용자당 하나의 반응만
        indexes = [
            models.Index(fields=['comment', 'user']),  # 반응 조회 최적화
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.comment.id} - {self.reaction}"


class GuestFeedbackSession(core_model.TimeStampedModel):
    """게스트 피드백 세션 모델"""
    token = models.CharField(
        verbose_name="세션 토큰",
        max_length=100,
        unique=True,
        help_text="게스트 세션 식별 토큰"
    )
    project = models.ForeignKey(
        "projects.Project",
        related_name="guest_sessions",
        on_delete=models.CASCADE,
        verbose_name="프로젝트"
    )
    invitation = models.ForeignKey(
        "projects.ProjectInvitation",
        related_name="guest_sessions",
        on_delete=models.CASCADE,
        verbose_name="초대",
        null=True,
        blank=True
    )
    guest_name = models.CharField(
        verbose_name="게스트 이름",
        max_length=100,
        help_text="게스트가 입력한 이름"
    )
    guest_email = models.EmailField(
        verbose_name="게스트 이메일",
        null=True,
        blank=True,
        help_text="게스트가 입력한 이메일"
    )
    ip_address = models.GenericIPAddressField(
        verbose_name="IP 주소",
        null=True,
        blank=True
    )
    user_agent = models.TextField(
        verbose_name="User Agent",
        null=True,
        blank=True
    )
    expires_at = models.DateTimeField(
        verbose_name="만료 시간",
        help_text="세션 만료 시간"
    )
    is_active = models.BooleanField(
        verbose_name="활성 상태",
        default=True
    )
    last_activity = models.DateTimeField(
        verbose_name="마지막 활동",
        auto_now=True
    )
    
    class Meta:
        verbose_name = "게스트 피드백 세션"
        verbose_name_plural = "게스트 피드백 세션"
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['project']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.guest_name} - {self.project.name}"
    
    def is_expired(self):
        """세션이 만료되었는지 확인"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
