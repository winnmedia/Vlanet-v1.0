"""
JWT 인증 디버그 테스트 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath('.')))
django.setup()

from django.test import RequestFactory
from rest_framework_simplejwt.authentication import JWTAuthentication
from users.utils import user_validator
import json

# 테스트 토큰
test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0ODk4NzU0LCJpYXQiOjE3NTQyOTM5NTQsImp0aSI6IjRkNzZhNmM5OGY5YTRkYzBiZDljNjk3MTQ4OGY5YmU0IiwidXNlcl9pZCI6MjR9.SlMhq6CtrrZAjnMwUIu7oNzASg7S7iC7LszFEQTgdoM"

# RequestFactory로 가짜 요청 생성
factory = RequestFactory()

print("=== JWT 인증 디버그 테스트 ===\n")

# 1. 직접 JWT 인증 테스트
print("1. 직접 JWT 인증 테스트")
jwt_auth = JWTAuthentication()

# Authorization 헤더로 테스트
request = factory.get('/api/users/me/', HTTP_AUTHORIZATION=f'Bearer {test_token}')
try:
    auth_result = jwt_auth.authenticate(request)
    if auth_result:
        user, token = auth_result
        print(f"✅ 인증 성공! 사용자: {user.email}")
    else:
        print("❌ 인증 실패: authenticate()가 None 반환")
except Exception as e:
    print(f"❌ 인증 실패: {e}")

print("\n2. user_validator 데코레이터 테스트")

# 테스트용 뷰 함수
@user_validator
def test_view(self, request):
    return {"user": request.user.email if hasattr(request, 'user') else None}

# 가짜 self 객체
class FakeView:
    pass

fake_view = FakeView()

# Authorization 헤더로 테스트
request2 = factory.get('/api/users/me/', HTTP_AUTHORIZATION=f'Bearer {test_token}')
request2.content_type = 'application/json'
# WSGIRequest의 user 속성 초기화
from django.contrib.auth.models import AnonymousUser
request2.user = AnonymousUser()

print("Authorization 헤더로 테스트:")
try:
    result = test_view(fake_view, request2)
    print(f"결과: {result}")
except Exception as e:
    print(f"오류: {e}")
    import traceback
    traceback.print_exc()

# 쿠키로 테스트
print("\n쿠키로 테스트:")
request3 = factory.get('/api/users/me/')
request3.COOKIES['vridge_session'] = test_token
request3.content_type = 'application/json'
request3.user = AnonymousUser()

try:
    result = test_view(fake_view, request3)
    print(f"결과: {result}")
except Exception as e:
    print(f"오류: {e}")

print("\n3. 토큰 유효성 확인")
from rest_framework_simplejwt.tokens import AccessToken
try:
    token_obj = AccessToken(test_token)
    print(f"✅ 토큰 유효함")
    print(f"   User ID: {token_obj['user_id']}")
    print(f"   토큰 타입: {token_obj['token_type']}")
    print(f"   만료시간: {token_obj['exp']}")
except Exception as e:
    print(f"❌ 토큰 검증 실패: {e}")

print("\n=== 테스트 완료 ===")