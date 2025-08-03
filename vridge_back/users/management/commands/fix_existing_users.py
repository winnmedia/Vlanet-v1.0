from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User


class Command(BaseCommand):
    help = '기존 사용자들의 이메일 인증 상태 수정'

    def handle(self, *args, **options):
        try:
            # 이메일 인증이 False인 모든 사용자 찾기
            users_to_fix = User.objects.filter(email_verified=False)
            count = users_to_fix.count()
            
            if count > 0:
                self.stdout.write(f'이메일 미인증 사용자 {count}명 발견')
                
                # 모든 기존 사용자 이메일 인증 처리
                users_to_fix.update(
                    email_verified=True,
                    email_verified_at=timezone.now()
                )
                
                self.stdout.write(self.style.SUCCESS(f'{count}명의 사용자 이메일 인증 완료'))
            else:
                self.stdout.write('모든 사용자가 이미 이메일 인증됨')
            
            # 전체 사용자 상태 출력
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            verified_users = User.objects.filter(email_verified=True).count()
            
            self.stdout.write(f'\n전체 사용자: {total_users}명')
            self.stdout.write(f'활성 사용자: {active_users}명')
            self.stdout.write(f'이메일 인증 사용자: {verified_users}명')
            
            # 샘플 사용자 정보
            sample_users = User.objects.all()[:5]
            if sample_users:
                self.stdout.write('\n샘플 사용자:')
                for user in sample_users:
                    self.stdout.write(f'- {user.username} (active: {user.is_active}, verified: {user.email_verified})')
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'오류 발생: {e}'))
            import traceback
            traceback.print_exc()