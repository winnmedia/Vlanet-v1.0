#!/usr/bin/env python3
"""
Railway 환경에서 테스트 사용자를 생성하는 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone

def create_test_user():
    """테스트 사용자 생성"""
    try:
        # 기존 사용자 삭제
        User.objects.filter(username='test@videoplanet.com').delete()
        print("기존 테스트 사용자 삭제됨")
        
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
        
        # 비밀번호 설정
        user.set_password('test1234')
        user.save()
        
        print(f"테스트 사용자 생성 완료!")
        print(f"- 아이디: {user.username}")
        print(f"- 이메일: {user.email}")
        print(f"- 비밀번호: test1234")
        print(f"- 활성화: {user.is_active}")
        print(f"- 이메일 인증: {user.email_verified}")
        
        # 데이터베이스 연결 정보 출력
        from django.db import connection
        print(f"\n데이터베이스 정보:")
        print(f"- 벤더: {connection.vendor}")
        print(f"- 데이터베이스 이름: {connection.settings_dict.get('NAME', 'N/A')}")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_user()