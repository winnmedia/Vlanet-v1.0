#!/usr/bin/env python3
"""
Railway 배포 시 마이그레이션 확실히 실행하기 위한 스크립트
"""
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.db import connection

def check_database():
    """데이터베이스 연결 확인"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def run_migrations():
    """마이그레이션 실행"""
    try:
        print("🚀 Running migrations...")
        execute_from_command_line(['manage.py', 'migrate', '--verbosity=2'])
        print("✅ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def main():
    """메인 함수"""
    # Django 설정
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
    
    try:
        django.setup()
        
        print("🔍 Checking database connection...")
        if not check_database():
            sys.exit(1)
        
        print("📋 Running migrations...")
        if not run_migrations():
            sys.exit(1)
            
        print("🎉 All operations completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()