#!/usr/bin/env python3
"""
인증 시스템 완전 수정 스크립트
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
django.setup()

from django.db import connection
from users.models import User
import json

print("🔧 인증 시스템 디버깅 및 수정")
print("=" * 50)

# 1. 데이터베이스 테이블 확인
print("\n1️⃣ 데이터베이스 테이블 확인")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("테이블 목록:")
    for table in tables:
        print(f"  - {table[0]}")

# 2. User 모델 필드 확인
print("\n2️⃣ User 모델 필드 확인")
print("User 모델 필드:")
for field in User._meta.fields:
    print(f"  - {field.name}: {field.get_internal_type()}")

# 3. 사용자 확인 및 생성
print("\n3️⃣ 사용자 확인 및 생성")
try:
    # 모든 사용자 조회
    users = User.objects.all()
    print(f"현재 사용자 수: {users.count()}")
    
    for user in users:
        print(f"  - {user.email} (ID: {user.id})")
    
    # test@example.com 사용자 확인
    try:
        test_user = User.objects.get(email='test@example.com')
        print(f"\n✅ test@example.com 사용자 존재 (ID: {test_user.id})")
    except User.DoesNotExist:
        print("\n❌ test@example.com 사용자 없음 - 생성 중...")
        test_user = User.objects.create_user(
            email='test@example.com',
            password='Test123!'
        )
        print(f"✅ 사용자 생성 완료 (ID: {test_user.id})")
        
except Exception as e:
    print(f"❌ 오류: {e}")

# 4. 로그인 테스트
print("\n4️⃣ 로그인 직접 테스트")
try:
    from django.contrib.auth import authenticate
    
    user = authenticate(email='test@example.com', password='Test123!')
    if user:
        print("✅ 인증 성공")
        print(f"   사용자 ID: {user.id}")
        print(f"   이메일: {user.email}")
        
        # JWT 토큰 생성
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        print(f"\n🔑 JWT 토큰 생성:")
        print(f"   Access Token: {str(refresh.access_token)[:50]}...")
        print(f"   Refresh Token: {str(refresh)[:50]}...")
    else:
        print("❌ 인증 실패")
except Exception as e:
    print(f"❌ 로그인 테스트 오류: {e}")

# 5. API 엔드포인트 수정 제안
print("\n5️⃣ API 엔드포인트 수정 제안")
print("현재 로그인 뷰가 404를 반환하는 이유:")
print("1. URL 패턴이 잘못되었거나")
print("2. 뷰가 제대로 구현되지 않았을 가능성")
print("\n해결 방법:")
print("1. users/views.py의 SignIn 클래스 확인")
print("2. migration_compatibility 모듈의 오류 수정")

print("\n" + "=" * 50)
print("디버깅 완료")