#!/usr/bin/env python3
"""
백엔드 API 오류 테스트 스크립트
Railway 배포된 백엔드 서비스의 모든 엔드포인트를 테스트합니다.
"""
import requests
import json
import time
from datetime import datetime

# API 베이스 URL
BASE_URL = "https://videoplanet.up.railway.app"
LOCAL_URL = "http://localhost:8000"

# 테스트 계정 정보
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

class Colors:
    """터미널 색상 코드"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    """테스트 헤더 출력"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}🧪 {test_name}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")

def print_result(endpoint, status_code, response_time, data=None, error=None):
    """테스트 결과 출력"""
    if status_code == 200 or status_code == 201:
        status_color = Colors.GREEN
        status_icon = "✅"
    elif status_code == 503:
        status_color = Colors.RED
        status_icon = "🚨"
    elif status_code >= 400:
        status_color = Colors.YELLOW
        status_icon = "⚠️"
    else:
        status_color = Colors.BLUE
        status_icon = "ℹ️"
    
    print(f"{status_icon} {endpoint}")
    print(f"   상태: {status_color}{status_code}{Colors.ENDC}")
    print(f"   응답시간: {response_time:.2f}초")
    
    if error:
        print(f"   오류: {Colors.RED}{error}{Colors.ENDC}")
    elif data:
        print(f"   응답: {json.dumps(data, ensure_ascii=False, indent=2)[:200]}...")

def test_endpoint(method, endpoint, headers=None, data=None, base_url=BASE_URL):
    """단일 엔드포인트 테스트"""
    url = f"{base_url}{endpoint}"
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response_time = time.time() - start_time
        
        try:
            response_data = response.json()
        except:
            response_data = {"text": response.text[:200]}
        
        print_result(endpoint, response.status_code, response_time, response_data)
        return response.status_code, response_data
        
    except requests.exceptions.Timeout:
        response_time = time.time() - start_time
        print_result(endpoint, 0, response_time, error="Timeout")
        return 0, {"error": "Timeout"}
    except requests.exceptions.ConnectionError:
        response_time = time.time() - start_time
        print_result(endpoint, 0, response_time, error="Connection Error")
        return 0, {"error": "Connection Error"}
    except Exception as e:
        response_time = time.time() - start_time
        print_result(endpoint, 0, response_time, error=str(e))
        return 0, {"error": str(e)}

def test_health_endpoints():
    """헬스체크 엔드포인트 테스트"""
    print_test_header("헬스체크 API 테스트")
    
    endpoints = [
        ("GET", "/"),
        ("GET", "/api/"),
        ("GET", "/api/health/"),
        ("GET", "/health/"),
        ("GET", "/api/status/"),
    ]
    
    results = {}
    for method, endpoint in endpoints:
        status, data = test_endpoint(method, endpoint)
        results[endpoint] = {"status": status, "data": data}
    
    return results

def test_auth_endpoints():
    """인증 관련 엔드포인트 테스트"""
    print_test_header("인증 API 테스트")
    
    # 회원가입 테스트
    signup_data = {
        "email": f"test_{int(time.time())}@example.com",
        "password": "testpassword123",
        "password2": "testpassword123",
        "username": f"testuser_{int(time.time())}"
    }
    
    endpoints = [
        ("POST", "/api/auth/signup/", None, signup_data),
        ("POST", "/api/auth/login/", None, {"email": TEST_EMAIL, "password": TEST_PASSWORD}),
        ("GET", "/api/auth/user/", {"Authorization": "Bearer dummy_token"}, None),
        ("POST", "/api/auth/logout/", {"Authorization": "Bearer dummy_token"}, None),
        ("POST", "/api/auth/refresh/", None, {"refresh": "dummy_refresh_token"}),
    ]
    
    results = {}
    for method, endpoint, headers, data in endpoints:
        status, response = test_endpoint(method, endpoint, headers, data)
        results[endpoint] = {"status": status, "data": response}
    
    return results

def test_project_endpoints():
    """프로젝트 관련 엔드포인트 테스트"""
    print_test_header("프로젝트 API 테스트")
    
    dummy_token = "Bearer dummy_token"
    headers = {"Authorization": dummy_token}
    
    project_data = {
        "project_name": f"테스트 프로젝트 {int(time.time())}",
        "project_type": "marketing",
        "description": "테스트 프로젝트 설명"
    }
    
    endpoints = [
        ("GET", "/api/projects/", headers, None),
        ("POST", "/api/projects/", headers, project_data),
        ("GET", "/api/projects/1/", headers, None),
        ("PUT", "/api/projects/1/", headers, project_data),
        ("DELETE", "/api/projects/1/", headers, None),
    ]
    
    results = {}
    for method, endpoint, headers, data in endpoints:
        status, response = test_endpoint(method, endpoint, headers, data)
        results[endpoint] = {"status": status, "data": response}
    
    return results

