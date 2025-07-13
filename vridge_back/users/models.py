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
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['login_method']),
        ]


class UserProfile(core_model.TimeStampedModel):
    """사용자 프로필 정보"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name="사용자"
    )
    profile_image = models.ImageField(
        verbose_name="프로필 이미지", 
        upload_to="profile_images/", 
        null=True, 
        blank=True
    )
    bio = models.TextField(verbose_name="자기소개", max_length=500, blank=True)
    phone = models.CharField(verbose_name="전화번호", max_length=20, blank=True)
    company = models.CharField(verbose_name="회사/소속", max_length=100, blank=True)
    position = models.CharField(verbose_name="직책", max_length=100, blank=True)
    
    class Meta:
        verbose_name = "사용자 프로필"
        verbose_name_plural = "사용자 프로필"
    
    def __str__(self):
        return f"{self.user.username}의 프로필"


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


class Notification(core_model.TimeStampedModel):
    """사용자 알림 모델"""
    NOTIFICATION_TYPES = [
        ('invitation_received', '초대를 받았습니다'),
        ('invitation_accepted', '초대가 수락되었습니다'),
        ('invitation_declined', '초대가 거절되었습니다'),
        ('project_member_added', '프로젝트에 새 멤버가 추가되었습니다'),
        ('feedback_added', '새 피드백이 추가되었습니다'),
        ('project_updated', '프로젝트가 업데이트되었습니다'),
        ('system', '시스템 알림'),
    ]
    
    recipient = models.ForeignKey(
        "User",
        related_name="notifications",
        on_delete=models.CASCADE,
        verbose_name="수신자"
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        verbose_name="알림 타입"
    )
    
    title = models.CharField(
        max_length=200,
        verbose_name="알림 제목"
    )
    
    message = models.TextField(
        verbose_name="알림 내용"
    )
    
    # 관련 객체들 (선택사항)
    project_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="관련 프로젝트 ID"
    )
    
    invitation_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="관련 초대 ID"
    )
    
    # 알림 상태
    is_read = models.BooleanField(
        default=False,
        verbose_name="읽음 여부"
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="읽은 시간"
    )
    
    # 추가 데이터 (JSON)
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="추가 데이터"
    )

    class Meta:
        verbose_name = "알림"
        verbose_name_plural = "알림"
        ordering = ['-created']
        indexes = [
            models.Index(fields=['recipient', '-created']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class Friendship(core_model.TimeStampedModel):
    """친구 관계 모델"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="friendships",
        verbose_name="사용자"
    )
    friend = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="friend_of",
        verbose_name="친구"
    )
    
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('accepted', '수락됨'),
        ('declined', '거절됨'),
        ('blocked', '차단됨'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="상태"
    )
    
    # 친구 요청을 보낸 사람
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
        verbose_name="요청자"
    )
    
    # 수락/거절 시간
    responded_at = models.DateTimeField(null=True, blank=True, verbose_name="응답 시간")
    
    class Meta:
        unique_together = [['user', 'friend']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['friend', 'status']),
        ]
        verbose_name = "친구 관계"
        verbose_name_plural = "친구 관계"
    
    def __str__(self):
        return f"{self.user.email} - {self.friend.email} ({self.get_status_display()})"


class RecentInvitation(core_model.TimeStampedModel):
    """최근 초대한 사람 기록"""
    inviter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="recent_invitations",
        verbose_name="초대자"
    )
    invitee_email = models.EmailField(verbose_name="초대받은 사람 이메일")
    invitee_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="초대받은 사람 이름")
    project_name = models.CharField(max_length=200, verbose_name="프로젝트명")
    
    # 초대 횟수 (동일한 사람을 여러 번 초대한 경우)
    invitation_count = models.PositiveIntegerField(default=1, verbose_name="초대 횟수")
    last_invited_at = models.DateTimeField(auto_now=True, verbose_name="마지막 초대 시간")
    
    class Meta:
        unique_together = [['inviter', 'invitee_email']]
        ordering = ['-last_invited_at']
        verbose_name = "최근 초대"
        verbose_name_plural = "최근 초대"
    
    def __str__(self):
        return f"{self.inviter.email} -> {self.invitee_email} ({self.invitation_count}회)"
