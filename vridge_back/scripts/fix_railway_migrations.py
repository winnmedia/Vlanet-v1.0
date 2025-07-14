#!/usr/bin/env python
"""
Railway 배포 환경에서 마이그레이션 문제 해결 스크립트
"""

import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_video_planning_table():
    """video_planning 테이블 존재 여부 확인"""
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'video_planning'
                );
            """)
        else:  # SQLite
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='video_planning';
            """)
        
        result = cursor.fetchone()
        return bool(result and result[0])

def fix_migrations():
    """마이그레이션 문제 해결"""
    print("🔧 Railway 마이그레이션 문제 해결 시작...")
    
    # 1. 현재 테이블 상태 확인
    table_exists = check_video_planning_table()
    print(f"✅ video_planning 테이블 존재: {table_exists}")
    
    if not table_exists:
        print("❌ video_planning 테이블이 없습니다. 마이그레이션을 실행합니다.")
        
        # 2. 마이그레이션 상태 확인
        print("\n📋 마이그레이션 상태:")
        execute_from_command_line(['manage.py', 'showmigrations', 'video_planning'])
        
        # 3. 마이그레이션 강제 실행
        print("\n🚀 마이그레이션 실행:")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'video_planning', '--run-syncdb'])
        except Exception as e:
            print(f"⚠️  일반 마이그레이션 실패: {e}")
            print("💡 syncdb로 재시도...")
            execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    
    # 4. 최종 확인
    table_exists_after = check_video_planning_table()
    if table_exists_after:
        print(f"\n✅ video_planning 테이블이 정상적으로 생성되었습니다!")
    else:
        print(f"\n❌ video_planning 테이블 생성에 실패했습니다.")
        print("💡 수동으로 테이블을 생성해야 할 수 있습니다.")
        
        # SQL 직접 실행 시도
        print("\n🔨 SQL로 직접 테이블 생성 시도...")
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS video_planning (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            title VARCHAR(200) NOT NULL,
            planning_text TEXT NOT NULL,
            stories JSONB DEFAULT '[]'::jsonb,
            selected_story JSONB,
            scenes JSONB DEFAULT '[]'::jsonb,
            selected_scene JSONB,
            shots JSONB DEFAULT '[]'::jsonb,
            selected_shot JSONB,
            storyboards JSONB DEFAULT '[]'::jsonb,
            planning_options JSONB DEFAULT '{}'::jsonb,
            is_completed BOOLEAN DEFAULT FALSE,
            current_step INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS video_planning_user_created ON video_planning(user_id, created_at DESC);
        """
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(create_table_sql)
                connection.commit()
            print("✅ 테이블이 직접 생성되었습니다!")
        except Exception as e:
            print(f"❌ SQL 실행 실패: {e}")

if __name__ == "__main__":
    fix_migrations()