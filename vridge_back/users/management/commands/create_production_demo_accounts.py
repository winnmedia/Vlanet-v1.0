#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
프로덕션 환경에서 테스트 계정을 생성하는 Django management command
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import User
from projects.models import Project, Members
from feedbacks.models import FeedBack
import json


class Command(BaseCommand):
    help = '프로덕션 환경에 테스트 계정 생성'

    def handle(self, *args, **options):
        self.stdout.write("프로덕션 테스트 계정 생성 시작...")
        
        # 테스트 계정 정보
        demo_accounts = [
            {
                "email": "test1@videoplanet.com",
                "nickname": "테스트 편집자",
                "password": "Test1234!@#$",
                "description": "비디오 편집 테스트 계정"
            },
            {
                "email": "test2@videoplanet.com", 
                "nickname": "테스트 프로듀서",
                "password": "Test1234!@#$",
                "description": "프로젝트 관리 테스트 계정"
            },
            {
                "email": "test3@videoplanet.com",
                "nickname": "테스트 크리에이터",
                "password": "Test1234!@#$", 
                "description": "콘텐츠 제작 테스트 계정"
            }
        ]
        
        created_users = []
        
        # 계정 생성
        for account in demo_accounts:
            try:
                user, created = User.objects.get_or_create(
                    username=account["email"],
                    defaults={
                        'nickname': account["nickname"],
                        'password': make_password(account["password"]),
                        'login_method': 'email'
                    }
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ 계정 생성됨: {account['email']}")
                    )
                    created_users.append(user)
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⚠️  이미 존재함: {account['email']}")
                    )
                    created_users.append(user)
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ 생성 실패 {account['email']}: {e}")
                )
        
        # 테스트 프로젝트 생성
        if created_users:
            self.stdout.write("\n테스트 프로젝트 생성 중...")
            
            for i, user in enumerate(created_users[:2], 1):
                try:
                    project, created = Project.objects.get_or_create(
                        project_name=f"테스트 프로젝트 {i}",
                        defaults={
                            'client_name': f"테스트 클라이언트 {i}",
                            'budget': '1000000',
                            'project_status': 'wait',
                            'project_description': f'프로덕션 테스트용 프로젝트 {i}'
                        }
                    )
                    
                    if created:
                        # 프로젝트 멤버 추가
                        Members.objects.get_or_create(
                            project=project,
                            user=user,
                            role='project_manager'
                        )
                        
                        # 피드백 생성
                        feedback = FeedBack.objects.create(
                            project=project,
                            feedback_name=f"테스트 피드백 {i}",
                            feedback_round=1,
                            feedback_description="프로덕션 테스트용 피드백"
                        )
                        
                        self.stdout.write(
                            self.style.SUCCESS(f"✅ 프로젝트 생성됨: {project.project_name}")
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f"⚠️  프로젝트 이미 존재: {project.project_name}")
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"❌ 프로젝트 생성 실패: {e}")
                    )
        
        # 계정 정보 출력
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("프로덕션 테스트 계정 정보"))
        self.stdout.write("="*60)
        
        for account in demo_accounts:
            self.stdout.write(f"\n이메일: {account['email']}")
            self.stdout.write(f"비밀번호: {account['password']}")
            self.stdout.write(f"설명: {account['description']}")
            self.stdout.write("-"*40)
        
        self.stdout.write("\n" + self.style.WARNING("⚠️  주의사항:"))
        self.stdout.write("- 이 계정들은 테스트 용도로만 사용하세요")
        self.stdout.write("- 프로덕션 환경에서는 보안을 위해 정기적으로 비밀번호를 변경하세요")
        self.stdout.write("- 로그인 시 '이메일' 필드를 사용하세요\n")