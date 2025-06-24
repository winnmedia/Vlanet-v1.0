from django.db import models
from core import models as core_model


class FeedBack(core_model.TimeStampedModel):
    files = models.FileField(
        verbose_name="피드백 파일", upload_to="feedback_file", null=True, blank=True
    )

    class Meta:
        verbose_name = "피드백 파일"
        verbose_name_plural = "피드백 파일"

    def __str__(self):
        if self.files:
            return f"{self.files.name}"
        else:
            return f"{self.id}"


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
        return f"프로젝트 명 : {self.feedback.projects.name}"
