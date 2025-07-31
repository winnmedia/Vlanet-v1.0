#!/usr/bin/env python3
"""
테스트 데이터 생성 스크립트
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
django.setup()

from users.models import User
from projects.models import Project
from django.db import transaction

def create_test_data():
    """테스트 데이터 생성"""
    print("🔧 테스트 데이터 생성 시작")
    print("=" * 50)
    
    with transaction.atomic():
        # 1. 테스트 사용자 생성
        print("\n1️⃣ 테스트 사용자 생성")
        
        users = [
            {"email": "test@example.com", "password": "Test123!", "name": "테스트 사용자"},
            {"email": "admin@example.com", "password": "Admin123!", "name": "관리자", "is_staff": True},
            {"email": "demo@example.com", "password": "Demo123!", "name": "데모 사용자"}
        ]
        
        for user_data in users:
            email = user_data.pop('email')
            password = user_data.pop('password')
            
            try:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults=user_data
                )
                if created:
                    user.set_password(password)
                    user.save()
                    print(f"✅ 생성: {email}")
                else:
                    print(f"✅ 이미 존재: {email}")
            except Exception as e:
                print(f"❌ 오류 ({email}): {e}")
        
        # 2. 테스트 프로젝트 생성
        print("\n2️⃣ 테스트 프로젝트 생성")
        
        try:
            test_user = User.objects.get(email="test@example.com")
            
            projects = [
                {
                    "name": "샘플 광고 프로젝트",
                    "genre": "광고",
                    "running_time": "30초",
                    "purpose": "테스트",
                    "description": "VideoPlanet 테스트용 샘플 프로젝트입니다."
                },
                {
                    "name": "홍보 영상 프로젝트",
                    "genre": "홍보",
                    "running_time": "3분",
                    "purpose": "홍보",
                    "description": "기업 홍보 영상 제작 프로젝트"
                }
            ]
            
            for project_data in projects:
                project, created = Project.objects.get_or_create(
                    user=test_user,
                    name=project_data['name'],
                    defaults=project_data
                )
                if created:
                    print(f"✅ 생성: {project.name}")
                else:
                    print(f"✅ 이미 존재: {project.name}")
                    
        except User.DoesNotExist:
            print("❌ 테스트 사용자를 찾을 수 없습니다")
        except Exception as e:
            print(f"❌ 프로젝트 생성 오류: {e}")
    
    print("\n" + "=" * 50)
    print("✅ 테스트 데이터 생성 완료")
    
    # 3. 생성된 데이터 요약
    print("\n📊 데이터 요약:")
    print(f"- 총 사용자 수: {User.objects.count()}")
    print(f"- 총 프로젝트 수: {Project.objects.count()}")
    
    print("\n🔑 테스트 계정:")
    print("- 일반: test@example.com / Test123!")
    print("- 관리자: admin@example.com / Admin123!")
    print("- 데모: demo@example.com / Demo123!")

if __name__ == "__main__":
    create_test_data()