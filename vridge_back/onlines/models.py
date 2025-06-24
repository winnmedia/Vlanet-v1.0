from django.db import models
from core.models import TimeStampedModel


class OnlineVideo(TimeStampedModel):
    link = models.TextField(verbose_name="링크", null=True, blank=False)

    class Meta:
        verbose_name = "온라인 강의"
        verbose_name_plural = "온라인 강의"
        ordering = ("-created",)

    def __str__(self):
        return "링크를 입력해주세요."
