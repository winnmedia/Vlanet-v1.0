#!/usr/bin/env python3
"""
프로젝트 삭제 디버깅 스크립트
"""
import os
import sys

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_safe')

try:
    import django
    django.setup()
    
    from projects.models import Project
    from django.db import connection
    
    print("🔍 프로젝트 삭제 디버깅 시작...")
    
    # 프로젝트 ID 119 확인
    project_id = 119
    try:
        project = Project.objects.get(id=project_id)
        print(f"✅ 프로젝트 발견: {project.name} (ID: {project.id})")
        print(f"   소유자: {project.user.username}")
        print(f"   생성일: {project.created}")
        
        # 연관 데이터 확인
        print("\n📋 연관 데이터 확인:")
        
        # 멤버 수
        from projects.models import Members
        member_count = Members.objects.filter(project=project).count()
        print(f"   멤버: {member_count}개")
        
        # 초대 수
        from projects.models import ProjectInvite
        invite_count = ProjectInvite.objects.filter(project=project).count()
        print(f"   초대: {invite_count}개")
        
        # 파일 수
        from projects.models import File
        file_count = File.objects.filter(project=project).count()
        print(f"   파일: {file_count}개")
        
        # 메모 수
        from projects.models import Memo
        memo_count = Memo.objects.filter(project=project).count()
        print(f"   메모: {memo_count}개")
        
        # 피드백 확인
        if hasattr(project, 'feedback') and project.feedback:
            print(f"   피드백: 있음 (ID: {project.feedback.id})")
        else:
            print(f"   피드백: 없음")
        
        # 프로젝트 단계 확인
        stages = ['basic_plan', 'confirmation', 'storyboard', 'filming', 'video_edit', 'video_preview', 'postwork', 'video_delivery']
        existing_stages = []
        for stage in stages:
            if hasattr(project, stage) and getattr(project, stage):
                existing_stages.append(stage)
        
        print(f"   프로젝트 단계: {', '.join(existing_stages) if existing_stages else '없음'}")
        
    except Project.DoesNotExist:
        print(f"❌ 프로젝트 ID {project_id}를 찾을 수 없습니다.")
        
        # 존재하는 프로젝트들 확인
        projects = Project.objects.all()[:5]
        print(f"\n📋 존재하는 프로젝트들 (최대 5개):")
        for p in projects:
            print(f"   ID: {p.id}, 이름: {p.name}, 소유자: {p.user.username}")
    
    print("\n✅ 디버깅 완료!")
    
except Exception as e:
    print(f"❌ 오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)