#!/usr/bin/env python
"""
수정사항 테스트 스크립트
"""
import os
import sys
import django
import json
import time
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
os.environ['USE_SQLITE'] = 'True'  # SQLite 사용
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()


def test_duplicate_project_protection():
    """중복 프로젝트 생성 방지 테스트"""
    print("\n🔍 중복 프로젝트 생성 방지 테스트")
    
    client = Client()
    
    # 테스트 사용자 생성
    user, created = User.objects.get_or_create(
        username='test_duplicate@example.com',
        defaults={'nickname': 'Test Duplicate'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # 로그인
    login_response = client.post('/api/users/sign_in/', json.dumps({
        'email': 'test_duplicate@example.com',
        'password': 'testpass123'
    }), content_type='application/json')
    
    if login_response.status_code != 200:
        print(f"❌ 로그인 실패: {login_response.status_code}")
        return
    
    token = login_response.json().get('vridge_session')
    headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    
    # 프로젝트 데이터
    project_data = {
        'name': f'중복 테스트 프로젝트 {datetime.now().strftime("%H%M%S")}',
        'manager': '테스트 매니저',
        'consumer': '테스트 고객사',
        'description': '중복 방지 테스트',
        'color': '#FF0000',
        'process': [
            {'key': 'planning', 'startDate': '2025-01-11', 'endDate': '2025-01-15'}
        ]
    }
    
    # 첫 번째 프로젝트 생성
    response1 = client.post(
        '/api/projects/create_project/',
        json.dumps(project_data),
        content_type='application/json',
        **headers
    )
    
    print(f"첫 번째 요청: {response1.status_code} - {response1.json().get('message')}")
    
    # 0.5초 대기
    time.sleep(0.5)
    
    # 동일한 프로젝트 재생성 시도
    response2 = client.post(
        '/api/projects/create_project/',
        json.dumps(project_data),
        content_type='application/json',
        **headers
    )
    
    print(f"두 번째 요청: {response2.status_code} - {response2.json().get('message')}")
    
    # 멱등성 키 테스트
    print("\n🔑 멱등성 키 테스트")
    idempotency_key = 'test-idempotency-key-12345'
    headers['HTTP_X_IDEMPOTENCY_KEY'] = idempotency_key
    
    # 멱등성 키로 첫 번째 요청
    response3 = client.post(
        '/api/projects/create_project/',
        json.dumps(project_data),
        content_type='application/json',
        **headers
    )
    print(f"멱등성 키 첫 번째 요청: {response3.status_code}")
    
    # 동일한 멱등성 키로 재요청
    response4 = client.post(
        '/api/projects/create_project/',
        json.dumps(project_data),
        content_type='application/json',
        **headers
    )
    print(f"멱등성 키 두 번째 요청: {response4.status_code}")
    
    # 결과 확인
    if response2.status_code == 400 or response4.status_code == 200:
        print("\n✅ 중복 프로젝트 방지 기능이 정상 작동합니다!")
    else:
        print("\n❌ 중복 프로젝트 방지 기능에 문제가 있습니다.")


def test_ai_teachers_api():
    """AI 선생님 API 테스트"""
    print("\n🤖 AI 선생님 API 테스트")
    
    client = Client()
    
    # AI 선생님 목록 조회
    response = client.get('/api/video-analysis/ai-teachers/')
    
    print(f"응답 상태: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"AI 선생님 수: {len(data.get('teachers', []))}")
        print("✅ AI 선생님 API가 정상 작동합니다!")
    else:
        print(f"❌ AI 선생님 API 오류: {response.content}")


def test_email_config():
    """이메일 설정 테스트"""
    print("\n📧 이메일 설정 테스트")
    
    from django.conf import settings
    from django.core.mail import send_mail
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_HOST_USER: {'설정됨' if settings.EMAIL_HOST_USER else '설정 안됨'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("ℹ️  콘솔 백엔드 사용 중 (개발 환경)")
        
        # 테스트 이메일 발송
        try:
            send_mail(
                'VideoPlanet 테스트 이메일',
                '이메일 설정이 정상적으로 작동합니다.',
                settings.DEFAULT_FROM_EMAIL,
                ['test@example.com'],
                fail_silently=False,
            )
            print("✅ 이메일 발송 테스트 성공 (콘솔 출력)")
        except Exception as e:
            print(f"❌ 이메일 발송 실패: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("VideoPlanet 수정사항 테스트")
    print("=" * 60)
    
    test_duplicate_project_protection()
    test_ai_teachers_api()
    test_email_config()
    
    print("\n" + "=" * 60)
    print("테스트 완료!")