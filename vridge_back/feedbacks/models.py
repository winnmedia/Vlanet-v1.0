from django.db import models
from core import models as core_model


class FeedBack(core_model.TimeStampedModel):
    # Project relationship
    project = models.ForeignKey(
        "projects.Project",
        related_name="feedbacks",
        on_delete=models.CASCADE,
        verbose_name="프로젝트",
        null=True,  # 임시로 null 허용 (기존 데이터 보존)
        blank=True
    )
    
    # User who created the feedback
    user = models.ForeignKey(
        "users.User",
        related_name="feedbacks",
        on_delete=models.CASCADE,
        verbose_name="작성자",
        null=True,  # 임시로 null 허용 (기존 데이터 보존)
        blank=True
    )
    
    # Feedback metadata
    title = models.CharField(
        verbose_name="제목",
        max_length=200,
        null=True,
        blank=True
    )
    description = models.TextField(
        verbose_name="설명",
        null=True,
        blank=True
    )
    
    # Status
    STATUS_CHOICES = [
        ('open', '진행중'),
        ('resolved', '해결됨'),
        ('closed', '종료됨'),
    ]
    status = models.CharField(
        verbose_name="상태",
        max_length=20,
        choices=STATUS_CHOICES,
        default='open'
    )
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
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('completed', '완료'),
    ]
    
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
    status = models.CharField(
        verbose_name="상태",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="피드백 메시지 처리 상태"
    )

    class Meta:
        verbose_name = "피드백 대화방"
        verbose_name_plural = "피드백 대화방"
        ordering = ("-created",)
        indexes = [
            models.Index(fields=['feedback', '-created']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
        ]


class FeedBackComment(core_model.TimeStampedModel):
    # Timestamp for video position
    timestamp = models.FloatField(
        verbose_name="타임스탬프",
        null=True,
        blank=True,
        help_text="영상의 특정 시점 (초 단위)"
    )
    
    # Comment type
    TYPE_CHOICES = [
        ('general', '일반'),
        ('technical', '기술적'),
        ('creative', '창의적'),
        ('urgent', '긴급'),
    ]
    type = models.CharField(
        verbose_name="유형",
        max_length=20,
        choices=TYPE_CHOICES,
        default='general'
    )
    
    # Comment content
    content = models.TextField(
        verbose_name="내용",
        null=True,
        blank=True
    )
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
    
    # Add content field as an alias for compatibility
    @property
    def content(self):
        return self.text
    
    @content.setter
    def content(self, value):
        self.text = value

    class Meta:
        verbose_name = "피드백 등록"
        verbose_name_plural = "피드백 등록"
        ordering = ("-created",)
        indexes = [
            models.Index(fields=['feedback', '-created']),  # 피드백별 코멘트 조회 최적화
            models.Index(fields=['user']),  # 사용자별 코멘트 조회
        ]

    def __str__(self):
        if self.feedback and hasattr(self.feedback, 'projects') and self.feedback.projects:
            return f"프로젝트 명 : {self.feedback.projects.name}"
        return f"피드백 댓글 #{self.id}"


class FeedbackReaction(core_model.TimeStampedModel):
    """피드백 메시지에 대한 반응"""
    REACTION_CHOICES = [
        ('like', '도움됨'),
        ('dislike', '아쉬움'),
        ('needExplanation', '설명필요'),
    ]
    
    message = models.ForeignKey(
        FeedBackMessage,
        related_name='reactions',
        on_delete=models.CASCADE,
        verbose_name="피드백 메시지"
    )
    user = models.ForeignKey(
        "users.User",
        related_name='feedback_reactions',
        on_delete=models.CASCADE,
        verbose_name="사용자"
    )
    reaction_type = models.CharField(
        verbose_name="반응 타입",
        max_length=20,
        choices=REACTION_CHOICES
    )
    
    class Meta:
        verbose_name = "피드백 반응"
        verbose_name_plural = "피드백 반응"
        unique_together = ['message', 'user']  # 한 사용자는 하나의 메시지에 하나의 반응만
        indexes = [
            models.Index(fields=['message', 'user']),
            models.Index(fields=['reaction_type']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.message} - {self.reaction_type}"


class FeedbackFile(core_model.TimeStampedModel):
    """피드백에 첨부된 파일"""
    feedback = models.ForeignKey(
        FeedBack,
        related_name='attached_files',
        on_delete=models.CASCADE,
        verbose_name="피드백"
    )
    file = models.FileField(
        verbose_name="파일",
        upload_to="feedback_files/%Y/%m/%d/"
    )
    filename = models.CharField(
        verbose_name="파일명",
        max_length=255
    )
    file_type = models.CharField(
        verbose_name="파일 타입",
        max_length=50,
        null=True,
        blank=True
    )
    file_size = models.BigIntegerField(
        verbose_name="파일 크기(bytes)",
        null=True,
        blank=True
    )
    uploaded_by = models.ForeignKey(
        "users.User",
        related_name='uploaded_feedback_files',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="업로드한 사용자"
    )
    
    class Meta:
        verbose_name = "피드백 파일"
        verbose_name_plural = "피드백 파일"
        ordering = ("-created",)
        indexes = [
            models.Index(fields=['feedback', '-created']),
            models.Index(fields=['uploaded_by']),
        ]
    
    def __str__(self):
        return f"{self.feedback} - {self.filename}"
