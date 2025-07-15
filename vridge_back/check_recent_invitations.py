#!/usr/bin/env python
"""
RecentInvitation 테이블 확인 스크립트
Railway 환경에서 실행할 수 있도록 설계됨
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.db import connection
from users.models import RecentInvitation

print("=== RecentInvitation 테이블 확인 ===")

# 데이터베이스 종류 확인
db_engine = connection.settings_dict['ENGINE']
print(f"\n1. 데이터베이스 엔진: {db_engine}")

# PostgreSQL용 쿼리
if 'postgresql' in db_engine:
    with connection.cursor() as cursor:
        # 테이블 존재 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users_recentinvitation'
            );
        """)
        table_exists = cursor.fetchone()[0]
        print(f"2. 테이블 존재: {table_exists}")
        
        if table_exists:
            # 컬럼 확인
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users_recentinvitation'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("\n3. 테이블 컬럼:")
            for col_name, col_type in columns:
                print(f"  - {col_name}: {col_type}")
                
            # 데이터 개수 확인
            cursor.execute("SELECT COUNT(*) FROM users_recentinvitation;")
            count = cursor.fetchone()[0]
            print(f"\n4. 전체 레코드 수: {count}")
        else:
            print("\n❌ users_recentinvitation 테이블이 존재하지 않습니다!")
            print("   마이그레이션이 필요합니다: python manage.py migrate users")

# SQLite용 쿼리
elif 'sqlite' in db_engine:
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users_recentinvitation';
        """)
        result = cursor.fetchone()
        print(f"2. 테이블 존재: {result is not None}")

print("\n=== 마이그레이션 상태 확인 ===")
try:
    from django.db.migrations.recorder import MigrationRecorder
    recorder = MigrationRecorder(connection)
    applied_migrations = recorder.applied_migrations()
    
    users_migrations = [m for m in applied_migrations if m[0] == 'users']
    print(f"적용된 users 마이그레이션 수: {len(users_migrations)}")
    
    # 0012 마이그레이션 확인
    has_0012 = ('users', '0012_recentinvitation_friendship') in applied_migrations
    print(f"0012_recentinvitation_friendship 적용 여부: {has_0012}")
    
except Exception as e:
    print(f"마이그레이션 확인 오류: {e}")