from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import User


class Command(BaseCommand):
    help = '특정 사용자의 비밀번호를 재설정'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='사용자 이메일')
        parser.add_argument('password', type=str, help='새 비밀번호')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        
        try:
            # 이메일 또는 username으로 사용자 찾기
            user = User.objects.filter(username=email).first()
            if not user:
                user = User.objects.filter(email=email).first()
            
            if user:
                user.set_password(password)
                user.is_active = True
                user.email_verified = True
                user.save()
                
                self.stdout.write(self.style.SUCCESS(f'비밀번호 재설정 완료: {user.username}'))
                self.stdout.write(f'이메일: {user.email}')
                self.stdout.write(f'새 비밀번호: {password}')
            else:
                self.stdout.write(self.style.ERROR(f'사용자를 찾을 수 없습니다: {email}'))
                
                # 모든 사용자 목록 표시
                all_users = User.objects.all()[:10]
                self.stdout.write('\n등록된 사용자 목록:')
                for u in all_users:
                    self.stdout.write(f'- {u.username} ({u.email})')
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'오류 발생: {e}'))
            import traceback
            traceback.print_exc()