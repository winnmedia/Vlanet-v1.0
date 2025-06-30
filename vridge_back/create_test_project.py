#!/usr/bin/env python
"""
테스트 프로젝트 생성 스크립트
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from projects.models import Project, Members
from feedbacks.models import FeedBack

def create_test_projects():
    """테스트 프로젝트 생성"""
    print("=" * 50)
    print("테스트 프로젝트 생성 시작")
    print("=" * 50)
    
    # 데모 사용자 가져오기
    demo_users = []
    for i in range(1, 6):
        user = User.objects.filter(username=f"demo{i}@videoplanet.com").first()
        if user:
            demo_users.append(user)
    
    if not demo_users:
        print("❌ 데모 사용자가 없습니다. 먼저 create_demo_accounts.py를 실행하세요.")
        return
    
    # 테스트 프로젝트 정보
    test_projects = [
        {
            "name": "신제품 런칭 홍보 영상",
            "manager": "김영상",
            "consumer": "삼성전자",
            "description": "갤럭시 S24 출시 홍보 영상 제작",
            "owner": demo_users[0],
            "members": [demo_users[1], demo_users[2]]
        },
        {
            "name": "기업 브랜드 필름",
            "manager": "이편집",
            "consumer": "LG전자",
            "description": "기업 비전 2030 브랜드 필름 제작",
            "owner": demo_users[1],
            "members": [demo_users[0], demo_users[3]]
        },
        {
            "name": "온라인 교육 콘텐츠",
            "manager": "박크리에이터",
            "consumer": "패스트캠퍼스",
            "description": "파이썬 프로그래밍 입문 강의 영상",
            "owner": demo_users[2],
            "members": [demo_users[3], demo_users[4]]
        }
    ]
    
    created_projects = []
    
    for project_data in test_projects:
        try:
            # 프로젝트 생성
            project = Project.objects.create(
                name=project_data["name"],
                manager=project_data["manager"],
                consumer=project_data["consumer"],
                description=project_data["description"],
                user=project_data["owner"]
            )
            
            # 멤버 추가
            for member in project_data["members"]:
                Members.objects.create(
                    project=project,
                    user=member,
                    rating="general"
                )
            
            # 피드백 객체 생성
            feedback = FeedBack.objects.create()
            project.feedback = feedback
            project.save()
            
            print(f"✅ 프로젝트 생성 완료: {project.name} (ID: {project.id})")
            created_projects.append({
                "id": project.id,
                "name": project.name,
                "owner": project.user.nickname,
                "owner_email": project.user.username
            })
            
        except Exception as e:
            print(f"❌ 프로젝트 생성 실패 ({project_data['name']}): {e}")
    
    # 결과 출력
    print("\n" + "=" * 50)
    print("생성된 테스트 프로젝트")
    print("=" * 50)
    print("\n다음 프로젝트들이 생성되었습니다:\n")
    
    for project in created_projects:
        print(f"프로젝트 ID: {project['id']}")
        print(f"프로젝트명: {project['name']}")
        print(f"소유자: {project['owner']} ({project['owner_email']})")
        print(f"피드백 페이지 URL: /Feedback/{project['id']}")
        print("-" * 30)
    
    # 프로젝트 정보 파일로 저장
    with open("TEST_PROJECTS.md", "w", encoding="utf-8") as f:
        f.write("# VideoPlanet 테스트 프로젝트 정보\n\n")
        f.write("## 생성된 프로젝트 목록\n\n")
        
        for project in created_projects:
            f.write(f"### {project['name']}\n")
            f.write(f"- **프로젝트 ID**: {project['id']}\n")
            f.write(f"- **소유자**: {project['owner']} ({project['owner_email']})\n")
            f.write(f"- **피드백 페이지**: `/Feedback/{project['id']}`\n\n")
        
        f.write("## 테스트 방법\n\n")
        f.write("1. 해당 프로젝트 소유자 계정으로 로그인\n")
        f.write("2. 피드백 페이지 URL로 이동\n")
        f.write("3. 영상 업로드 및 피드백 기능 테스트\n")
    
    print("\n✅ 프로젝트 정보가 TEST_PROJECTS.md 파일에 저장되었습니다.")

if __name__ == "__main__":
    create_test_projects()