#!/usr/bin/env python3
"""
프로젝트 생성 디버깅 스크립트
프로젝트 생성 관련 문제를 진단하고 해결하는 도구
"""

import os
import sys
import django
import json
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import transaction
from django.utils import timezone
from projects.models import Project, BasicPlan, Storyboard, Filming, VideoEdit, PostWork, VideoPreview, Confirmation, VideoDelivery
from feedbacks.models import FeedBack
from users.models import User

def check_models():
    """모델 클래스 확인"""
    print("=== 모델 클래스 확인 ===")
    
    models_to_check = [
        ('Project', Project),
        ('BasicPlan', BasicPlan),
        ('Storyboard', Storyboard),
        ('FeedBack', FeedBack),
        ('User', User),
    ]
    
    for name, model in models_to_check:
        print(f"✓ {name}: {model}")
        print(f"  - Table name: {model._meta.db_table}")
        print(f"  - App label: {model._meta.app_label}")
    
    print("\n")

def check_feedback_model():
    """FeedBack 모델 이름 확인"""
    print("=== FeedBack 모델 확인 ===")
    
    # feedbacks 앱에서 사용 가능한 모델 확인
    from feedbacks import models as feedback_models
    
    print("feedbacks.models 내용:")
    for attr_name in dir(feedback_models):
        attr = getattr(feedback_models, attr_name)
        if hasattr(attr, '_meta') and hasattr(attr._meta, 'db_table'):
            print(f"  - {attr_name}: {attr}")
    
    # 정확한 모델 이름 확인
    try:
        fb = feedback_models.FeedBack
        print(f"\n✓ FeedBack 모델 발견: {fb}")
    except AttributeError:
        print("\n✗ FeedBack 모델을 찾을 수 없습니다.")
    
    print("\n")

def test_date_parsing():
    """날짜 파싱 테스트"""
    print("=== 날짜 파싱 테스트 ===")
    
    test_dates = [
        "2025-07-01",
        "2025-07-01 10:30",
        "2025-07-01T10:30:00",
        "2025-07-01T10:30:00Z",
        "2025-07-01T10:30:00+09:00",
    ]
    
    for date_str in test_dates:
        print(f"\n테스트 날짜: {date_str}")
        try:
            # 방법 1: strptime
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                print(f"  ✓ strptime (Y-m-d): {dt}")
            except ValueError:
                try:
                    dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
                    print(f"  ✓ strptime (Y-m-d H:M): {dt}")
                except ValueError:
                    pass
            
            # 방법 2: fromisoformat
            try:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                print(f"  ✓ fromisoformat: {dt}")
            except ValueError:
                pass
            
            # 방법 3: timezone aware
            try:
                dt = timezone.make_aware(datetime.strptime(date_str, "%Y-%m-%d"))
                print(f"  ✓ timezone aware: {dt}")
            except:
                pass
                
        except Exception as e:
            print(f"  ✗ 오류: {e}")
    
    print("\n")

def simulate_project_creation():
    """프로젝트 생성 시뮬레이션"""
    print("=== 프로젝트 생성 시뮬레이션 ===")
    
    # 테스트 사용자 가져오기
    user = User.objects.first()
    if not user:
        print("✗ 사용자가 없습니다. 먼저 사용자를 생성해주세요.")
        return
    
    print(f"테스트 사용자: {user.username}")
    
    # 테스트 데이터
    inputs = {
        "name": "디버그 테스트 프로젝트",
        "manager": "홍길동",
        "consumer": "테스트 고객사",
        "description": "프로젝트 생성 디버깅용"
    }
    
    process = [
        {
            "key": "basic_plan",
            "startDate": "2025-07-01",
            "endDate": "2025-07-05"
        },
        {
            "key": "story_board",
            "startDate": "2025-07-06",
            "endDate": "2025-07-10"
        }
    ]
    
    try:
        with transaction.atomic():
            print("\n1. Project 객체 생성")
            project = Project.objects.create(user=user)
            print(f"   ✓ Project ID: {project.id}")
            
            print("\n2. 기본 정보 설정")
            for k, v in inputs.items():
                setattr(project, k, v)
                print(f"   ✓ {k}: {v}")
            
            print("\n3. 프로세스 단계 생성")
            for proc in process:
                key = proc.get("key")
                start_date = proc.get("startDate")
                end_date = proc.get("endDate")
                
                print(f"\n   처리 중: {key}")
                
                # 날짜 변환
                if start_date:
                    start_date = timezone.make_aware(datetime.strptime(start_date, "%Y-%m-%d"))
                if end_date:
                    end_date = timezone.make_aware(datetime.strptime(end_date, "%Y-%m-%d"))
                
                print(f"   - 시작일: {start_date}")
                print(f"   - 종료일: {end_date}")
                
                if key == "basic_plan":
                    obj = BasicPlan.objects.create(start_date=start_date, end_date=end_date)
                    setattr(project, key, obj)
                    print(f"   ✓ BasicPlan 생성: ID={obj.id}")
                elif key == "story_board":
                    obj = Storyboard.objects.create(start_date=start_date, end_date=end_date)
                    setattr(project, key, obj)
                    print(f"   ✓ Storyboard 생성: ID={obj.id}")
            
            print("\n4. FeedBack 객체 생성")
            # 올바른 모델 이름 사용
            feedback = FeedBack.objects.create()
            project.feedback = feedback
            print(f"   ✓ FeedBack ID: {feedback.id}")
            
            print("\n5. 색상 설정")
            project.color = "#FF5733"
            print(f"   ✓ 색상: {project.color}")
            
            print("\n6. 프로젝트 저장")
            project.save()
            print("   ✓ 저장 완료!")
            
            print("\n=== 프로젝트 생성 성공! ===")
            print(f"프로젝트 ID: {project.id}")
            print(f"프로젝트 이름: {project.name}")
            
            # 롤백 (실제로 저장하지 않음)
            raise Exception("테스트 완료 - 롤백")
            
    except Exception as e:
        if "테스트 완료" in str(e):
            print("\n✓ 시뮬레이션 성공! (데이터는 저장되지 않음)")
        else:
            print(f"\n✗ 오류 발생!")
            print(f"오류 유형: {type(e).__name__}")
            print(f"오류 메시지: {str(e)}")
            import traceback
            traceback.print_exc()

def check_view_issues():
    """View 코드의 문제점 확인"""
    print("\n=== View 코드 문제점 ===")
    
    print("1. CreateProject view (line 439)의 문제:")
    print("   - 현재: feedback_model.FeedBack.objects.create()")
    print("   - 문제: 모델 이름이 'FeedBack'임 (대문자 B)")
    print("   - 해결: 정확한 대소문자 사용 필요")
    
    print("\n2. 날짜 파싱 문제:")
    print("   - 프론트엔드에서 다양한 날짜 형식이 올 수 있음")
    print("   - ISO 형식, 한국 시간대 등 고려 필요")
    
    print("\n3. CORS 설정:")
    print("   - @csrf_exempt 데코레이터가 적용되어 있음")
    print("   - CORS 미들웨어 순서 확인 필요")
    
    print("\n")

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("프로젝트 생성 디버깅 도구")
    print("=" * 60)
    print()
    
    # 각 검사 실행
    check_models()
    check_feedback_model()
    test_date_parsing()
    check_view_issues()
    simulate_project_creation()
    
    print("\n" + "=" * 60)
    print("디버깅 완료!")
    print("=" * 60)

if __name__ == "__main__":
    main()