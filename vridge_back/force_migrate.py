#\!/usr/bin/env python
"""
강제 마이그레이션 스크립트
Railway 환경에서 마이그레이션 문제 해결용
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection

def main():
    print("=== 강제 마이그레이션 시작 ===")
    
    # 현재 테이블 확인
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"현재 테이블 수: {len(tables)}")
        
    # 마이그레이션 실행
    try:
        print("\n1. contenttypes 마이그레이션...")
        execute_from_command_line(['manage.py', 'migrate', 'contenttypes', '--noinput'])
        
        print("\n2. auth 마이그레이션...")
        execute_from_command_line(['manage.py', 'migrate', 'auth', '--noinput'])
        
        print("\n3. users 마이그레이션...")
        execute_from_command_line(['manage.py', 'migrate', 'users', '--noinput'])
        
        print("\n4. projects 마이그레이션...")
        execute_from_command_line(['manage.py', 'migrate', 'projects', '--noinput'])
        
        print("\n5. 나머지 앱 마이그레이션...")
        execute_from_command_line(['manage.py', 'migrate', '--noinput'])
        
        print("\n=== 마이그레이션 완료 ===")
        
        # 마이그레이션 후 테이블 확인
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            print(f"마이그레이션 후 테이블 수: {len(tables)}")
            
            # projects_developmentframework 테이블 확인
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'projects_developmentframework'
                );
            """)
            exists = cursor.fetchone()[0]
            if exists:
                print("✅ projects_developmentframework 테이블 생성됨")
            else:
                print("❌ projects_developmentframework 테이블이 여전히 없음")
                
    except Exception as e:
        print(f"마이그레이션 오류: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
