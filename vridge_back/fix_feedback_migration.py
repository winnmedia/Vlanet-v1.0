"""
Railway에서 FeedBack 모델 마이그레이션 문제를 해결하는 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.cors_emergency_fix')
django.setup()

from django.db import connection
from django.core.management import call_command


def check_feedback_table():
    """feedbacks_feedback 테이블의 현재 상태 확인"""
    with connection.cursor() as cursor:
        # 테이블 존재 여부 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'feedbacks_feedback'
            );
        """)
        table_exists = cursor.fetchone()[0]
        print(f"feedbacks_feedback 테이블 존재: {table_exists}")
        
        if table_exists:
            # 컬럼 목록 확인
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'feedbacks_feedback'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("\n현재 컬럼 목록:")
            for col_name, col_type in columns:
                print(f"  - {col_name}: {col_type}")
            
            # video_file_web 컬럼 존재 여부 확인
            video_file_web_exists = any(col[0] == 'video_file_web' for col in columns)
            print(f"\nvideo_file_web 컬럼 존재: {video_file_web_exists}")
            
            return video_file_web_exists
    return False


def add_missing_columns():
    """누락된 컬럼들을 수동으로 추가"""
    with connection.cursor() as cursor:
        try:
            # video_file_web 컬럼 추가
            cursor.execute("""
                ALTER TABLE feedbacks_feedback 
                ADD COLUMN IF NOT EXISTS video_file_web VARCHAR(100);
            """)
            print("video_file_web 컬럼 추가 완료")
            
            # 다른 누락된 컬럼들도 추가
            columns_to_add = [
                ("video_file_high", "VARCHAR(500)"),
                ("video_file_medium", "VARCHAR(500)"),
                ("video_file_low", "VARCHAR(500)"),
                ("thumbnail", "VARCHAR(100)"),
                ("hls_playlist_url", "VARCHAR(500)"),
                ("encoding_status", "VARCHAR(20)"),
                ("duration", "DOUBLE PRECISION"),
                ("width", "INTEGER"),
                ("height", "INTEGER"),
                ("file_size", "BIGINT"),
            ]
            
            for col_name, col_type in columns_to_add:
                cursor.execute(f"""
                    ALTER TABLE feedbacks_feedback 
                    ADD COLUMN IF NOT EXISTS {col_name} {col_type};
                """)
                print(f"{col_name} 컬럼 추가 완료")
                
            # 기본값 설정
            cursor.execute("""
                UPDATE feedbacks_feedback 
                SET encoding_status = 'pending' 
                WHERE encoding_status IS NULL;
            """)
            
            connection.commit()
            print("\n모든 컬럼 추가 완료!")
            
        except Exception as e:
            print(f"컬럼 추가 중 오류 발생: {e}")
            connection.rollback()


def fix_migration_state():
    """마이그레이션 상태 수정"""
    try:
        # 현재 마이그레이션 상태 확인
        print("\n현재 마이그레이션 상태:")
        call_command('showmigrations', 'feedbacks')
        
        # 0008 마이그레이션을 강제로 적용된 것으로 표시
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('feedbacks', '0008_feedback_duration_feedback_encoding_status_and_more', NOW())
                ON CONFLICT (app, name) DO NOTHING;
            """)
            connection.commit()
        
        print("\n마이그레이션 상태 수정 완료")
        
        # 수정 후 상태 확인
        print("\n수정 후 마이그레이션 상태:")
        call_command('showmigrations', 'feedbacks')
        
    except Exception as e:
        print(f"마이그레이션 상태 수정 중 오류: {e}")


def main():
    print("=== FeedBack 테이블 마이그레이션 문제 해결 시작 ===\n")
    
    # 1. 현재 상태 확인
    video_file_web_exists = check_feedback_table()
    
    # 2. 컬럼이 없으면 추가
    if not video_file_web_exists:
        print("\n필요한 컬럼들을 추가합니다...")
        add_missing_columns()
        
        # 다시 확인
        print("\n컬럼 추가 후 상태 확인:")
        check_feedback_table()
    
    # 3. 마이그레이션 상태 수정
    fix_migration_state()
    
    print("\n=== 완료 ===")


if __name__ == "__main__":
    main()