import hashlib
from django.db import models
from core import models as core_model


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

    feedback = models.OneToOneField(
        "feedbacks.Feedback",
        related_name="projects",
        on_delete=models.CASCADE,
        blank=False,
        null=True,
        verbose_name="피드백",
    )

    class Meta:
        verbose_name = "1.프로젝트"
        verbose_name_plural = "1.프로젝트"

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
