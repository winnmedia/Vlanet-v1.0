#!/usr/bin/env python3
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from projects.models import BasicPlan, Project
from users.models import User
from feedbacks.models import FeedBack
from django.db import transaction
import json

# 테스트 데이터
test_inputs = {
    "name": "테스트 프로젝트",
    "description": "테스트 설명",
    "manager": "홍길동",
    "consumer": "테스트 고객사"
}

test_process = [
    {
        "key": "basic_plan",
        "startDate": "2025-07-01",
        "endDate": "2025-07-05"
    }
]

print("=== 프로젝트 생성 테스트 시작 ===")

# 사용자 확인
try:
    user = User.objects.first()
    if not user:
        print("테스트 사용자가 없습니다.")
        sys.exit(1)
    print(f"테스트 사용자: {user.username}")
except Exception as e:
    print(f"사용자 조회 오류: {e}")
    sys.exit(1)

# 프로젝트 생성 시뮬레이션
try:
    with transaction.atomic():
        print("\n1. 프로젝트 객체 생성")
        project = Project.objects.create(user=user)
        print(f"   - 프로젝트 ID: {project.id}")
        
        print("\n2. 기본 정보 설정")
        for k, v in test_inputs.items():
            setattr(project, k, v)
            print(f"   - {k}: {v}")
        
        print("\n3. 프로세스 데이터 처리")
        for i in test_process:
            key = i.get("key")
            start_date = i.get("startDate")
            end_date = i.get("endDate")
            print(f"   - 처리 중: {key}")
            print(f"     시작일: {start_date}, 종료일: {end_date}")
            
            if key == "basic_plan":
                print("     BasicPlan 생성 시도...")
                basic_plan = BasicPlan.objects.create(
                    start_date=start_date, 
                    end_date=end_date
                )
                print(f"     BasicPlan 생성 완료: ID={basic_plan.id}")
                setattr(project, key, basic_plan)
        
        print("\n4. 피드백 객체 생성")
        feedback = FeedBack.objects.create()
        project.feedback = feedback
        print(f"   - 피드백 ID: {feedback.id}")
        
        print("\n5. 프로젝트 색상 설정")
        project.color = "#FF0000"
        print(f"   - 색상: {project.color}")
        
        print("\n6. 프로젝트 저장")
        project.save()
        print(f"   - 저장 완료!")
        
        print("\n=== 프로젝트 생성 성공 ===")
        print(f"프로젝트 ID: {project.id}")
        print(f"프로젝트 이름: {project.name}")
        
except Exception as e:
    print(f"\n!!! 오류 발생 !!!")
    print(f"오류 유형: {type(e).__name__}")
    print(f"오류 메시지: {str(e)}")
    import traceback
    traceback.print_exc()