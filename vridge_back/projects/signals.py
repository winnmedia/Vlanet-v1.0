from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import DevelopmentFramework

User = get_user_model()

@receiver(post_save, sender=User)
def create_default_framework(sender, instance, created, **kwargs):
    """새 사용자 생성 시 기본 프레임워크 자동 생성"""
    if created:
        # 기본 프레임워크가 없는 경우에만 생성
        if not DevelopmentFramework.objects.filter(user=instance).exists():
            DevelopmentFramework.objects.create(
                user=instance,
                name='기본 영상 프레임워크',
                intro_hook='첫 5초가 승부다! 시청자의 호기심을 자극하는 강렬한 오프닝으로 시작하세요. 충격적인 질문, 놀라운 사실, 또는 예상치 못한 장면으로 시청자를 사로잡으세요.',
                immersion='빠른 템포와 다이나믹한 편집으로 몰입도를 높이세요. 2-3초마다 컷을 전환하고, 시각적 변화를 주어 지루함을 방지하세요. 중요한 포인트는 자막과 효과음으로 강조하세요.',
                twist='중반부에 예상치 못한 전개로 긴장감을 유지하세요. 반전 요소, 새로운 정보 공개, 또는 관점의 변화를 통해 시청자의 관심을 끝까지 유지하세요.',
                hook_next='영상 마지막에 다음 콘텐츠에 대한 예고나 질문을 남기세요. "다음 영상에서는..." 또는 "이것의 진짜 비밀은..."과 같은 떡밥으로 재방문을 유도하세요.',
                is_default=True
            )