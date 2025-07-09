#!/usr/bin/env python
"""
프로젝트 생성 직접 테스트
데이터베이스 스키마 문제를 정확히 파악하기 위한 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.db import connection
from projects.models import Project
from users.models import User
from django.db import transaction
import json

def check_database_schema():
    """데이터베이스 실제 스키마 확인"""
    print("=== 데이터베이스 스키마 확인 ===")
    with connection.cursor() as cursor:
        # SQLite용 테이블 정보 확인
        cursor.execute("PRAGMA table_info(projects_project);")
        
        columns = cursor.fetchall()
        print("\nprojects_project 테이블 컬럼:")
        for col in columns:
            print(f"  - {col[1]}: {col[2]} (nullable: {not col[3]}, default: {col[4]})")

def check_model_fields():
    """Django 모델 필드 확인"""
    print("\n=== Django Project 모델 필드 ===")
    for field in Project._meta.get_fields():
        if not field.many_to_many and not field.one_to_many:
            print(f"  - {field.name}: {field.__class__.__name__}")

def test_project_creation():
    """프로젝트 생성 테스트"""
    print("\n=== 프로젝트 생성 테스트 ===")
    
    try:
        # 테스트 사용자 가져오기 또는 생성
        user, created = User.objects.get_or_create(
            email="test@example.com",
            defaults={
                "username": "testuser",
                "nickname": "Test User"
            }
        )
        print(f"사용자: {user.email} (새로 생성: {created})")
        
        # 프로젝트 생성 시도
        with transaction.atomic():
            project = Project(
                user=user,
                name="테스트 프로젝트",
                description="스키마 테스트용 프로젝트",
                genre="다큐멘터리"
            )
            
            # 필드별로 설정 시도
            print("\n필드별 설정:")
            
            # 기본 필드
            print(f"  - name: {project.name}")
            print(f"  - user: {project.user}")
            print(f"  - genre: {project.genre}")
            
            # 문제가 될 수 있는 필드들
            if hasattr(project, 'is_public'):
                project.is_public = False
                print(f"  - is_public: {project.is_public}")
            else:
                print("  - is_public: 모델에 없음")
                
            if hasattr(project, 'allow_comments'):
                project.allow_comments = True
                print(f"  - allow_comments: {project.allow_comments}")
            else:
                print("  - allow_comments: 모델에 없음")
                
            if hasattr(project, 'allow_anonymous_feedback'):
                project.allow_anonymous_feedback = False
                print(f"  - allow_anonymous_feedback: {project.allow_anonymous_feedback}")
            else:
                print("  - allow_anonymous_feedback: 모델에 없음")
                
            if hasattr(project, 'tags'):
                project.tags = []
                print(f"  - tags: {project.tags}")
            else:
                print("  - tags: 모델에 없음")
            
            # 저장 시도
            print("\n저장 시도...")
            project.save()
            print(f"✅ 프로젝트 생성 성공! ID: {project.id}")
            
            # 생성된 프로젝트 확인
            saved_project = Project.objects.get(id=project.id)
            print(f"\n저장된 프로젝트 확인:")
            print(f"  - ID: {saved_project.id}")
            print(f"  - 이름: {saved_project.name}")
            print(f"  - 생성일: {saved_project.created_at}")
            
            # 삭제 (테스트 데이터 정리)
            project.delete()
            print("\n테스트 프로젝트 삭제 완료")
            
    except Exception as e:
        print(f"\n❌ 프로젝트 생성 실패!")
        print(f"오류 타입: {type(e).__name__}")
        print(f"오류 메시지: {str(e)}")
        
        # 상세 오류 정보
        import traceback
        print("\n상세 오류:")
        traceback.print_exc()

def check_migrations():
    """마이그레이션 상태 확인"""
    print("\n=== 마이그레이션 상태 ===")
    from django.core.management import call_command
    from io import StringIO
    import sys
    
    buffer = StringIO()
    sys.stdout = buffer
    call_command('showmigrations', 'projects')
    sys.stdout = sys.__stdout__
    
    print("projects 앱 마이그레이션:")
    print(buffer.getvalue())

if __name__ == "__main__":
    print("프로젝트 생성 문제 진단 시작...\n")
    
    # 1. 데이터베이스 스키마 확인
    check_database_schema()
    
    # 2. Django 모델 필드 확인
    check_model_fields()
    
    # 3. 마이그레이션 상태 확인
    check_migrations()
    
    # 4. 실제 프로젝트 생성 테스트
    test_project_creation()
    
    print("\n진단 완료!")