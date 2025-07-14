#!/usr/bin/env python3
"""
JWT 토큰 검증 테스트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

def test_jwt_token(token_string):
    """JWT 토큰 검증 테스트"""
    try:
        print(f"🔍 Testing JWT token...")
        print(f"📦 Token (first 50 chars): {token_string[:50]}...")
        
        # 토큰 파싱
        token = AccessToken(token_string)
        print(f"✅ Token parsed successfully")
        
        # 토큰 정보 출력
        print(f"📊 Token payload:")
        for key, value in token.payload.items():
            print(f"  - {key}: {value}")
        
        # 사용자 조회
        user_id = token.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                print(f"✅ User found: {user.username} (ID: {user.id})")
            except User.DoesNotExist:
                print(f"❌ User with ID {user_id} not found")
        
        return True
        
    except TokenError as e:
        print(f"❌ Token validation failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # 테스트용 토큰 (프론트엔드 로그에서 복사)
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # 실제 토큰으로 교체 필요
    
    if len(sys.argv) > 1:
        test_token = sys.argv[1]
    
    test_jwt_token(test_token)