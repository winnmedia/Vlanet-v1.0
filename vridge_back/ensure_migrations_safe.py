#!/usr/bin/env python3
"""
마이그레이션 자동 실행 및 검증 스크립트
Railway 환경에서 안전하게 마이그레이션을 실행합니다.
"""
import os
import sys
import django
from django.core.management import call_command
from django.db import connection
from pathlib import Path

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings_railway'))
sys.path.insert(0, str(Path(__file__).resolve().parent))

print("🚀 마이그레이션 자동 실행 스크립트 시작...")
print(f"   Django 설정: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
print(f"   데이터베이스: {os.environ.get('DATABASE_URL', 'SQLite (기본값)')[:50]}...")

def check_database_connection():
    """데이터베이스 연결 확인"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print("✅ 데이터베이스 연결 성공")
            return True
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False

def ensure_migration_tables():
    """마이그레이션 테이블 확인 및 생성"""
    try:
        with connection.cursor() as cursor:
            # django_migrations 테이블 확인
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'django_migrations'
                );
            """)
            exists = cursor.fetchone()[0]
            
            if not exists:
                print("⚠️  django_migrations 테이블이 없습니다. 생성 중...")
                call_command('migrate', 'contenttypes', '--run-syncdb', verbosity=0)
                print("✅ django_migrations 테이블 생성 완료")
            else:
                print("✅ django_migrations 테이블 존재")
                
    except Exception as e:
        print(f"⚠️  마이그레이션 테이블 확인 실패: {e}")
        # PostgreSQL이 아닌 경우 (SQLite 등)
        try:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='django_migrations';")
            if not cursor.fetchone():
                call_command('migrate', 'contenttypes', '--run-syncdb', verbosity=0)
        except:
            pass

def run_migrations_safely():
    """안전하게 마이그레이션 실행"""
    apps_order = [
        'contenttypes',
        'auth',
        'users',
        'projects', 
        'feedbacks',
        'video_planning',
        'video_analysis',
        'admin',
        'sessions',
    ]
    
    print("\n📋 마이그레이션 실행 순서:")
    
    for app in apps_order:
        try:
            print(f"\n🔄 {app} 마이그레이션 중...")
            call_command('migrate', app, verbosity=1)
            print(f"✅ {app} 완료")
        except Exception as e:
            print(f"⚠️  {app} 마이그레이션 실패: {e}")
            # 실패해도 계속 진행
            continue
    
    # 전체 마이그레이션 한 번 더 실행
    try:
        print("\n🔄 전체 마이그레이션 최종 실행...")
        call_command('migrate', verbosity=1)
        print("✅ 전체 마이그레이션 완료")
    except Exception as e:
        print(f"⚠️  전체 마이그레이션 실패: {e}")

def verify_critical_tables():
    """핵심 테이블 존재 여부 확인"""
    critical_tables = [
        'django_migrations',
        'auth_user',
        'users_user',
        'projects_project',
        'feedbacks_feedback',
    ]
    
    print("\n🔍 핵심 테이블 확인:")
    all_exists = True
    
    try:
        with connection.cursor() as cursor:
            # PostgreSQL용 쿼리
            for table in critical_tables:
                try:
                    cursor.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
                    exists = cursor.fetchone()[0]
                    if exists:
                        print(f"   ✅ {table}")
                    else:
                        print(f"   ❌ {table} - 없음")
                        all_exists = False
                except:
                    # SQLite용 쿼리
                    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';")
                    if cursor.fetchone():
                        print(f"   ✅ {table}")
                    else:
                        print(f"   ❌ {table} - 없음")
                        all_exists = False
                        
    except Exception as e:
        print(f"❌ 테이블 확인 실패: {e}")
        all_exists = False
    
    return all_exists

def create_missing_columns():
    """누락된 컬럼 생성"""
    column_fixes = [
        # (테이블명, 컬럼명, SQL)
        ('projects_project', 'development_framework', 
         "ALTER TABLE projects_project ADD COLUMN development_framework VARCHAR(50) DEFAULT 'React';"),
        ('feedbacks_feedback', 'priority', 
         "ALTER TABLE feedbacks_feedback ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';"),
        ('feedbacks_feedback', 'category', 
         "ALTER TABLE feedbacks_feedback ADD COLUMN category VARCHAR(50) DEFAULT 'general';"),
    ]
    
    print("\n🔧 누락된 컬럼 확인 및 생성:")
    
    with connection.cursor() as cursor:
        for table, column, sql in column_fixes:
            try:
                # 컬럼 존재 여부 확인
                cursor.execute(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' 
                    AND column_name = '{column}';
                """)
                
                if not cursor.fetchone():
                    print(f"   ⚠️  {table}.{column} 누락 - 생성 중...")
                    cursor.execute(sql)
                    print(f"   ✅ {table}.{column} 생성 완료")
                else:
                    print(f"   ✅ {table}.{column} 이미 존재")
                    
            except Exception as e:
                print(f"   ❌ {table}.{column} 처리 실패: {e}")

def main():
    """메인 실행 함수"""
    try:
        # Django 설정
        django.setup()
        print("✅ Django 설정 성공\n")
        
        # 1. 데이터베이스 연결 확인
        if not check_database_connection():
            print("\n❌ 데이터베이스 연결 실패. 마이그레이션을 중단합니다.")
            return False
        
        # 2. 마이그레이션 테이블 확인
        ensure_migration_tables()
        
        # 3. 마이그레이션 실행
        run_migrations_safely()
        
        # 4. 핵심 테이블 검증
        if verify_critical_tables():
            print("\n✅ 모든 핵심 테이블이 존재합니다.")
        else:
            print("\n⚠️  일부 테이블이 누락되었습니다.")
            
        # 5. 누락된 컬럼 생성
        create_missing_columns()
        
        print("\n🎉 마이그레이션 프로세스 완료!")
        return True
        
    except Exception as e:
        print(f"\n❌ 마이그레이션 프로세스 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)