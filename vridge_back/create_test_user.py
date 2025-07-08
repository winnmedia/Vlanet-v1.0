import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password

User.objects.filter(username='testuser').delete()

try:
    user = User.objects.create(
        username='testuser',
        email='testuser@test.com',
        nickname='테스트유저',
        password=make_password('test1234'),
        role='admin',
        is_active=True,
        is_social_login=False,
        login_method='email'
    )
    
    print("테스트 유저 생성 완료\!")
    print(f"아이디: {user.username}")
    print("비밀번호: test1234")
    print(f"이메일: {user.email}")
except Exception as e:
    print(f"오류 발생: {e}")
EOF < /dev/null
