#!/usr/bin/env python3
import os
import sys
import django
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_minimal')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def test_video_planning_api():
    """Video Planning API 테스트"""
    client = APIClient()
    
    print("=== Video Planning API 테스트 시작 ===\n")
    
    # 1. 인증 없이 API 테스트
    print("1. 인증 없이 API 테스트")
    print("-" * 40)
    
    # Structure 생성 테스트
    response = client.post(
        '/api/video-planning/generate/structure/',
        data={'planning_input': '재미있는 유튜브 쇼츠 영상을 만들고 싶어요'},
        format='json'
    )
    print(f"Structure 생성: {response.status_code}")
    if response.status_code == 200:
        print("✓ Structure 생성 성공 (인증 없이)")
    else:
        print(f"✗ Structure 생성 실패: {response.data}")
    
    # Planning 목록 조회
    response = client.get('/api/video-planning/list/')
    print(f"\nPlanning 목록 조회: {response.status_code}")
    if response.status_code == 200:
        print(f"✓ 목록 조회 성공: {response.data.get('count', 0)}개")
    
    # Planning 저장 테스트
    planning_data = {
        'title': '테스트 기획',
        'planning_text': '재미있는 유튜브 쇼츠 영상',
        'stories': [],
        'scenes': [],
        'shots': [],
        'storyboards': []
    }
    response = client.post(
        '/api/video-planning/save/',
        data=planning_data,
        format='json'
    )
    print(f"\nPlanning 저장 (인증 없이): {response.status_code}")
    if response.status_code == 201:
        print("✓ Planning 저장 성공 (익명 사용자)")
        saved_planning_id = response.data['data']['id']
    else:
        print(f"✗ Planning 저장 실패: {response.data}")
        saved_planning_id = None
    
    # 2. 인증된 사용자로 테스트
    print("\n\n2. 인증된 사용자로 API 테스트")
    print("-" * 40)
    
    # 테스트 사용자 생성 또는 가져오기
    user, created = User.objects.get_or_create(
        username='test_video_planning',
        defaults={
            'email': 'test_video@example.com',
            'password': 'testpass123'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("✓ 테스트 사용자 생성됨")
    else:
        print("✓ 기존 테스트 사용자 사용")
    
    # JWT 토큰 생성
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    print(f"✓ JWT 토큰 생성: {access_token[:20]}...")
    
    # Planning 저장 (인증된 사용자)
    response = client.post(
        '/api/video-planning/save/',
        data=planning_data,
        format='json'
    )
    print(f"\nPlanning 저장 (인증된 사용자): {response.status_code}")
    if response.status_code == 201:
        print("✓ Planning 저장 성공")
        auth_planning_id = response.data['data']['id']
    else:
        print(f"✗ Planning 저장 실패: {response.data}")
        auth_planning_id = None
    
    # Planning 목록 조회 (인증된 사용자)
    response = client.get('/api/video-planning/list/')
    print(f"\nPlanning 목록 조회 (인증된 사용자): {response.status_code}")
    if response.status_code == 200:
        plannings = response.data.get('data', {}).get('plannings', [])
        print(f"✓ 목록 조회 성공: {len(plannings)}개")
        for p in plannings[:3]:  # 최대 3개만 표시
            print(f"  - {p.get('title')} (ID: {p.get('id')})")
    
    # Planning 상세 조회
    if auth_planning_id:
        response = client.get(f'/api/video-planning/detail/{auth_planning_id}/')
        print(f"\nPlanning 상세 조회: {response.status_code}")
        if response.status_code == 200:
            print("✓ 상세 조회 성공")
            print(f"  제목: {response.data['data']['planning']['title']}")
    
    # 3. CORS 헤더 테스트
    print("\n\n3. CORS 헤더 테스트")
    print("-" * 40)
    
    # CORS preflight 테스트
    response = client.options(
        '/api/video-planning/list/',
        HTTP_ORIGIN='https://vlanet.net',
        HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET',
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type,authorization'
    )
    print(f"CORS Preflight: {response.status_code}")
    if 'Access-Control-Allow-Origin' in response:
        print(f"✓ CORS 헤더 존재: {response['Access-Control-Allow-Origin']}")
    else:
        print("✗ CORS 헤더 없음")
    
    print("\n=== 테스트 완료 ===")


if __name__ == '__main__':
    test_video_planning_api()