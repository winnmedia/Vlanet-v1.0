#!/usr/bin/env python3
"""
VideoPlanet 종합 테스트 스크립트
QA Engineer Q의 무자비한 검증 도구
"""

import os
import json
import time
import sys
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import requests
from urllib.parse import urljoin

# 테스트 환경 설정
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
TEST_RESULTS_DIR = "test_results"

# 색상 코드
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.warnings = []
        self.details = {}
        
    def add_pass(self, test_name: str, details: str = ""):
        self.passed += 1
        self.details[test_name] = {"status": "PASS", "details": details}
        
    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        self.details[test_name] = {"status": "FAIL", "error": error}
        
    def add_warning(self, test_name: str, warning: str):
        self.warnings.append(f"{test_name}: {warning}")
        if test_name not in self.details:
            self.details[test_name] = {"status": "WARNING", "warning": warning}

class VideoPlanetQATester:
    def __init__(self):
        self.results = TestResult()
        self.test_user = None
        self.test_project = None
        self.auth_token = None
        self.session = requests.Session()
        
        # 테스트 결과 디렉토리 생성
        os.makedirs(TEST_RESULTS_DIR, exist_ok=True)
        
    def print_header(self, text: str):
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}")
        print(f"{text:^80}")
        print(f"{'='*80}{Colors.ENDC}\n")
        
    def print_section(self, text: str):
        print(f"\n{Colors.OKBLUE}{Colors.BOLD}[{text}]{Colors.ENDC}")
        
    def print_test(self, test_name: str, status: str, details: str = ""):
        if status == "PASS":
            print(f"  ✓ {Colors.OKGREEN}{test_name}{Colors.ENDC}")
            if details:
                print(f"    {Colors.OKCYAN}{details}{Colors.ENDC}")
        elif status == "FAIL":
            print(f"  ✗ {Colors.FAIL}{test_name}{Colors.ENDC}")
            if details:
                print(f"    {Colors.WARNING}{details}{Colors.ENDC}")
        else:
            print(f"  ⚠ {Colors.WARNING}{test_name}{Colors.ENDC}")
            if details:
                print(f"    {details}")
                
    def check_server_status(self):
        """서버 상태 확인"""
        self.print_section("서버 상태 확인")
        
        # 백엔드 서버 확인
        try:
            response = requests.get(f"{BACKEND_URL}/api/health/", timeout=5)
            if response.status_code == 200:
                self.print_test("백엔드 서버", "PASS", f"Status: {response.status_code}")
                self.results.add_pass("backend_server", f"Health check passed")
            else:
                self.print_test("백엔드 서버", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("backend_server", f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.print_test("백엔드 서버", "FAIL", f"연결 실패: {str(e)}")
            self.results.add_fail("backend_server", f"Connection failed: {str(e)}")
            return False
            
        # 프론트엔드 서버 확인
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                self.print_test("프론트엔드 서버", "PASS", f"Status: {response.status_code}")
                self.results.add_pass("frontend_server", "Server is running")
            else:
                self.print_test("프론트엔드 서버", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("frontend_server", f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.print_test("프론트엔드 서버", "FAIL", f"연결 실패: {str(e)}")
            self.results.add_fail("frontend_server", f"Connection failed: {str(e)}")
            return False
            
        return True
        
    def test_auth_system(self):
        """인증 시스템 테스트"""
        self.print_section("인증 시스템 테스트")
        
        # 회원가입 테스트
        test_email = f"qatest_{int(time.time())}@test.com"
        signup_data = {
            "email": test_email,
            "password": "TestPass123!",
            "nickname": "QA테스터"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/users/signup/",
                json=signup_data
            )
            if response.status_code == 201:
                self.print_test("회원가입", "PASS", f"사용자 생성: {test_email}")
                self.results.add_pass("signup", "User created successfully")
                self.test_user = {"email": test_email, "password": signup_data["password"]}
            else:
                self.print_test("회원가입", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("signup", f"Failed with status {response.status_code}")
                return False
        except Exception as e:
            self.print_test("회원가입", "FAIL", str(e))
            self.results.add_fail("signup", str(e))
            return False
            
        # 로그인 테스트
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/users/login/",
                json={
                    "email": test_email,
                    "password": signup_data["password"]
                }
            )
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.print_test("로그인", "PASS", "인증 토큰 발급 완료")
                self.results.add_pass("login", "Authentication successful")
            else:
                self.print_test("로그인", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("login", f"Failed with status {response.status_code}")
                return False
        except Exception as e:
            self.print_test("로그인", "FAIL", str(e))
            self.results.add_fail("login", str(e))
            return False
            
        return True
        
    def test_video_planning(self):
        """영상기획 페이지 테스트"""
        self.print_section("영상기획 페이지 테스트")
        
        # 스토리 프레임워크 목록 조회
        try:
            response = self.session.get(f"{BACKEND_URL}/api/video-planning/story-frameworks/")
            if response.status_code == 200:
                frameworks = response.json()
                self.print_test("스토리 프레임워크 조회", "PASS", f"{len(frameworks)}개 프레임워크 확인")
                self.results.add_pass("story_frameworks", f"Found {len(frameworks)} frameworks")
            else:
                self.print_test("스토리 프레임워크 조회", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("story_frameworks", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("스토리 프레임워크 조회", "FAIL", str(e))
            self.results.add_fail("story_frameworks", str(e))
            
        # 영상 기획안 생성 테스트
        planning_data = {
            "client_info": "QA 테스트 클라이언트",
            "project_purpose": "종합 테스트를 위한 영상",
            "video_length": "60",
            "target_audience": "QA 엔지니어",
            "key_message": "모든 버그는 반드시 잡힌다",
            "story_framework": "3-act-structure",
            "additional_notes": "자동화 테스트 중"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/video-planning/create/",
                json=planning_data
            )
            if response.status_code in [200, 201]:
                planning = response.json()
                self.print_test("영상 기획안 생성", "PASS", f"ID: {planning.get('id')}")
                self.results.add_pass("create_planning", "Planning created successfully")
                
                # 콘티 생성 여부 확인
                if planning.get("storyboard"):
                    self.print_test("콘티 생성", "PASS", "스토리보드 생성 완료")
                    self.results.add_pass("storyboard_generation", "Storyboard generated")
                else:
                    self.print_test("콘티 생성", "WARNING", "스토리보드 미생성")
                    self.results.add_warning("storyboard_generation", "No storyboard generated")
            else:
                self.print_test("영상 기획안 생성", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("create_planning", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("영상 기획안 생성", "FAIL", str(e))
            self.results.add_fail("create_planning", str(e))
            
        # 최근 기획안 목록 조회
        try:
            response = self.session.get(f"{BACKEND_URL}/api/video-planning/recent/")
            if response.status_code == 200:
                recent_plannings = response.json()
                self.print_test("최근 기획안 조회", "PASS", f"{len(recent_plannings)}개 기획안")
                self.results.add_pass("recent_plannings", f"Found {len(recent_plannings)} plannings")
            else:
                self.print_test("최근 기획안 조회", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("recent_plannings", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("최근 기획안 조회", "FAIL", str(e))
            self.results.add_fail("recent_plannings", str(e))
            
    def test_project_management(self):
        """프로젝트 관리 테스트"""
        self.print_section("프로젝트 관리 테스트")
        
        # 프로젝트 생성
        project_data = {
            "name": "QA 테스트 프로젝트",
            "type": "promotional",
            "budget": "1000000",
            "timeline": "30",
            "description": "종합 테스트를 위한 프로젝트"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/projects/create/",
                json=project_data
            )
            if response.status_code in [200, 201]:
                project = response.json()
                self.test_project = project
                self.print_test("프로젝트 생성", "PASS", f"ID: {project.get('id')}")
                self.results.add_pass("create_project", "Project created successfully")
            else:
                self.print_test("프로젝트 생성", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("create_project", f"Failed with status {response.status_code}")
                return False
        except Exception as e:
            self.print_test("프로젝트 생성", "FAIL", str(e))
            self.results.add_fail("create_project", str(e))
            return False
            
        # 프로젝트 목록 조회
        try:
            response = self.session.get(f"{BACKEND_URL}/api/projects/")
            if response.status_code == 200:
                projects = response.json()
                self.print_test("프로젝트 목록 조회", "PASS", f"{len(projects)}개 프로젝트")
                self.results.add_pass("list_projects", f"Found {len(projects)} projects")
            else:
                self.print_test("프로젝트 목록 조회", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("list_projects", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("프로젝트 목록 조회", "FAIL", str(e))
            self.results.add_fail("list_projects", str(e))
            
        return True
        
    def test_feedback_system(self):
        """영상피드백 시스템 테스트"""
        self.print_section("영상피드백 시스템 테스트")
        
        if not self.test_project:
            self.print_test("피드백 테스트", "SKIP", "프로젝트가 없어 건너뜀")
            return
            
        # 피드백 생성
        feedback_data = {
            "project_id": self.test_project.get("id"),
            "title": "QA 테스트 피드백",
            "video_url": "https://example.com/test-video.mp4",
            "description": "테스트 영상입니다"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/feedbacks/create/",
                json=feedback_data
            )
            if response.status_code in [200, 201]:
                feedback = response.json()
                self.print_test("피드백 생성", "PASS", f"ID: {feedback.get('id')}")
                self.results.add_pass("create_feedback", "Feedback created successfully")
                
                # 피드백 코멘트 추가
                comment_data = {
                    "feedback_id": feedback.get("id"),
                    "content": "테스트 코멘트입니다",
                    "timecode": "00:00:15"
                }
                
                response = self.session.post(
                    f"{BACKEND_URL}/api/feedbacks/comments/",
                    json=comment_data
                )
                if response.status_code in [200, 201]:
                    self.print_test("피드백 코멘트", "PASS", "코멘트 추가 완료")
                    self.results.add_pass("add_comment", "Comment added successfully")
                else:
                    self.print_test("피드백 코멘트", "FAIL", f"Status: {response.status_code}")
                    self.results.add_fail("add_comment", f"Failed with status {response.status_code}")
            else:
                self.print_test("피드백 생성", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("create_feedback", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("피드백 생성", "FAIL", str(e))
            self.results.add_fail("create_feedback", str(e))
            
        # 게스트 피드백 URL 생성
        try:
            response = self.session.post(
                f"{BACKEND_URL}/api/feedbacks/guest-session/",
                json={"project_id": self.test_project.get("id")}
            )
            if response.status_code in [200, 201]:
                guest_data = response.json()
                self.print_test("게스트 피드백 URL", "PASS", "게스트 세션 생성 완료")
                self.results.add_pass("guest_feedback", "Guest session created")
            else:
                self.print_test("게스트 피드백 URL", "FAIL", f"Status: {response.status_code}")
                self.results.add_fail("guest_feedback", f"Failed with status {response.status_code}")
        except Exception as e:
            self.print_test("게스트 피드백 URL", "FAIL", str(e))
            self.results.add_fail("guest_feedback", str(e))
            
    def test_video_upload(self):
        """영상 업로드 테스트 (405 에러 확인)"""
        self.print_section("영상 업로드 테스트")
        
        # 멀티파트 업로드 테스트
        try:
            # 테스트 파일 생성
            test_file_content = b"This is a test video file"
            files = {
                'video': ('test_video.mp4', test_file_content, 'video/mp4')
            }
            data = {
                'title': 'QA 테스트 영상',
                'project_id': self.test_project.get('id') if self.test_project else '1'
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/api/feedbacks/upload/",
                files=files,
                data=data
            )
            
            if response.status_code == 405:
                self.print_test("영상 업로드 (405 에러)", "FAIL", "Method Not Allowed - 엔드포인트 확인 필요")
                self.results.add_fail("video_upload_405", "405 Method Not Allowed error persists")
            elif response.status_code in [200, 201]:
                self.print_test("영상 업로드", "PASS", "업로드 성공")
                self.results.add_pass("video_upload", "Upload successful")
            else:
                self.print_test("영상 업로드", "WARNING", f"Status: {response.status_code}")
                self.results.add_warning("video_upload", f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.print_test("영상 업로드", "FAIL", str(e))
            self.results.add_fail("video_upload", str(e))
            
    def test_ui_components(self):
        """UI 컴포넌트 테스트"""
        self.print_section("UI 컴포넌트 테스트")
        
        # 프론트엔드 페이지 접근성 테스트
        pages_to_test = [
            ("/", "홈페이지"),
            ("/login", "로그인 페이지"),
            ("/signup", "회원가입 페이지"),
            ("/videoplanning", "영상기획 페이지"),
            ("/calendar", "전체 일정 페이지"),
            ("/feedbackall", "영상피드백 페이지")
        ]
        
        for path, name in pages_to_test:
            try:
                response = requests.get(f"{FRONTEND_URL}{path}", timeout=5)
                if response.status_code == 200:
                    self.print_test(f"{name} 접근성", "PASS", "페이지 로드 성공")
                    self.results.add_pass(f"ui_access_{path}", "Page accessible")
                    
                    # 특정 UI 요소 확인
                    if "videoplanning" in path:
                        # 토글 버튼 확인
                        if "toggle" in response.text.lower() or "스위치" in response.text:
                            self.print_test("토글버튼 존재", "PASS", "토글 UI 확인")
                            self.results.add_pass("toggle_button", "Toggle button found")
                        else:
                            self.print_test("토글버튼 존재", "WARNING", "토글 UI 미확인")
                            self.results.add_warning("toggle_button", "Toggle button not found in HTML")
                else:
                    self.print_test(f"{name} 접근성", "FAIL", f"Status: {response.status_code}")
                    self.results.add_fail(f"ui_access_{path}", f"Failed with status {response.status_code}")
            except Exception as e:
                self.print_test(f"{name} 접근성", "FAIL", str(e))
                self.results.add_fail(f"ui_access_{path}", str(e))
                
    def test_performance(self):
        """성능 테스트"""
        self.print_section("성능 테스트")
        
        # API 응답 시간 테스트
        endpoints = [
            ("/api/health/", "헬스체크"),
            ("/api/projects/", "프로젝트 목록"),
            ("/api/video-planning/recent/", "최근 기획안")
        ]
        
        for endpoint, name in endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}{endpoint}", timeout=5)
                response_time = (time.time() - start_time) * 1000  # ms
                
                if response.status_code == 200:
                    if response_time < 200:
                        self.print_test(f"{name} 응답시간", "PASS", f"{response_time:.0f}ms")
                        self.results.add_pass(f"perf_{endpoint}", f"Response time: {response_time:.0f}ms")
                    else:
                        self.print_test(f"{name} 응답시간", "WARNING", f"{response_time:.0f}ms (목표: <200ms)")
                        self.results.add_warning(f"perf_{endpoint}", f"Slow response: {response_time:.0f}ms")
                else:
                    self.print_test(f"{name} 응답시간", "FAIL", f"Status: {response.status_code}")
                    self.results.add_fail(f"perf_{endpoint}", f"Failed with status {response.status_code}")
            except Exception as e:
                self.print_test(f"{name} 응답시간", "FAIL", str(e))
                self.results.add_fail(f"perf_{endpoint}", str(e))
                
    def generate_report(self):
        """최종 보고서 생성"""
        self.print_header("테스트 결과 요약")
        
        total_tests = self.results.passed + self.results.failed
        pass_rate = (self.results.passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"{Colors.BOLD}총 테스트: {total_tests}")
        print(f"{Colors.OKGREEN}통과: {self.results.passed}")
        print(f"{Colors.FAIL}실패: {self.results.failed}")
        print(f"{Colors.WARNING}경고: {len(self.results.warnings)}")
        print(f"\n통과율: {pass_rate:.1f}%{Colors.ENDC}")
        
        if self.results.errors:
            print(f"\n{Colors.FAIL}{Colors.BOLD}주요 오류:{Colors.ENDC}")
            for error in self.results.errors[:10]:  # 상위 10개만 표시
                print(f"  • {error}")
                
        if self.results.warnings:
            print(f"\n{Colors.WARNING}{Colors.BOLD}경고 사항:{Colors.ENDC}")
            for warning in self.results.warnings[:5]:  # 상위 5개만 표시
                print(f"  • {warning}")
                
        # JSON 보고서 저장
        report_data = {
            "test_date": datetime.now().isoformat(),
            "summary": {
                "total": total_tests,
                "passed": self.results.passed,
                "failed": self.results.failed,
                "warnings": len(self.results.warnings),
                "pass_rate": pass_rate
            },
            "details": self.results.details,
            "errors": self.results.errors,
            "warnings": self.results.warnings
        }
        
        report_path = os.path.join(TEST_RESULTS_DIR, f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
            
        print(f"\n상세 보고서 저장: {report_path}")
        
        return pass_rate >= 70  # 70% 이상 통과 시 성공
        
    def run_all_tests(self):
        """모든 테스트 실행"""
        self.print_header("VideoPlanet 종합 테스트 시작")
        print(f"테스트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 서버 상태 확인
        if not self.check_server_status():
            print(f"\n{Colors.FAIL}서버가 실행되고 있지 않습니다. 테스트를 중단합니다.{Colors.ENDC}")
            return False
            
        # 각 테스트 모듈 실행
        self.test_auth_system()
        self.test_video_planning()
        self.test_project_management()
        self.test_feedback_system()
        self.test_video_upload()
        self.test_ui_components()
        self.test_performance()
        
        # 최종 보고서 생성
        success = self.generate_report()
        
        if success:
            print(f"\n{Colors.OKGREEN}{Colors.BOLD}테스트 완료: 시스템이 전반적으로 정상 작동합니다.{Colors.ENDC}")
        else:
            print(f"\n{Colors.FAIL}{Colors.BOLD}테스트 실패: 심각한 문제가 발견되었습니다.{Colors.ENDC}")
            
        return success

if __name__ == "__main__":
    tester = VideoPlanetQATester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)