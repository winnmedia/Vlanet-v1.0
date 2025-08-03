#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from projects.models import Project
from users.models import User

try:
    # 모든 프로젝트 확인
    all_projects = Project.objects.all()
    print(f"전체 프로젝트 수: {all_projects.count()}")
    
    for project in all_projects:
        print(f"\n프로젝트: {project.name} (ID: {project.id})")
        print(f"  - 소유자: {project.user.email if project.user else 'None'}")
        print(f"  - 생성일: {project.created}")
        print(f"  - 담당자: {project.manager}")
        print(f"  - 광고주: {project.consumer}")
    
    # CEO 사용자의 프로젝트 확인
    user = User.objects.filter(username="ceo@winnmedia.co.kr").first()
    if user:
        user_projects = user.projects.all()
        print(f"\n\nceo@winnmedia.co.kr의 프로젝트 수: {user_projects.count()}")
        for project in user_projects:
            print(f"  - {project.name} (ID: {project.id})")
            
except Exception as e:
    print(f"오류 발생: {e}")
    import traceback
    traceback.print_exc()