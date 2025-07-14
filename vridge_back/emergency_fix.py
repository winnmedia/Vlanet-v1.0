#!/usr/bin/env python
"""
긴급 데이터베이스 수정 스크립트
"""
import os
import sys
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

def emergency_fix():
    """긴급 수정"""
    with connection.cursor() as cursor:
        try:
            # 1. development_framework_id 컬럼 존재 확인
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project' 
                AND column_name = 'development_framework_id'
            """)
            
            if not cursor.fetchone():
                print("❌ development_framework_id 컬럼이 없습니다.")
                # 컬럼 추가 시도
                try:
                    cursor.execute("""
                        ALTER TABLE projects_project 
                        ADD COLUMN development_framework_id INTEGER NULL
                    """)
                    print("✅ development_framework_id 컬럼을 추가했습니다.")
                except Exception as e:
                    print(f"⚠️ 컬럼 추가 실패: {str(e)}")
            else:
                print("✅ development_framework_id 컬럼이 이미 존재합니다.")
            
            # 2. 테이블 확인
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'projects_developmentframework'
            """)
            
            if not cursor.fetchone():
                print("❌ projects_developmentframework 테이블이 없습니다.")
            else:
                print("✅ projects_developmentframework 테이블이 존재합니다.")
                
        except Exception as e:
            print(f"❌ 긴급 수정 중 오류: {str(e)}")

if __name__ == "__main__":
    print("=== 긴급 데이터베이스 수정 시작 ===")
    emergency_fix()
    print("=== 완료 ===")