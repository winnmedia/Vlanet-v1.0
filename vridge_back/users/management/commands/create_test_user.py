from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from users.models import User


class Command(BaseCommand):
    help = '테스트 사용자 생성'

    def handle(self, *args, **options):
        try:
            # 기존 사용자 확인
            user = User.objects.filter(username='test@videoplanet.com').first()
            
            if user:
                # 비밀번호 재설정
                user.set_password('test1234')
                user.is_active = True
                user.email_verified = True
                user.email_verified_at = timezone.now()
                user.save()
                self.stdout.write(self.style.SUCCESS('기존 사용자 비밀번호 업데이트 완료'))
            else:
                # 새 사용자 생성
                user = User.objects.create(
                    username='test@videoplanet.com',
                    email='test@videoplanet.com',
                    nickname='테스트유저',
                    is_active=True,
                    email_verified=True,
                    email_verified_at=timezone.now(),
                    login_method='email'
                )
                user.set_password('test1234')
                user.save()
                self.stdout.write(self.style.SUCCESS('새 테스트 사용자 생성 완료'))
            
            self.stdout.write(f'이메일: {user.email}')
            self.stdout.write(f'비밀번호: test1234')
            self.stdout.write(f'활성화: {user.is_active}')
            self.stdout.write(f'이메일 인증: {user.email_verified}')
            
            # 데이터베이스 정보
            from django.db import connection
            self.stdout.write(f'\n데이터베이스: {connection.vendor}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'오류 발생: {e}'))
            import traceback
            traceback.print_exc()