def test_feedback_endpoints():
    """피드백 관련 엔드포인트 테스트"""
    print_test_header("피드백 API 테스트")
    
    dummy_token = "Bearer dummy_token"
    headers = {"Authorization": dummy_token}
    
    feedback_data = {
        "project": 1,
        "content": "테스트 피드백 내용",
        "category": "general"
    }
    
    endpoints = [
        ("GET", "/api/feedbacks/", headers, None),
        ("POST", "/api/feedbacks/", headers, feedback_data),
        ("GET", "/api/feedbacks/1/", headers, None),
        ("PUT", "/api/feedbacks/1/", headers, feedback_data),
        ("DELETE", "/api/feedbacks/1/", headers, None),
    ]
    
    results = {}
    for method, endpoint, headers, data in endpoints:
        status, response = test_endpoint(method, endpoint, headers, data)
        results[endpoint] = {"status": status, "data": response}
    
    return results

def analyze_results(all_results):
    """테스트 결과 분석 및 보고"""
    print_test_header("테스트 결과 분석")
    
    total_tests = 0
    success_count = 0
    error_503_count = 0
    error_4xx_count = 0
    error_other_count = 0
    timeout_count = 0
    
    for category, results in all_results.items():
        for endpoint, result in results.items():
            total_tests += 1
            status = result["status"]
            
            if status == 200 or status == 201:
                success_count += 1
            elif status == 503:
                error_503_count += 1
            elif 400 <= status < 500:
                error_4xx_count += 1
            elif status == 0:
                timeout_count += 1
            else:
                error_other_count += 1
    
    print(f"\n📊 {Colors.BOLD}전체 테스트 결과:{Colors.ENDC}")
    print(f"   총 테스트: {total_tests}개")
    print(f"   {Colors.GREEN}성공: {success_count}개 ({success_count/total_tests*100:.1f}%){Colors.ENDC}")
    print(f"   {Colors.RED}503 오류: {error_503_count}개 ({error_503_count/total_tests*100:.1f}%){Colors.ENDC}")
    print(f"   {Colors.YELLOW}4xx 오류: {error_4xx_count}개 ({error_4xx_count/total_tests*100:.1f}%){Colors.ENDC}")
    print(f"   {Colors.RED}타임아웃: {timeout_count}개 ({timeout_count/total_tests*100:.1f}%){Colors.ENDC}")
    print(f"   기타 오류: {error_other_count}개")
    
    # 주요 문제점 진단
    print(f"\n🔍 {Colors.BOLD}진단 결과:{Colors.ENDC}")
    
    if error_503_count > total_tests * 0.5:
        print(f"   {Colors.RED}⚠️ 심각: 서버가 응급 모드로 작동 중입니다 (503 Service Unavailable){Colors.ENDC}")
        print(f"   원인: Django 앱 시작 실패로 emergency_server.py가 실행됨")
        print(f"   해결: Railway 환경변수 및 마이그레이션 확인 필요")
    elif error_503_count > 0:
        print(f"   {Colors.YELLOW}⚠️ 경고: 일부 엔드포인트에서 503 오류 발생{Colors.ENDC}")
    
    if timeout_count > 0:
        print(f"   {Colors.YELLOW}⚠️ 경고: 네트워크 연결 문제 또는 서버 응답 지연{Colors.ENDC}")
    
    if success_count == total_tests:
        print(f"   {Colors.GREEN}✅ 모든 테스트 통과! 백엔드가 정상 작동 중입니다.{Colors.ENDC}")
    
    # 테스트 보고서 저장
    report = {
        "test_time": datetime.now().isoformat(),
        "base_url": BASE_URL,
        "summary": {
            "total": total_tests,
            "success": success_count,
            "error_503": error_503_count,
            "error_4xx": error_4xx_count,
            "timeout": timeout_count,
            "other_errors": error_other_count
        },
        "details": all_results
    }
    
    with open("backend_test_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 상세 보고서가 backend_test_report.json에 저장되었습니다.")

def main():
    """메인 테스트 실행"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("🚀 VideoPlanet 백엔드 API 오류 테스트")
    print(f"대상 서버: {BASE_URL}")
    print(f"테스트 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{Colors.ENDC}")
    
    all_results = {
        "health": test_health_endpoints(),
        "auth": test_auth_endpoints(),
        "projects": test_project_endpoints(),
        "feedbacks": test_feedback_endpoints()
    }
    
    analyze_results(all_results)
    
    print(f"\n{Colors.BOLD}테스트 완료!{Colors.ENDC}")

if __name__ == "__main__":
    main()