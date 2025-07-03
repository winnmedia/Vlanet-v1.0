#!/usr/bin/env python3
"""
서버 복구 스크립트
"""
import os
import sys
import django
import subprocess

# Django 설정 로드
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model
from projects.models import Project
from video_planning.models import VideoPlanning

User = get_user_model()

def fix_database():
    """데이터베이스 문제 해결"""
    print("1. 데이터베이스 무결성 검사 중...")
    
    # 중복 프로젝트 제거
    users_with_projects = Project.objects.values('user').distinct()
    for user_info in users_with_projects:
        user_id = user_info['user']
        projects = Project.objects.filter(user_id=user_id).values('name').annotate(count=models.Count('name')).filter(count__gt=1)
        
        for project in projects:
            # 중복된 프로젝트 중 최신 것만 남기고 삭제
            duplicates = Project.objects.filter(user_id=user_id, name=project['name']).order_by('-created')
            if duplicates.count() > 1:
                for dup in duplicates[1:]:
                    print(f"   - 중복 프로젝트 삭제: {dup.name} (User: {dup.user.username})")
                    dup.delete()
    
    print("✅ 데이터베이스 정리 완료")

def create_test_user():
    """테스트 사용자 생성"""
    print("\n2. 테스트 사용자 확인 중...")
    
    test_email = 'test@example.com'
    test_password = 'TestPassword123!'
    
    try:
        user = User.objects.get(email=test_email)
        print(f"   - 테스트 사용자 이미 존재: {test_email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username=test_email,
            email=test_email,
            password=test_password,
            company_name='Test Company'
        )
        print(f"   - 테스트 사용자 생성 완료: {test_email}")
    
    return user

def check_settings():
    """설정 확인"""
    print("\n3. Django 설정 확인 중...")
    
    from django.conf import settings
    
    print(f"   - DEBUG: {settings.DEBUG}")
    print(f"   - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"   - DATABASE: {settings.DATABASES['default']['ENGINE']}")
    print(f"   - STATIC_ROOT: {settings.STATIC_ROOT}")
    print(f"   - MEDIA_ROOT: {settings.MEDIA_ROOT}")
    
    # API 키 확인
    if settings.GOOGLE_API_KEY:
        print(f"   - GOOGLE_API_KEY: 설정됨 (길이: {len(settings.GOOGLE_API_KEY)})")
    else:
        print("   - GOOGLE_API_KEY: ⚠️  설정되지 않음")
    
    if hasattr(settings, 'HUGGINGFACE_API_KEY') and settings.HUGGINGFACE_API_KEY:
        print(f"   - HUGGINGFACE_API_KEY: 설정됨")
    else:
        print("   - HUGGINGFACE_API_KEY: ⚠️  설정되지 않음")

def run_server():
    """서버 실행"""
    print("\n4. 서버 시작 중...")
    print("   - http://localhost:8000 에서 실행됩니다.")
    print("   - Ctrl+C로 종료할 수 있습니다.\n")
    
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])

if __name__ == '__main__':
    try:
        print("🔧 VideoPlanet 서버 복구 시작\n")
        
        # 마이그레이션 실행
        print("0. 마이그레이션 실행 중...")
        execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
        
        # 캐시 테이블 생성
        try:
            execute_from_command_line(['manage.py', 'createcachetable'])
            print("   - 캐시 테이블 생성 완료")
        except:
            print("   - 캐시 테이블 이미 존재")
        
        # 데이터베이스 정리
        from django.db import models
        fix_database()
        
        # 테스트 사용자 생성
        create_test_user()
        
        # 설정 확인
        check_settings()
        
        # 서버 실행
        run_server()
        
    except KeyboardInterrupt:
        print("\n\n👋 서버를 종료합니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()