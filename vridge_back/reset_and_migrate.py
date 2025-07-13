#!/usr/bin/env python
"""
Railway에서 마이그레이션을 강제로 실행하는 스크립트
"""
import os
import sys
import django
from django.core.management import call_command

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

print("🚀 마이그레이션 리셋 및 재실행 시작...")

try:
    # 1. 현재 마이그레이션 상태 확인
    print("\n📋 현재 마이그레이션 상태:")
    call_command('showmigrations', 'users')
    
    # 2. users 앱 마이그레이션 실행
    print("\n🔧 users 앱 마이그레이션 실행:")
    call_command('migrate', 'users', '--noinput')
    
    # 3. 모든 앱 마이그레이션 실행
    print("\n🔧 전체 마이그레이션 실행:")
    call_command('migrate', '--noinput')
    
    # 4. 테이블 존재 확인
    from django.db import connection
    with connection.cursor() as cursor:
        # users_notification 테이블 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users_notification'
            );
        """)
        notification_exists = cursor.fetchone()[0]
        
        # email_verified 컬럼 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users_user' 
                AND column_name = 'email_verified'
            );
        """)
        email_verified_exists = cursor.fetchone()[0]
        
        print(f"\n✅ users_notification 테이블: {'존재' if notification_exists else '❌ 없음'}")
        print(f"✅ email_verified 컬럼: {'존재' if email_verified_exists else '❌ 없음'}")
    
    print("\n✅ 마이그레이션 완료!")
    
except Exception as e:
    print(f"\n❌ 오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)