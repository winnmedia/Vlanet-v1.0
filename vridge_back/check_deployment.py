#!/usr/bin/env python
"""
Railway 배포 상태 확인 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from projects.models import Project
from feedbacks.models import FeedBack, FeedBackComment

User = get_user_model()

def check_database_tables():
    """데이터베이스 테이블 확인"""
    print("🔍 데이터베이스 테이블 확인 중...")
    
    with connection.cursor() as cursor:
        # PostgreSQL 테이블 목록 조회
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        tables = cursor.fetchall()
        
        print(f"\n📋 총 {len(tables)}개의 테이블:")
        for table in tables:
            print(f"  - {table[0]}")
    
    # 주요 모델 확인
    print("\n📊 주요 모델 데이터:")
    print(f"  - 사용자 수: {User.objects.count()}")
    print(f"  - 프로젝트 수: {Project.objects.count()}")
    print(f"  - 피드백 파일 수: {FeedBack.objects.count()}")
    print(f"  - 피드백 코멘트 수: {FeedBackComment.objects.count()}")

def check_user_fields():
    """User 모델 필드 확인"""
    print("\n🔍 User 모델 필드 확인 중...")
    
    # 첫 번째 사용자 가져오기
    user = User.objects.first()
    if user:
        fields = [f.name for f in User._meta.get_fields()]
        print(f"  User 모델 필드 ({len(fields)}개):")
        for field in sorted(fields):
            print(f"    - {field}")
    else:
        print("  ❌ 사용자가 없습니다.")

def check_missing_columns():
    """누락된 컬럼 확인"""
    print("\n🔍 누락된 컬럼 확인 중...")
    
    with connection.cursor() as cursor:
        # email_verified 컬럼 확인
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users_user' 
            AND column_name = 'email_verified';
        """)
        
        if cursor.fetchone():
            print("  ✅ email_verified 컬럼 존재")
        else:
            print("  ❌ email_verified 컬럼 누락")
        
        # 다른 중요 컬럼들도 확인
        important_columns = [
            ('users_user', 'nickname'),
            ('users_user', 'login_method'),
            ('projects_project', 'created'),
            ('projects_project', 'updated'),
        ]
        
        for table, column in important_columns:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s 
                AND column_name = %s;
            """, [table, column])
            
            if cursor.fetchone():
                print(f"  ✅ {table}.{column} 존재")
            else:
                print(f"  ❌ {table}.{column} 누락")

if __name__ == '__main__':
    try:
        print("🚀 Railway 배포 상태 확인 시작...\n")
        
        check_database_tables()
        check_user_fields()
        check_missing_columns()
        
        print("\n✅ 확인 완료!")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)