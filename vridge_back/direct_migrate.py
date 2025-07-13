#!/usr/bin/env python3
"""
Railway에서 직접 마이그레이션 실행하는 스크립트
"""
import os
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_minimal')
django.setup()

from django.db import connection
from django.core.management import call_command

print("🔧 직접 마이그레이션 시작...")

def execute_sql_safely(sql, description):
    """SQL을 안전하게 실행"""
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            print(f"✅ {description}")
            return True
    except Exception as e:
        print(f"⚠️ {description} - 이미 존재하거나 오류: {e}")
        return False

def is_postgresql():
    """PostgreSQL인지 확인"""
    return connection.vendor == 'postgresql'

# PostgreSQL에서만 직접 SQL 실행
if is_postgresql():
    print("📊 PostgreSQL 감지 - 직접 SQL 실행...")
    
    # 1. users_notification 테이블 생성
    execute_sql_safely("""
        CREATE TABLE IF NOT EXISTS users_notification (
            id SERIAL PRIMARY KEY,
            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            recipient_id INTEGER NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            project_id INTEGER,
            invitation_id INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE,
            extra_data JSONB DEFAULT '{}'::jsonb
        );
    """, "users_notification 테이블 생성")

    # 2. 인덱스 추가
    execute_sql_safely(
        "CREATE INDEX IF NOT EXISTS users_notification_recipient_created ON users_notification(recipient_id, created DESC);",
        "users_notification 인덱스 생성"
    )

    # 3. email_verified 컬럼 추가
    execute_sql_safely(
        "ALTER TABLE users_user ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;",
        "email_verified 컬럼 추가"
    )

    # 4. email_verified_at 컬럼 추가
    execute_sql_safely(
        "ALTER TABLE users_user ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;",
        "email_verified_at 컬럼 추가"
    )

    # 5. friend_code 컬럼 추가
    execute_sql_safely(
        "ALTER TABLE users_user ADD COLUMN IF NOT EXISTS friend_code VARCHAR(20) UNIQUE;",
        "friend_code 컬럼 추가"
    )
else:
    print("📊 SQLite 감지 - 직접 SQL 건너뛰고 정규 마이그레이션만 실행...")

# 6. 정규 마이그레이션 실행
print("\n📋 정규 마이그레이션 실행...")
try:
    call_command('migrate', '--noinput')
    print("✅ 정규 마이그레이션 완료")
except Exception as e:
    print(f"⚠️ 정규 마이그레이션 오류: {e}")

print("\n✅ 직접 마이그레이션 완료!")