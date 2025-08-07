import hashlib
from django.db import models
from core import models as core_model


class DevelopmentFramework(core_model.TimeStampedModel):
    """기획안 디벨롭 프레임워크 모델"""
    name = models.CharField(verbose_name="프레임워크 이름", max_length=100)
    intro_hook = models.TextField(
        verbose_name="인트로 훅", 
        help_text="초반 5초 안에 시청자의 시선을 사로잡을 강력한 한 방"
    )
    immersion = models.TextField(
        verbose_name="몰입", 
        help_text="빠른 컷 전환과 흥미로운 전개로 시청자 몰입 유도"
    )
    twist = models.TextField(
        verbose_name="반전", 
        help_text="예상치 못한 이벤트로 지루함 방지 및 긴장감 유지"
    )
    hook_next = models.TextField(
        verbose_name="떡밥", 
        help_text="다음 콘텐츠에 대한 궁금증 유발로 재방문 유도"
    )
    is_default = models.BooleanField(
        verbose_name="기본값 여부", 
        default=False,
        help_text="이 프레임워크를 기본값으로 설정"
    )
    user = models.ForeignKey(
        "users.User",
        related_name="frameworks",
        on_delete=models.CASCADE,
        verbose_name="소유자",
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "기획안 디벨롭 프레임워크"
        verbose_name_plural = "기획안 디벨롭 프레임워크"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_default']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_framework_per_user',
                violation_error_message='사용자별로 하나의 기본 프레임워크만 설정할 수 있습니다.'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({'기본값' if self.is_default else '일반'})"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            # 다른 기본값 프레임워크를 해제
            DevelopmentFramework.objects.filter(
                user=self.user, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class AbstractItem(core_model.TimeStampedModel):
    start_date = models.DateTimeField(verbose_name="시작 날짜", null=True, blank=True)
    end_date = models.DateTimeField(verbose_name="끝나는 날짜", null=True, blank=True)

    class Meta:
        abstract = True


class BasicPlan(AbstractItem):
    class Meta:
        verbose_name = "기초 기획안 작성"
        verbose_name_plural = "기초 기획안 작성"


class Storyboard(AbstractItem):
    class Meta:
        verbose_name = "스토리보드 작성"
        verbose_name_plural = "스토리보드 작성"


class Filming(AbstractItem):
    class Meta:
        verbose_name = "촬영(계획/진행)"
        verbose_name_plural = "촬영(계획/진행)"


class VideoEdit(AbstractItem):
    class Meta:
        verbose_name = "비디오 편집"
        verbose_name_plural = "비디오 편집"


class PostWork(AbstractItem):
    class Meta:
        verbose_name = "후반 작업"
        verbose_name_plural = "후반 작업"


class VideoPreview(AbstractItem):
    class Meta:
        verbose_name = "비디오 시사"
        verbose_name_plural = "비디오 시사"


class Confirmation(AbstractItem):
    class Meta:
        verbose_name = "최종컨펌"
        verbose_name_plural = "최종컨펌"


class VideoDelivery(AbstractItem):
    class Meta:
        verbose_name = "영상 납품"
        verbose_name_plural = "영상 납품"


class File(core_model.TimeStampedModel):
    project = models.ForeignKey(
        "Project",
        related_name="files",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="프로젝트",
    )
    files = models.FileField(
        verbose_name="프로젝트 파일", upload_to="project_file", blank=False
    )
    
    class Meta:
        verbose_name = "프로젝트 파일"
        verbose_name_plural = "프로젝트 파일"
        indexes = [
            models.Index(fields=['project', '-created']),  # 프로젝트별 파일 조회 최적화
        ]


class Members(core_model.TimeStampedModel):
    RATING_CHOICES = (
        ("manager", "준관리자"),
        ("normal", "일반회원"),
    )

    project = models.ForeignKey(
        "Project",
        related_name="members",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="프로젝트",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="members",
        blank=False,
        verbose_name="유저",
    )
    rating = models.CharField(
        verbose_name="권한",
        choices=RATING_CHOICES,
        max_length=10,
        default="normal",
        blank=False,
    )

    class Meta:
        verbose_name = "멤버"
        verbose_name_plural = "멤버"
        indexes = [
            models.Index(fields=['project', 'user']),
            models.Index(fields=['user']),
        ]


class ProjectInvitation(core_model.TimeStampedModel):
    """프로젝트 초대 모델"""
    project = models.ForeignKey(
        "Project",
        related_name="invitations",
        on_delete=models.CASCADE,
        verbose_name="프로젝트",
    )
    inviter = models.ForeignKey(
        "users.User",
        related_name="sent_invitations",
        on_delete=models.CASCADE,
        verbose_name="초대자",
    )
    invitee_email = models.EmailField(verbose_name="초대받는 사람 이메일")
    message = models.TextField(verbose_name="초대 메시지", blank=True, null=True)
    
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('accepted', '수락됨'),
        ('declined', '거절됨'),
        ('expired', '만료됨'),
        ('cancelled', '취소됨'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="상태"
    )
    
    # 초대받은 사람이 가입된 사용자인 경우
    invitee = models.ForeignKey(
        "users.User",
        related_name="received_invitations",
        on_delete=models.CASCADE,
        verbose_name="초대받는 사람",
        null=True,
        blank=True,
    )
    
    token = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="초대 토큰"
    )
    
    expires_at = models.DateTimeField(verbose_name="만료일시")
    accepted_at = models.DateTimeField(verbose_name="수락일시", null=True, blank=True)
    declined_at = models.DateTimeField(verbose_name="거절일시", null=True, blank=True)

    class Meta:
        verbose_name = "프로젝트 초대"
        verbose_name_plural = "프로젝트 초대"
        unique_together = ['project', 'invitee_email']
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['invitee_email']),
            models.Index(fields=['invitee']),
            models.Index(fields=['status']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f"{self.project.name} 초대 to {self.invitee_email}"


class Memo(core_model.TimeStampedModel):
    project = models.ForeignKey(
        "Project",
        related_name="memos",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="프로젝트",
    )
    # user = models.ForeignKey(
    #     "users.User",
    #     on_delete=models.CASCADE,
    #     related_name="members",
    #     blank=False,
    #     verbose_name="유저",
    # )
    date = models.DateField(verbose_name="날짜", null=True)
    memo = models.TextField(verbose_name="메모", null=True, blank=False)

    class Meta:
        verbose_name = "프로젝트 메모"
        verbose_name_plural = "프로젝트 메모"
        indexes = [
            models.Index(fields=['project', '-date']),  # 프로젝트별 날짜순 메모 조회
        ]

    def __str__(self):
        return self.project.name


class Project(core_model.TimeStampedModel):
    user = models.ForeignKey(
        "users.User",
        related_name="projects",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="유저",
    )

    name = models.CharField(verbose_name="프로젝트 이름", max_length=100, blank=False)
    manager = models.CharField(verbose_name="담당자", max_length=50, blank=False)
    consumer = models.CharField(verbose_name="고객사", max_length=50, blank=False)
    description = models.TextField(verbose_name="프로젝트 설명", blank=True)
    color = models.CharField(verbose_name="색상", max_length=100, null=True, blank=True)
    
    tone_manner = models.CharField(verbose_name="톤앤매너", max_length=50, null=True, blank=True)
    genre = models.CharField(verbose_name="장르", max_length=50, null=True, blank=True)
    concept = models.CharField(verbose_name="콘셉트", max_length=50, null=True, blank=True)
    
    # 협업 관련 필드 - Railway 마이그레이션 문제로 임시 주석 처리
    # is_public = models.BooleanField(default=False, null=True, blank=True, verbose_name="공개 프로젝트")
    # allow_comments = models.BooleanField(default=True, null=True, blank=True, verbose_name="댓글 허용")
    # allow_anonymous_feedback = models.BooleanField(default=False, null=True, blank=True, verbose_name="익명 피드백 허용")
    # tags = models.JSONField(blank=True, null=True, default=list, verbose_name="태그")
    # last_activity = models.DateTimeField(auto_now=True, null=True, blank=True, verbose_name="마지막 활동")

    basic_plan = models.ForeignKey(
        "BasicPlan",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="기초 기획안 작성",
    )
    story_board = models.ForeignKey(
        "Storyboard",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="스토리보드 작성",
    )
    filming = models.ForeignKey(
        "Filming",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="촬영",
    )
    video_edit = models.ForeignKey(
        "VideoEdit",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="비디오 편집",
    )
    post_work = models.ForeignKey(
        "PostWork",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="후반 작업",
    )
    video_preview = models.ForeignKey(
        "VideoPreview",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="비디오 시사",
    )
    confirmation = models.ForeignKey(
        "Confirmation",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="최종컨펌",
    )
    video_delivery = models.ForeignKey(
        "VideoDelivery",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="영상 납품",
    )
    
    # development_framework 필드는 마이그레이션이 완료될 때까지 임시로 주석 처리
    # development_framework = models.ForeignKey(
    #     "DevelopmentFramework",
    #     related_name="projects",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     verbose_name="기획안 디벨롭 프레임워크",
    #     help_text="프로젝트에 적용할 기획안 디벨롭 프레임워크"
    # )

    # OneToOneField 제거 - FeedBack 모델에서 ForeignKey로 관계 설정됨

    class Meta:
        verbose_name = "1.프로젝트"
        verbose_name_plural = "1.프로젝트"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['created']),
            models.Index(fields=['name']),
        ]
        constraints = [
            # 사용자별 프로젝트명 고유성 보장 (5분 내)
            models.UniqueConstraint(
                fields=['user', 'name'],
                name='unique_user_project_name',
                violation_error_message='이미 같은 이름의 프로젝트가 존재합니다.'
            )
        ]

    def __str__(self):
        return self.name


