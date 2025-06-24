import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from core import managers, models as core_model


class User(AbstractUser):
    LOGIN_CHOICES = (
        ("email", "Email"),
        ("google", "Google"),
        ("kakao", "Kakao"),
        ("naver", "Naver"),
    )

    nickname = models.CharField(verbose_name="닉네임", max_length=100, blank=True)
    login_method = models.CharField(
        max_length=50, verbose_name="로그인 방식", choices=LOGIN_CHOICES, default="email"
    )
    email_secret = models.CharField(verbose_name="비밀번호 찾기(인증번호)", max_length=10, null=True, blank=True)
    objects = managers.CustomUserManager()

    class Meta:
        verbose_name = "사용자"
        verbose_name_plural = "사용자"


class EmailVerify(core_model.TimeStampedModel):
    email = models.CharField(verbose_name="발송 이메일", max_length=200)
    auth_number = models.CharField(verbose_name="인증번호", max_length=10)

    def __str__(self):
        return f"{self.email} - {self.auth_number}"

    class Meta:
        verbose_name = "이메일 인증번호"
        verbose_name_plural = "이메일 인증번호"


class UserMemo(core_model.TimeStampedModel):
    user = models.ForeignKey(
        "User", related_name="memos", on_delete=models.CASCADE, verbose_name="메모", null=True, blank=True
    )
    date = models.DateField(verbose_name="날짜", null=True)
    memo = models.TextField(verbose_name="메모", null=True, blank=False)

    class Meta:
        verbose_name = "사용자 메모"
        verbose_name_plural = "사용자 메모"

    def __str__(self):
        return self.user.nickname
