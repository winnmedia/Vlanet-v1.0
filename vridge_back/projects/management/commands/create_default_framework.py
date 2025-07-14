from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import DevelopmentFramework

User = get_user_model()

class Command(BaseCommand):
    help = '모든 사용자에게 기본 프레임워크 생성'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='특정 사용자 ID에만 프레임워크 생성',
        )

    def handle(self, *args, **options):
        default_framework_data = {
            'name': '기본 영상 프레임워크',
            'intro_hook': '첫 5초가 승부다! 시청자의 호기심을 자극하는 강렬한 오프닝으로 시작하세요. 충격적인 질문, 놀라운 사실, 또는 예상치 못한 장면으로 시청자를 사로잡으세요.',
            'immersion': '빠른 템포와 다이나믹한 편집으로 몰입도를 높이세요. 2-3초마다 컷을 전환하고, 시각적 변화를 주어 지루함을 방지하세요. 중요한 포인트는 자막과 효과음으로 강조하세요.',
            'twist': '중반부에 예상치 못한 전개로 긴장감을 유지하세요. 반전 요소, 새로운 정보 공개, 또는 관점의 변화를 통해 시청자의 관심을 끝까지 유지하세요.',
            'hook_next': '영상 마지막에 다음 콘텐츠에 대한 예고나 질문을 남기세요. "다음 영상에서는..." 또는 "이것의 진짜 비밀은..."과 같은 떡밥으로 재방문을 유도하세요.',
            'is_default': True
        }

        user_id = options.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                users = [user]
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'사용자 ID {user_id}를 찾을 수 없습니다.'))
                return
        else:
            users = User.objects.all()

        created_count = 0
        for user in users:
            # 이미 프레임워크가 있는 사용자는 건너뛰기
            if DevelopmentFramework.objects.filter(user=user).exists():
                self.stdout.write(f'사용자 {user.username}는 이미 프레임워크를 가지고 있습니다.')
                continue
            
            # 기본 프레임워크 생성
            framework = DevelopmentFramework.objects.create(
                user=user,
                **default_framework_data
            )
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f'사용자 {user.username}에게 기본 프레임워크를 생성했습니다.'))

        self.stdout.write(self.style.SUCCESS(f'총 {created_count}개의 기본 프레임워크가 생성되었습니다.'))