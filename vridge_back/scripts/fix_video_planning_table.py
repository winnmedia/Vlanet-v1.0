#!/usr/bin/env python
"""
Video Planning 테이블 생성 스크립트
Railway 환경에서 video_planning 테이블이 누락된 경우 사용
"""

import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection, transaction
from django.core.management import call_command

def check_table_exists(table_name):
    """테이블 존재 여부 확인"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM pg_tables 
                WHERE tablename = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def create_video_planning_tables():
    """video_planning 관련 테이블 수동 생성"""
    with connection.cursor() as cursor:
        # video_planning 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_planning (
                id BIGSERIAL PRIMARY KEY,
                created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                planning_text TEXT NOT NULL,
                planning_data JSONB DEFAULT '{}',
                status VARCHAR(20) DEFAULT 'created',
                user_id BIGINT REFERENCES users_user(id) ON DELETE CASCADE,
                title VARCHAR(200) DEFAULT '',
                session_id VARCHAR(100) DEFAULT '',
                metadata JSONB DEFAULT '{}'
            );
        """)
        
        # 인덱스 생성
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_planning_user ON video_planning(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_planning_created ON video_planning(created);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_planning_session ON video_planning(session_id);")
        
        # video_planning_image 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_planning_image (
                id BIGSERIAL PRIMARY KEY,
                created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                planning_id BIGINT NOT NULL REFERENCES video_planning(id) ON DELETE CASCADE,
                image_type VARCHAR(50) NOT NULL,
                image_url TEXT NOT NULL,
                prompt TEXT DEFAULT '',
                metadata JSONB DEFAULT '{}'
            );
        """)
        
        # 인덱스 생성
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_planning_image_planning ON video_planning_image(planning_id);")
        
    print("✅ video_planning 테이블이 생성되었습니다.")

def mark_migrations_as_applied():
    """마이그레이션을 적용된 것으로 표시"""
    with connection.cursor() as cursor:
        # 0001_initial
        cursor.execute("""
            INSERT INTO django_migrations (app, name, applied)
            VALUES ('video_planning', '0001_initial', NOW())
            ON CONFLICT (app, name) DO NOTHING;
        """)
        
        # 0002_alter_videoplanning_user
        cursor.execute("""
            INSERT INTO django_migrations (app, name, applied)
            VALUES ('video_planning', '0002_alter_videoplanning_user', NOW())
            ON CONFLICT (app, name) DO NOTHING;
        """)
    
    print("✅ 마이그레이션이 적용된 것으로 표시되었습니다.")

def verify_tables():
    """테이블 생성 확인 및 테스트"""
    try:
        from video_planning.models import VideoPlanning
        
        # 카운트 테스트
        count = VideoPlanning.objects.count()
        print(f"✅ VideoPlanning 테이블 정상 작동 - 레코드 수: {count}")
        
        # 테스트 레코드 생성
        test_record = VideoPlanning.objects.create(
            planning_text="시스템 테스트",
            planning_data={"test": True, "created_by": "fix_script"}
        )
        print(f"✅ 테스트 레코드 생성 성공 - ID: {test_record.id}")
        
        # 테스트 레코드 삭제
        test_record.delete()
        print("✅ 테스트 레코드 삭제 완료")
        
        return True
    except Exception as e:
        print(f"❌ 테이블 검증 실패: {str(e)}")
        return False

def main():
    print("🔧 Video Planning 테이블 수정 스크립트 시작...")
    
    # 1. 테이블 존재 확인
    video_planning_exists = check_table_exists('video_planning')
    video_planning_image_exists = check_table_exists('video_planning_image')
    
    print(f"video_planning 테이블 존재: {video_planning_exists}")
    print(f"video_planning_image 테이블 존재: {video_planning_image_exists}")
    
    # 2. 테이블이 없으면 생성
    if not video_planning_exists or not video_planning_image_exists:
        print("\n📦 테이블 생성 중...")
        
        # 먼저 마이그레이션 시도
        try:
            print("마이그레이션 실행 시도...")
            call_command('migrate', 'video_planning', verbosity=2)
            print("✅ 마이그레이션 성공")
        except Exception as e:
            print(f"⚠️ 마이그레이션 실패: {str(e)}")
            print("수동 테이블 생성 시도...")
            
            # 수동 생성
            try:
                with transaction.atomic():
                    create_video_planning_tables()
                    mark_migrations_as_applied()
            except Exception as e:
                print(f"❌ 수동 생성 실패: {str(e)}")
                return
    else:
        print("✅ 테이블이 이미 존재합니다.")
    
    # 3. 테이블 검증
    print("\n🔍 테이블 검증 중...")
    if verify_tables():
        print("\n✅ 모든 작업이 완료되었습니다!")
        print("이제 최근 생성한 기획 기능이 정상 작동할 것입니다.")
    else:
        print("\n⚠️ 테이블은 생성되었지만 일부 문제가 있을 수 있습니다.")
        print("Railway 콘솔에서 수동으로 확인해주세요.")

if __name__ == "__main__":
    main()