#!/usr/bin/env python
"""
development_framework 컬럼 강제 생성 스크립트
"""
import os
import sys
import django
from django.db import connection, transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

def add_development_framework_column():
    """development_framework_id 컬럼 추가"""
    with connection.cursor() as cursor:
        try:
            # 컬럼 존재 여부 확인
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project' 
                AND column_name = 'development_framework_id'
            """)
            
            if cursor.fetchone():
                print("✓ development_framework_id 컬럼이 이미 존재합니다.")
                return
            
            # 컬럼 추가
            print("🔧 development_framework_id 컬럼을 추가합니다...")
            with transaction.atomic():
                cursor.execute("""
                    ALTER TABLE projects_project 
                    ADD COLUMN development_framework_id INTEGER NULL
                    REFERENCES projects_developmentframework(id) 
                    ON DELETE SET NULL 
                    DEFERRABLE INITIALLY DEFERRED
                """)
                
                # 인덱스 추가
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS projects_project_development_framework_id_idx 
                    ON projects_project(development_framework_id)
                """)
                
            print("✅ development_framework_id 컬럼이 성공적으로 추가되었습니다.")
            
        except Exception as e:
            print(f"❌ 컬럼 추가 중 오류 발생: {str(e)}")
            raise

if __name__ == "__main__":
    print("=== Development Framework 컬럼 추가 스크립트 ===")
    add_development_framework_column()
    print("=== 완료 ===")