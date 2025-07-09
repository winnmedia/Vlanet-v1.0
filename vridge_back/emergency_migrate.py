"""
긴급 마이그레이션 실행 스크립트
Railway 환경에서 직접 실행하거나 관리 명령어로 사용
"""
import os
import sys
import django
from django.core.management import call_command
from django.db import connection

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

def run_emergency_migration():
    print("=== 긴급 마이그레이션 시작 ===")
    
    try:
        # 1. 현재 마이그레이션 상태 확인
        print("\n1. 현재 마이그레이션 상태:")
        call_command('showmigrations')
        
        # 2. 마이그레이션 실행
        print("\n2. 마이그레이션 실행 중...")
        call_command('migrate', verbosity=2)
        
        # 3. 테이블 존재 확인
        print("\n3. 데이터베이스 테이블 확인:")
        with connection.cursor() as cursor:
            # PostgreSQL용 쿼리
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('video_planning', 'projects_project', 'projects_idempotencyrecord')
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            print("존재하는 테이블:")
            for table in tables:
                print(f"  - {table[0]}")
            
            # 중요 컬럼 확인
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project' 
                AND column_name IN ('tone_manner', 'genre', 'concept');
            """)
            columns = cursor.fetchall()
            print("\nprojects_project 테이블의 새 컬럼:")
            for col in columns:
                print(f"  - {col[0]}")
        
        print("\n=== 마이그레이션 완료 ===")
        return True
        
    except Exception as e:
        print(f"\n❌ 마이그레이션 실패: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_emergency_migration()
    sys.exit(0 if success else 1)