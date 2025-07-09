#!/usr/bin/env python
"""
VideoPlanet 핵심 기능 통합 테스트
v0.1.13 설정 파일 정리 후 모든 기능 검증
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

# 테스트 설정
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
TEST_PASSWORD = "TestPass123!@"
TEST_PROJECT_NAME = f"테스트 프로젝트 {datetime.now().strftime('%Y-%m-%d %H:%M')}"

# 색상 코드
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# 테스트 결과 저장
test_results = []
access_token = None
user_id = None
project_id = None

def print_header(title):
    """테스트 섹션 헤더 출력"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{title:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def test_endpoint(name, method, url, **kwargs):
    """API 엔드포인트 테스트"""
    global access_token
    
    headers = kwargs.get('headers', {})
    if access_token and 'auth' not in kwargs:
        headers['Authorization'] = f'Bearer {access_token}'
    kwargs['headers'] = headers
    
    try:
        response = requests.request(method, url, **kwargs)
        success = response.status_code in [200, 201, 204]
        
        if success:
            print(f"{GREEN}✓{RESET} {name}: {response.status_code}")
            if response.content:
                try:
                    data = response.json()
                    return True, data
                except:
                    return True, response.text
        else:
            print(f"{RED}✗{RESET} {name}: {response.status_code}")
            try:
                print(f"  Error: {response.json()}")
            except:
                print(f"  Error: {response.text}")
            return False, None
            
        test_results.append({
            'name': name,
            'success': success,
            'status_code': response.status_code
        })
        
    except Exception as e:
        print(f"{RED}✗{RESET} {name}: {str(e)}")
        test_results.append({
            'name': name,
            'success': False,
            'error': str(e)
        })
        return False, None

