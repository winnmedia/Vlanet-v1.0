#!/usr/bin/env python
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from users.models import RecentInvitation, User
from django.db import connection

print("=== RecentInvitation 디버깅 ===")

# 모델 정보 확인
print("\n1. 모델 필드:")
for field in RecentInvitation._meta.fields:
    print(f"  - {field.name}: {field.get_internal_type()}")

# 테이블 존재 확인
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users_recentinvitation';
    """)
    result = cursor.fetchone()
    print(f"\n2. 테이블 존재: {result is not None}")
    
    if result:
        # 테이블 스키마 확인
        cursor.execute("PRAGMA table_info(users_recentinvitation);")
        columns = cursor.fetchall()
        print("\n3. 테이블 컬럼:")
        for col in columns:
            print(f"  - {col[1]}: {col[2]}")

# 쿼리 테스트
try:
    # 첫 번째 사용자 가져오기
    user = User.objects.first()
    if user:
        print(f"\n4. 테스트 사용자: {user.username}")
        
        # 쿼리 실행 테스트
        invitations = RecentInvitation.objects.filter(inviter=user).order_by('-last_invited_at')[:10]
        print(f"5. 쿼리 실행 성공: {len(invitations)} 개의 초대 기록")
        
        for inv in invitations:
            print(f"  - {inv.invitee_email} ({inv.last_invited_at})")
    else:
        print("\n4. 테스트할 사용자가 없습니다.")
        
except Exception as e:
    print(f"\n에러 발생: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()