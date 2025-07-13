#!/usr/bin/env python3
"""
Railway에서 마이그레이션 실행 스크립트
"""
import os
import sys

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_safe')

try:
    import django
    django.setup()
    
    from django.core.management import call_command
    from django.db import connection
    
    print("🚀 Railway 마이그레이션 시작...")
    
    # 데이터베이스 연결 테스트
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ 데이터베이스 연결 성공")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        sys.exit(1)
    
    # 마이그레이션 실행
    print("📋 마이그레이션 실행 중...")
    call_command('migrate', '--noinput')
    print("✅ 마이그레이션 완료")
    
    # 테이블 확인
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users_notification'
                );
            """)
            notification_exists = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users_user' 
                    AND column_name = 'email_verified'
                );
            """)
            email_verified_exists = cursor.fetchone()[0]
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_notification';")
            notification_exists = bool(cursor.fetchone())
            
            cursor.execute("PRAGMA table_info(users_user);")
            columns = [row[1] for row in cursor.fetchall()]
            email_verified_exists = 'email_verified' in columns
        
        print(f"✅ 테이블 검증:")
        print(f"   users_notification: {'존재' if notification_exists else '없음'}")
        print(f"   email_verified 컬럼: {'존재' if email_verified_exists else '없음'}")
    
    print("🎉 Railway 마이그레이션 성공!")
    
except Exception as e:
    print(f"❌ 마이그레이션 오류: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)