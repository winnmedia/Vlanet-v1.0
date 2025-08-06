#!/usr/bin/env python3
"""
JWT 인증 문제 디버깅 스크립트
2025년 최신 Django SimpleJWT 설정 검증
"""

import os
import sys
import django
import json
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
django.setup()

from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings

User = get_user_model()

def print_section(title):
    """섹션 구분선 출력"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def test_jwt_settings():
    """JWT 설정 확인"""
    print_section("1. JWT 설정 확인")
    
    print("\n[SimpleJWT 설정]")
    jwt_settings = settings.SIMPLE_JWT
    for key, value in jwt_settings.items():
        print(f"  - {key}: {value}")
    
    print("\n[REST Framework 설정]")
    rf_settings = settings.REST_FRAMEWORK
    print(f"  - Authentication Classes: {rf_settings.get('DEFAULT_AUTHENTICATION_CLASSES', 'Not set')}")
    
    print("\n[SECRET_KEY 설정]")
    print(f"  - SECRET_KEY 존재: {'Yes' if settings.SECRET_KEY else 'No'}")
    print(f"  - SECRET_KEY 길이: {len(settings.SECRET_KEY) if settings.SECRET_KEY else 0}")

def test_user_authentication():
    """사용자 인증 테스트"""
    print_section("2. 사용자 인증 테스트")
    
    test_email = "ceo@winnmedia.co.kr"
    test_password = "test_password_123"  # 실제 비밀번호로 변경 필요
    
    print(f"\n[사용자 조회: {test_email}]")
    
    # 사용자 존재 확인
    user = User.objects.filter(username=test_email).first()
    if not user:
        user = User.objects.filter(email=test_email).first()
    
    if user:
        print(f"  ✓ 사용자 찾음: ID={user.id}, username={user.username}")
        print(f"    - Email: {user.email}")
        print(f"    - Active: {user.is_active}")
        print(f"    - Email Verified: {user.email_verified}")
        print(f"    - Login Method: {user.login_method}")
        
        # 비밀번호 검증 (테스트용)
        print(f"\n[비밀번호 검증]")
        print(f"  - 비밀번호 설정됨: {'Yes' if user.password else 'No'}")
        if user.password:
            print(f"  - 비밀번호 해시 시작: {user.password[:20]}...")
        
        return user
    else:
        print(f"  ✗ 사용자를 찾을 수 없음: {test_email}")
        return None

def test_token_generation(user):
    """토큰 생성 테스트"""
    print_section("3. JWT 토큰 생성 테스트")
    
    if not user:
        print("  ✗ 사용자가 없어 토큰 생성 불가")
        return None, None
    
    try:
        # RefreshToken 생성
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        print(f"\n[토큰 생성 성공]")
        print(f"  - Refresh Token: {str(refresh)[:50]}...")
        print(f"  - Access Token: {str(access_token)[:50]}...")
        
        # 토큰 페이로드 확인
        print(f"\n[Access Token 페이로드]")
        for key, value in access_token.payload.items():
            if key in ['exp', 'iat']:
                value = datetime.fromtimestamp(value).strftime('%Y-%m-%d %H:%M:%S')
            print(f"    - {key}: {value}")
        
        return str(refresh), str(access_token)
        
    except Exception as e:
        print(f"  ✗ 토큰 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_token_validation(access_token):
    """토큰 검증 테스트"""
    print_section("4. JWT 토큰 검증 테스트")
    
    if not access_token:
        print("  ✗ 검증할 토큰이 없음")
        return
    
    try:
        # AccessToken으로 직접 검증
        print("\n[AccessToken 클래스로 검증]")
        token = AccessToken(access_token)
        print(f"  ✓ 토큰 유효함")
        print(f"    - User ID: {token.get('user_id')}")
        print(f"    - Token Type: {token.get('token_type')}")
        
        # 사용자 조회
        user_id = token.get('user_id')
        if user_id:
            user = User.objects.filter(id=user_id).first()
            if user:
                print(f"    - User Found: {user.username}")
            else:
                print(f"    ✗ User ID {user_id}에 해당하는 사용자 없음")
        
    except TokenError as e:
        print(f"  ✗ 토큰 검증 실패: {e}")
    except Exception as e:
        print(f"  ✗ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()

def test_jwt_authentication(access_token):
    """JWTAuthentication 클래스 테스트"""
    print_section("5. JWTAuthentication 클래스 테스트")
    
    if not access_token:
        print("  ✗ 테스트할 토큰이 없음")
        return
    
    # 가짜 request 객체 생성
    class FakeRequest:
        def __init__(self, token):
            self.META = {
                'HTTP_AUTHORIZATION': f'Bearer {token}'
            }
            self.COOKIES = {}
    
    request = FakeRequest(access_token)
    
    try:
        # JWTAuthentication 인스턴스 생성
        jwt_auth = JWTAuthentication()
        
        print("\n[인증 시도]")
        result = jwt_auth.authenticate(request)
        
        if result:
            user, validated_token = result
            print(f"  ✓ 인증 성공")
            print(f"    - User: {user.username}")
            print(f"    - User ID: {user.id}")
            print(f"    - Token Valid: Yes")
        else:
            print(f"  ✗ 인증 실패: None 반환")
            
    except InvalidToken as e:
        print(f"  ✗ 유효하지 않은 토큰: {e}")
    except Exception as e:
        print(f"  ✗ 인증 오류: {e}")
        import traceback
        traceback.print_exc()

def check_migration_issues():
    """마이그레이션 관련 문제 확인"""
    print_section("6. 데이터베이스 및 마이그레이션 확인")
    
    from django.db import connection
    
    print("\n[User 모델 필드 확인]")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users_user'
            ORDER BY ordinal_position
            LIMIT 10
        """)
        columns = cursor.fetchall()
        for col_name, data_type in columns:
            print(f"  - {col_name}: {data_type}")
    
    print("\n[필수 필드 존재 확인]")
    required_fields = ['id', 'username', 'email', 'password', 'is_active']
    user = User.objects.first()
    if user:
        for field in required_fields:
            has_field = hasattr(user, field)
            print(f"  - {field}: {'✓' if has_field else '✗'}")