def test_auth_system():
    """사용자 인증 시스템 테스트"""
    global access_token, user_id
    
    print_header("사용자 인증 시스템 테스트")
    
    # 1. 회원가입
    success, data = test_endpoint(
        "회원가입",
        "POST",
        f"{BASE_URL}/api/users/signup/",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "username": "테스트유저",
            "phone": "010-1234-5678"
        }
    )
    
    if success and data:
        user_id = data.get('user', {}).get('id')
    
    # 2. 로그인
    success, data = test_endpoint(
        "로그인",
        "POST",
        f"{BASE_URL}/api/users/login/",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    
    if success and data:
        access_token = data.get('access')
    
    # 3. 사용자 정보 조회
    test_endpoint(
        "사용자 정보 조회",
        "GET",
        f"{BASE_URL}/api/users/me/"
    )
    
    # 4. 토큰 갱신
    if data and data.get('refresh'):
        test_endpoint(
            "토큰 갱신",
            "POST",
            f"{BASE_URL}/api/users/refresh/",
            json={"refresh": data.get('refresh')}
        )

def test_project_management():
    """프로젝트 관리 기능 테스트"""
    global project_id
    
    print_header("프로젝트 관리 기능 테스트")
    
    # 1. 프로젝트 생성
    success, data = test_endpoint(
        "프로젝트 생성",
        "POST",
        f"{BASE_URL}/api/projects/create/",
        json={
            "name": TEST_PROJECT_NAME,
            "description": "테스트 프로젝트 설명",
            "genre": "다큐멘터리",
            "duration": 30
        }
    )
    
    if success and data:
        project_id = data.get('project', {}).get('id')
    
    # 2. 프로젝트 목록 조회
    test_endpoint(
        "프로젝트 목록 조회",
        "GET",
        f"{BASE_URL}/api/projects/"
    )
    
    # 3. 프로젝트 상세 조회
    if project_id:
        test_endpoint(
            "프로젝트 상세 조회",
            "GET",
            f"{BASE_URL}/api/projects/{project_id}/"
        )
        
        # 4. 프로젝트 수정
        test_endpoint(
            "프로젝트 수정",
            "PUT",
            f"{BASE_URL}/api/projects/{project_id}/",
            json={
                "name": TEST_PROJECT_NAME + " (수정됨)",
                "description": "수정된 설명"
            }
        )

def test_feedback_system():
    """피드백 시스템 테스트"""
    print_header("피드백 시스템 테스트")
    
    if not project_id:
        print(f"{YELLOW}⚠ 프로젝트 ID가 없어 피드백 테스트를 건너뜁니다.{RESET}")
        return
    
    # 1. 피드백 생성
    success, data = test_endpoint(
        "피드백 생성",
        "POST",
        f"{BASE_URL}/api/feedbacks/create/",
        json={
            "project": project_id,
            "content": "테스트 피드백 내용",
            "feedback_type": "general"
        }
    )
    
    feedback_id = None
    if success and data:
        feedback_id = data.get('id')
    
    # 2. 피드백 목록 조회
    test_endpoint(
        "피드백 목록 조회",
        "GET",
        f"{BASE_URL}/api/feedbacks/project/{project_id}/"
    )
    
    # 3. 피드백 상세 조회
    if feedback_id:
        test_endpoint(
            "피드백 상세 조회",
            "GET",
            f"{BASE_URL}/api/feedbacks/{feedback_id}/"
        )

def test_video_planning():
    """영상 기획 기능 테스트"""
    print_header("영상 기획 기능 테스트")
    
    # 1. 영상 기획 생성
    success, data = test_endpoint(
        "영상 기획 생성",
        "POST",
        f"{BASE_URL}/api/video-planning/create/",
        json={
            "title": "AI 생성 테스트 기획",
            "genre": "documentary",
            "duration": 10,
            "description": "테스트 설명"
        }
    )
    
    planning_id = None
    if success and data:
        planning_id = data.get('id')
    
    # 2. 영상 기획 목록 조회
    test_endpoint(
        "영상 기획 목록",
        "GET",
        f"{BASE_URL}/api/video-planning/"
    )
    
    # 3. 최근 기획 조회
    test_endpoint(
        "최근 영상 기획 조회",
        "GET",
        f"{BASE_URL}/api/video-planning/recent/"
    )
    
    # 4. 영상 기획 상세 조회
    if planning_id:
        test_endpoint(
            "영상 기획 상세",
            "GET",
            f"{BASE_URL}/api/video-planning/{planning_id}/"
        )

def test_api_endpoints():
    """기타 API 엔드포인트 테스트"""
    print_header("기타 API 엔드포인트 테스트")
    
    # 1. 헬스 체크
    test_endpoint(
        "헬스 체크",
        "GET",
        f"{BASE_URL}/api/health/",
        auth=False
    )
    
    # 2. 온라인 사용자
    test_endpoint(
        "온라인 사용자 목록",
        "GET",
        f"{BASE_URL}/api/onlines/"
    )
    
    # 3. 마이페이지
    test_endpoint(
        "마이페이지 정보",
        "GET",
        f"{BASE_URL}/api/mypage/"
    )

def test_django_admin():
    """Django Admin 접근성 테스트"""
    print_header("Django Admin 테스트")
    
    response = requests.get(f"{BASE_URL}/admin/")
    if response.status_code == 200:
        print(f"{GREEN}✓{RESET} Django Admin 접근 가능")
    else:
        print(f"{RED}✗{RESET} Django Admin 접근 불가: {response.status_code}")

def print_summary():
    """테스트 결과 요약"""
    print_header("테스트 결과 요약")
    
    total = len(test_results)
    success = len([r for r in test_results if r.get('success', False)])
    failed = total - success
    
    print(f"총 테스트: {total}")
    print(f"{GREEN}성공: {success}{RESET}")
    print(f"{RED}실패: {failed}{RESET}")
    
    if failed > 0:
        print(f"\n{RED}실패한 테스트:{RESET}")
        for result in test_results:
            if not result.get('success', False):
                print(f"  - {result['name']}")
    
    success_rate = (success / total * 100) if total > 0 else 0
    print(f"\n성공률: {success_rate:.1f}%")

def main():
    """메인 테스트 실행"""
    print(f"{BLUE}VideoPlanet v0.1.13 핵심 기능 테스트{RESET}")
    print(f"테스트 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Django 서버 실행 확인
    try:
        response = requests.get(f"{BASE_URL}/api/health/")
        if response.status_code != 200:
            print(f"{RED}Django 서버가 실행되지 않았습니다. 먼저 서버를 시작하세요.{RESET}")
            print(f"실행 명령: python3 manage.py runserver")
            return
    except:
        print(f"{RED}Django 서버에 연결할 수 없습니다. 서버를 시작하세요.{RESET}")
        return
    
    # 테스트 실행
    test_auth_system()
    test_project_management()
    test_feedback_system()
    test_video_planning()
    test_api_endpoints()
    test_django_admin()
    
    # 결과 요약
    print_summary()

if __name__ == "__main__":
    main()