class ProjectInvite(core_model.TimeStampedModel):
    project = models.ForeignKey(
        "projects.Project",
        related_name="invites",
        on_delete=models.CASCADE,
        blank=False,
        verbose_name="프로젝트",
    )
    email = models.CharField(
        verbose_name="초대된 이메일", max_length=100, null=True, blank=False
    )

    def __str__(self):
        if self.project.name:
            return self.project.name
        else:
            return self.project.id

    class Meta:
        verbose_name = "프로젝트 초대"
        verbose_name_plural = "프로젝트 초대"


class SampleFiles(core_model.TimeStampedModel):
    files = models.FileField(verbose_name="샘플파일", upload_to="sample_file", blank=False)

    class Meta:
        verbose_name = "샘플파일"
        verbose_name_plural = "샘플파일"

    def __str__(self):
        return str(self.files.name)


class IdempotencyRecord(models.Model):
    """멱등성 체크를 위한 데이터베이스 모델"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    idempotency_key = models.CharField(max_length=255, db_index=True)
    project_id = models.IntegerField(null=True, blank=True)
    request_data = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='processing')
    
    class Meta:
        unique_together = [['user', 'idempotency_key']]
        indexes = [
            models.Index(fields=['created_at']),
        ]
        verbose_name = "멱등성 레코드"
        verbose_name_plural = "멱등성 레코드"