def provide_solutions():
    """문제 해결 방안 제시"""
    print_section("7. 문제 해결 방안")
    
    print("""
[일반적인 JWT 인증 실패 원인 및 해결법]

1. SECRET_KEY 불일치
   → 환경변수 확인: echo $SECRET_KEY
   → settings.py에서 올바른 키 사용 확인

2. 토큰 만료
   → ACCESS_TOKEN_LIFETIME 설정 확인
   → 새 토큰 발급 필요

3. 알고리즘 불일치
   → ALGORITHM 설정 확인 (기본: HS256)
   → 프론트엔드와 백엔드 알고리즘 일치 필요

4. User 모델 필드 누락
   → python manage.py makemigrations
   → python manage.py migrate

5. 인증 헤더 형식 오류
   → 정확한 형식: "Authorization: Bearer <token>"
   → 대소문자 구분 주의

6. CORS 설정 문제
   → CORS_ALLOW_HEADERS에 'authorization' 포함 확인
   → CORS_ALLOW_CREDENTIALS = True 설정

7. 미들웨어 순서 문제
   → CorsMiddleware가 CommonMiddleware 이전에 위치 확인

[권장 디버깅 절차]
1. 이 스크립트 실행으로 기본 설정 확인
2. 실제 비밀번호로 authenticate() 테스트
3. 생성된 토큰으로 API 호출 테스트
4. 프론트엔드 네트워크 탭에서 실제 요청 헤더 확인
""")

def main():
    """메인 실행 함수"""
    print("\n" + "="*60)
    print("  JWT 인증 시스템 종합 진단")
    print("  실행 시간:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    # 1. JWT 설정 확인
    test_jwt_settings()
    
    # 2. 사용자 인증 테스트
    user = test_user_authentication()
    
    # 3. 토큰 생성 테스트
    refresh_token, access_token = test_token_generation(user)
    
    # 4. 토큰 검증 테스트
    test_token_validation(access_token)
    
    # 5. JWTAuthentication 클래스 테스트
    test_jwt_authentication(access_token)
    
    # 6. 마이그레이션 확인
    check_migration_issues()
    
    # 7. 해결 방안 제시
    provide_solutions()
    
    print("\n" + "="*60)
    print("  진단 완료")
    print("="*60)

if __name__ == "__main__":
    main()