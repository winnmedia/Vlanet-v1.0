#!/usr/bin/env python3
"""
Railway에서 마이그레이션 상태를 확인하고 강제 실행하는 스크립트
"""
import os
import sys

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')

try:
    import django
    django.setup()
    
    from django.core.management import call_command
    from django.db import connection
    
    print("🔧 마이그레이션 헬스체크 시작...")
    print(f"DATABASE: {connection.vendor}")
    print(f"DATABASE_URL: {os.environ.get('DATABASE_URL', 'Not set')[:50]}...")
    
    # 1. 마이그레이션 상태 확인
    print("\n📋 현재 마이그레이션 상태:")
    call_command('showmigrations')
    
    # 2. 마이그레이션 실행
    print("\n🔄 마이그레이션 실행:")
    call_command('migrate', '--noinput')
    
    # 3. 테이블 존재 확인
    with connection.cursor() as cursor:
        # users_notification 테이블 확인
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users_notification'
                );
            """)
        else:
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='users_notification';
            """)
        
        result = cursor.fetchone()
        notification_exists = result[0] if result else False
        
        # email_verified 컬럼 확인
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users_user' 
                    AND column_name = 'email_verified'
                );
            """)
        else:
            cursor.execute("PRAGMA table_info(users_user);")
            columns = [row[1] for row in cursor.fetchall()]
            email_verified_exists = 'email_verified' in columns
        
        if connection.vendor == 'postgresql':
            result = cursor.fetchone()
            email_verified_exists = result[0] if result else False
        
        print(f"\n✅ 테이블 확인:")
        print(f"   users_notification: {'✅ 존재' if notification_exists else '❌ 없음'}")
        print(f"   email_verified 컬럼: {'✅ 존재' if email_verified_exists else '❌ 없음'}")
    
    print("\n✅ 마이그레이션 헬스체크 완료!")
    
except Exception as e:
    print(f"\n❌ 오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)