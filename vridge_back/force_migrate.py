#!/usr/bin/env python
"""
강제 마이그레이션 스크립트
Railway 프로덕션 환경에서 마이그레이션이 적용되지 않을 때 사용
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')
django.setup()

from django.core.management import call_command
from django.db import connection, transaction
from django.db.migrations.executor import MigrationExecutor

def force_migrate():
    print("=== 강제 마이그레이션 시작 ===")
    
    # 1. 현재 상태 확인
    print("\n1. 현재 마이그레이션 상태:")
    executor = MigrationExecutor(connection)
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    
    if plan:
        print(f"적용되지 않은 마이그레이션 {len(plan)}개 발견:")
        for migration, backwards in plan:
            print(f"  - {migration}")
    else:
        print("모든 마이그레이션이 적용된 상태입니다.")
    
    # 2. projects 앱의 마이그레이션 상태 확인
    print("\n2. projects 앱 마이그레이션 상태:")
    call_command('showmigrations', 'projects')
    
    # 3. 강제 마이그레이션 실행
    print("\n3. 마이그레이션 실행 중...")
    try:
        # 일반 마이그레이션
        call_command('migrate', verbosity=2)
    except Exception as e:
        print(f"일반 마이그레이션 실패: {e}")
        print("강제 마이그레이션 시도...")
        
        # 특정 앱만 마이그레이션
        try:
            call_command('migrate', 'projects', verbosity=2)
        except Exception as e2:
            print(f"projects 앱 마이그레이션 실패: {e2}")
            
            # fake 마이그레이션 시도
            print("Fake 마이그레이션 시도...")
            try:
                call_command('migrate', 'projects', '0017', '--fake')
                print("Fake 마이그레이션 성공")
            except Exception as e3:
                print(f"Fake 마이그레이션도 실패: {e3}")
    
    # 4. 수동으로 컬럼 추가 (최후의 수단)
    print("\n4. 데이터베이스 상태 확인 및 수동 처리...")
    with connection.cursor() as cursor:
        # PostgreSQL인지 확인
        is_postgres = 'postgresql' in connection.vendor
        
        if is_postgres:
            # 테이블 존재 확인
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects_project'
                AND column_name IN ('tone_manner', 'genre', 'concept')
            """)
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            missing_columns = []
            for col in ['tone_manner', 'genre', 'concept']:
                if col not in existing_columns:
                    missing_columns.append(col)
            
            if missing_columns:
                print(f"누락된 컬럼 발견: {missing_columns}")
                print("수동으로 컬럼 추가 시도...")
                
                for col in missing_columns:
                    try:
                        cursor.execute(f"""
                            ALTER TABLE projects_project 
                            ADD COLUMN {col} VARCHAR(50) NULL
                        """)
                        print(f"✅ {col} 컬럼 추가 성공")
                    except Exception as e:
                        print(f"❌ {col} 컬럼 추가 실패: {e}")
            
            # IdempotencyRecord 테이블 확인
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'projects_idempotencyrecord'
                )
            """)
            if not cursor.fetchone()[0]:
                print("projects_idempotencyrecord 테이블이 없습니다. 생성 시도...")
                try:
                    cursor.execute("""
                        CREATE TABLE projects_idempotencyrecord (
                            id BIGSERIAL PRIMARY KEY,
                            user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
                            idempotency_key VARCHAR(255) NOT NULL,
                            project_id INTEGER NULL,
                            request_data TEXT NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(20) NOT NULL DEFAULT 'processing',
                            UNIQUE(user_id, idempotency_key)
                        );
                        CREATE INDEX idx_idempotency_created ON projects_idempotencyrecord(created_at);
                    """)
                    print("✅ projects_idempotencyrecord 테이블 생성 성공")
                except Exception as e:
                    print(f"❌ 테이블 생성 실패: {e}")
            
            # video_planning 테이블 확인
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'video_planning'
                )
            """)
            if not cursor.fetchone()[0]:
                print("video_planning 테이블이 없습니다.")
                try:
                    call_command('migrate', 'video_planning', verbosity=2)
                except Exception as e:
                    print(f"video_planning 마이그레이션 실패: {e}")
    
    # 5. 최종 확인
    print("\n5. 최종 상태 확인:")
    call_command('showmigrations')
    
    print("\n=== 강제 마이그레이션 완료 ===")

if __name__ == "__main__":
    force_migrate()