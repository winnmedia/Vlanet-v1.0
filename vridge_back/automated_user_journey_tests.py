#!/usr/bin/env python3
"""
VideoPlanet 사용자 여정 기반 자동화 테스트
작성자: Q, The Gatekeeper of Truth
작성일: 2025-01-28
"""

import requests
import json
import time
import random
import string
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import concurrent.futures
import re

class VideoplanetTestHarness:
    """VideoPlanet 서비스 전체 기능 검증을 위한 테스트 하네스"""
    
    def __init__(self):
        self.base_url = "https://videoplanet.up.railway.app"
        self.frontend_url = "https://vlanet.net"
        self.session = requests.Session()
        self.test_results = {
            "passed": [],
            "failed": [],
            "errors": [],
            "warnings": [],
            "performance": {},
            "security_issues": []
        }
        self.test_user = None
        self.test_project = None
        
    def log_result(self, test_name: str, status: str, details: str = "", severity: str = "info"):
        """테스트 결과 기록"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        result = {
            "timestamp": timestamp,
            "test": test_name,
            "status": status,
            "details": details,
            "severity": severity
        }
        
        if status == "PASS":
            self.test_results["passed"].append(result)
        elif status == "FAIL":
            self.test_results["failed"].append(result)
        elif status == "ERROR":
            self.test_results["errors"].append(result)
        elif status == "WARNING":
            self.test_results["warnings"].append(result)
            
        print(f"[{timestamp}] {test_name}: {status} - {details}")
        
    def measure_performance(self, operation: str, start_time: float):
        """성능 측정"""
        duration = time.time() - start_time
        if operation not in self.test_results["performance"]:
            self.test_results["performance"][operation] = []
        self.test_results["performance"][operation].append(duration)
        return duration
        
    def generate_random_string(self, length: int = 10) -> str:
        """랜덤 문자열 생성"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
        
    def generate_test_email(self) -> str:
        """테스트용 이메일 생성"""
        return f"test_{self.generate_random_string()}@videoplanet.test"
        
    def check_api_health(self) -> bool:
        """API 헬스 체크"""
        try:
            response = self.session.get(f"{self.base_url}/api/health/")
            if response.status_code == 200:
                self.log_result("API Health Check", "PASS", "API is healthy")
                return True
            else:
                self.log_result("API Health Check", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", "ERROR", str(e))
            return False
            
    # ========== 사용자 여정 1: 신규 사용자 온보딩 ==========
    
    def test_user_signup_normal(self) -> Dict:
        """정상적인 회원가입 테스트"""
        test_name = "User Signup - Normal Flow"
        start_time = time.time()
        
        try:
            # 테스트 데이터 생성
            test_data = {
                "email": self.generate_test_email(),
                "password": "TestPassword123!",
                "nickname": f"TestUser{self.generate_random_string(5)}"
            }
            
            # 회원가입 요청
            response = self.session.post(
                f"{self.base_url}/api/users/signup/",
                json=test_data
            )
            
            duration = self.measure_performance("signup", start_time)
            
            if response.status_code == 201:
                self.test_user = test_data
                self.log_result(test_name, "PASS", f"Signup successful in {duration:.2f}s")
                
                # 응답 데이터 검증
                response_data = response.json()
                if "token" in response_data:
                    self.session.headers.update({"Authorization": f"Bearer {response_data['token']}"})
                    
                return response_data
            else:
                self.log_result(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return None
            
    def test_user_signup_duplicate(self) -> bool:
        """중복 이메일 회원가입 테스트"""
        test_name = "User Signup - Duplicate Email"
        
        if not self.test_user:
            self.log_result(test_name, "SKIP", "No test user available")
            return False
            
        try:
            response = self.session.post(
                f"{self.base_url}/api/users/signup/",
                json=self.test_user
            )
            
            if response.status_code == 400:
                self.log_result(test_name, "PASS", "Duplicate email properly rejected")
                return True
            else:
                self.log_result(test_name, "FAIL", f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return False
            
    def test_user_signup_invalid_data(self) -> bool:
        """잘못된 데이터로 회원가입 테스트"""
        test_name = "User Signup - Invalid Data"
        test_cases = [
            {"email": "invalid-email", "password": "Test123!", "nickname": "Test"},
            {"email": self.generate_test_email(), "password": "123", "nickname": "Test"},
            {"email": self.generate_test_email(), "password": "Test123!", "nickname": ""},
            {"email": "", "password": "Test123!", "nickname": "Test"},
        ]
        
        all_passed = True
        for i, test_data in enumerate(test_cases):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/users/signup/",
                    json=test_data
                )
                
                if response.status_code in [400, 422]:
                    self.log_result(f"{test_name} - Case {i+1}", "PASS", "Invalid data properly rejected")
                else:
                    self.log_result(f"{test_name} - Case {i+1}", "FAIL", f"Expected 400/422, got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_result(f"{test_name} - Case {i+1}", "ERROR", str(e))
                all_passed = False
                
        return all_passed
        
    def test_user_login_normal(self) -> Dict:
        """정상적인 로그인 테스트"""
        test_name = "User Login - Normal Flow"
        start_time = time.time()
        
        if not self.test_user:
            self.log_result(test_name, "SKIP", "No test user available")
            return None
            
        try:
            response = self.session.post(
                f"{self.base_url}/api/users/login/",
                json={
                    "email": self.test_user["email"],
                    "password": self.test_user["password"]
                }
            )
            
            duration = self.measure_performance("login", start_time)
            
            if response.status_code == 200:
                self.log_result(test_name, "PASS", f"Login successful in {duration:.2f}s")
                response_data = response.json()
                
                # 토큰 검증
                if "token" in response_data:
                    self.session.headers.update({"Authorization": f"Bearer {response_data['token']}"})
                else:
                    self.log_result(test_name, "WARNING", "No token in login response")
                    
                return response_data
            else:
                self.log_result(test_name, "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return None
            
    def test_user_login_invalid(self) -> bool:
        """잘못된 인증정보로 로그인 테스트"""
        test_name = "User Login - Invalid Credentials"
        
        test_cases = [
            {"email": "nonexistent@test.com", "password": "wrongpass"},
            {"email": self.test_user["email"] if self.test_user else "test@test.com", "password": "wrongpass"},
            {"email": "", "password": ""},
        ]
        
        all_passed = True
        for i, test_data in enumerate(test_cases):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/users/login/",
                    json=test_data
                )
                
                if response.status_code in [400, 401, 422]:
                    self.log_result(f"{test_name} - Case {i+1}", "PASS", "Invalid credentials properly rejected")
                else:
                    self.log_result(f"{test_name} - Case {i+1}", "FAIL", f"Expected 400/401/422, got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_result(f"{test_name} - Case {i+1}", "ERROR", str(e))
                all_passed = False
                
        return all_passed
        
    def test_sql_injection_attempts(self) -> bool:
        """SQL Injection 시도 테스트"""
        test_name = "Security - SQL Injection"
        
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "admin'--",
            "' UNION SELECT * FROM users--",
            "1' AND '1'='1"
        ]
        
        all_safe = True
        for payload in sql_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/users/login/",
                    json={
                        "email": payload,
                        "password": payload
                    }
                )
                
                # SQL Injection이 성공하면 200이나 예상치 못한 응답이 올 수 있음
                if response.status_code in [400, 401, 422]:
                    self.log_result(f"{test_name} - {payload[:20]}...", "PASS", "SQL Injection blocked")
                else:
                    self.log_result(f"{test_name} - {payload[:20]}...", "FAIL", "Potential SQL Injection vulnerability", "critical")
                    self.test_results["security_issues"].append({
                        "type": "SQL Injection",
                        "endpoint": "/api/auth/login/",
                        "payload": payload,
                        "response": response.status_code
                    })
                    all_safe = False
                    
            except Exception as e:
                self.log_result(f"{test_name} - {payload[:20]}...", "ERROR", str(e))
                
        return all_safe
        
    def test_xss_attempts(self) -> bool:
        """XSS 시도 테스트"""
        test_name = "Security - XSS"
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<iframe src='javascript:alert(`XSS`)'>",
            "'><script>alert(String.fromCharCode(88,83,83))</script>"
        ]
        
        all_safe = True
        for payload in xss_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/users/signup/",
                    json={
                        "email": self.generate_test_email(),
                        "password": "Test123!",
                        "nickname": payload[:50]  # nickname has max length of 50
                    }
                )
                
                # 응답에서 스크립트가 그대로 반환되는지 확인
                if response.text and payload in response.text:
                    self.log_result(f"{test_name} - {payload[:20]}...", "FAIL", "Potential XSS vulnerability", "critical")
                    self.test_results["security_issues"].append({
                        "type": "XSS",
                        "endpoint": "/api/auth/signup/",
                        "payload": payload
                    })
                    all_safe = False
                else:
                    self.log_result(f"{test_name} - {payload[:20]}...", "PASS", "XSS payload sanitized")
                    
            except Exception as e:
                self.log_result(f"{test_name} - {payload[:20]}...", "ERROR", str(e))
                
        return all_safe
        
    def test_concurrent_signups(self) -> bool:
        """동시 다중 회원가입 테스트"""
        test_name = "User Signup - Concurrent Requests"
        
        def signup_request():
            try:
                data = {
                    "email": self.generate_test_email(),
                    "password": "TestPassword123!",
                    "nickname": f"Concurrent{self.generate_random_string(5)}"
                }
                response = requests.post(f"{self.base_url}/api/users/signup/", json=data)
                return response.status_code == 201
            except:
                return False
                
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(signup_request) for _ in range(10)]
                results = [f.result() for f in concurrent.futures.as_completed(futures)]
                
            success_rate = sum(results) / len(results)
            if success_rate >= 0.8:
                self.log_result(test_name, "PASS", f"Success rate: {success_rate*100:.1f}%")
                return True
            else:
                self.log_result(test_name, "FAIL", f"Low success rate: {success_rate*100:.1f}%")
                return False
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return False
            
    def test_password_reset_flow(self) -> bool:
        """비밀번호 재설정 플로우 테스트"""
        test_name = "Password Reset Flow"
        
        if not self.test_user:
            self.log_result(test_name, "SKIP", "No test user available")
            return False
            
        try:
            # 비밀번호 재설정 요청
            response = self.session.post(
                f"{self.base_url}/api/users/password-reset/",
                json={"email": self.test_user["email"]}
            )
            
            if response.status_code in [200, 201]:
                self.log_result(test_name, "PASS", "Password reset email sent")
                return True
            else:
                self.log_result(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return False
            
    def run_user_onboarding_tests(self):
        """사용자 온보딩 전체 테스트 실행"""
        print("\n" + "="*60)
        print("사용자 여정 1: 신규 사용자 온보딩 테스트")
        print("="*60 + "\n")
        
        # API 헬스 체크
        if not self.check_api_health():
            print("API is not healthy. Aborting tests.")
            return
            
        # 정상 시나리오
        print("\n[정상 시나리오 테스트]")
        self.test_user_signup_normal()
        self.test_user_login_normal()
        
        # 예외 상황
        print("\n[예외 상황 테스트]")
        self.test_user_signup_duplicate()
        self.test_user_signup_invalid_data()
        self.test_user_login_invalid()
        self.test_password_reset_flow()
        
        # 엣지 케이스
        print("\n[엣지 케이스 테스트]")
        self.test_concurrent_signups()
        
        # 보안 테스트
        print("\n[보안 취약점 테스트]")
        self.test_sql_injection_attempts()
        self.test_xss_attempts()
    
    # ========== 사용자 여정 2: 마이페이지 기능 ==========
    
    def test_mypage_info_retrieval(self) -> Dict:
        """마이페이지 종합 정보 조회 테스트"""
        test_name = "MyPage - Info Retrieval"
        start_time = time.time()
        
        try:
            response = self.session.get(f"{self.base_url}/api/users/mypage/")
            duration = self.measure_performance("mypage_info", start_time)
            
            if response.status_code == 200:
                data = response.json()
                
                # 필수 필드 검증
                required_fields = ["user", "profile", "project_stats", "recent_activities"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result(test_name, "FAIL", f"Missing fields: {missing_fields}")
                    return None
                
                # 응답 시간 체크
                if duration > 0.5:
                    self.log_result(test_name, "WARNING", f"Slow response: {duration:.2f}s")
                else:
                    self.log_result(test_name, "PASS", f"Retrieved in {duration:.2f}s")
                
                return data
            else:
                self.log_result(test_name, "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return None
    
    def test_activity_history(self) -> bool:
        """활동 내역 조회 및 필터링 테스트"""
        test_name = "MyPage - Activity History"
        
        test_cases = [
            {"params": {}, "name": "전체 조회"},
            {"params": {"period": "week"}, "name": "주간 조회"},
            {"params": {"period": "month"}, "name": "월간 조회"},
            {"params": {"period": "year"}, "name": "연간 조회"},
            {"params": {"start_date": "2025-01-01", "end_date": "2025-01-31"}, "name": "기간 지정"}
        ]
        
        all_passed = True
        for test_case in test_cases:
            try:
                start_time = time.time()
                response = self.session.get(
                    f"{self.base_url}/api/users/activity/",
                    params=test_case["params"]
                )
                duration = self.measure_performance(f"activity_{test_case['name']}", start_time)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 페이지네이션 확인
                    if "results" not in data:
                        self.log_result(f"{test_name} - {test_case['name']}", "FAIL", "No pagination structure")
                        all_passed = False
                        continue
                    
                    # 필터링 검증
                    if test_case["params"].get("period") or test_case["params"].get("start_date"):
                        if len(data["results"]) == 0:
                            self.log_result(f"{test_name} - {test_case['name']}", "WARNING", "No activities found")
                    
                    self.log_result(f"{test_name} - {test_case['name']}", "PASS", f"Retrieved {len(data['results'])} activities")
                else:
                    self.log_result(f"{test_name} - {test_case['name']}", "FAIL", f"Status: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_result(f"{test_name} - {test_case['name']}", "ERROR", str(e))
                all_passed = False
        
        return all_passed
    
    def test_user_preferences(self) -> bool:
        """사용자 설정 조회 및 업데이트 테스트"""
        test_name = "MyPage - User Preferences"
        
        try:
            # 현재 설정 조회
            response = self.session.get(f"{self.base_url}/api/users/preferences/")
            
            if response.status_code != 200:
                self.log_result(f"{test_name} - Get", "FAIL", f"Status: {response.status_code}")
                return False
            
            current_prefs = response.json()
            self.log_result(f"{test_name} - Get", "PASS", "Retrieved current preferences")
            
            # 설정 업데이트 테스트
            test_updates = [
                {"email_notifications": True, "push_notifications": False},
                {"language": "ko", "timezone": "Asia/Seoul"},
                {"theme": "dark", "auto_play": False}
            ]
            
            for update_data in test_updates:
                response = self.session.patch(
                    f"{self.base_url}/api/users/preferences/",
                    json=update_data
                )
                
                if response.status_code == 200:
                    updated_data = response.json()
                    
                    # 업데이트 검증
                    for key, value in update_data.items():
                        if updated_data.get(key) != value:
                            self.log_result(f"{test_name} - Update {key}", "FAIL", "Update not applied")
                            return False
                    
                    self.log_result(f"{test_name} - Update", "PASS", f"Updated: {list(update_data.keys())}")
                else:
                    self.log_result(f"{test_name} - Update", "FAIL", f"Status: {response.status_code}")
                    return False
            
            return True
            
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return False
    
    def test_profile_image_upload(self) -> bool:
        """프로필 이미지 업로드 테스트"""
        test_name = "MyPage - Profile Image Upload"
        
        try:
            # 더미 이미지 생성 (1x1 픽셀 PNG)
            import base64
            import io
            from PIL import Image
            
            # 작은 테스트 이미지 생성
            img = Image.new('RGB', (100, 100), color='red')
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            files = {'profile_image': ('test.png', img_buffer, 'image/png')}
            
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/users/profile-image/",
                files=files
            )
            duration = self.measure_performance("profile_image_upload", start_time)
            
            if response.status_code == 200:
                data = response.json()
                
                # 이미지 URL 확인
                if "image_url" not in data:
                    self.log_result(test_name, "FAIL", "No image URL in response")
                    return False
                
                # 업로드 시간 체크
                if duration > 2.0:
                    self.log_result(test_name, "WARNING", f"Slow upload: {duration:.2f}s")
                
                self.log_result(test_name, "PASS", f"Image uploaded in {duration:.2f}s")
                
                # 큰 이미지 테스트 (5MB)
                large_img = Image.new('RGB', (2000, 2000), color='blue')
                large_buffer = io.BytesIO()
                large_img.save(large_buffer, format='PNG')
                
                if large_buffer.tell() > 5 * 1024 * 1024:  # 5MB 제한
                    files = {'profile_image': ('large.png', large_buffer, 'image/png')}
                    response = self.session.post(
                        f"{self.base_url}/api/users/profile-image/",
                        files=files
                    )
                    
                    if response.status_code == 413:
                        self.log_result(f"{test_name} - Large File", "PASS", "Large file properly rejected")
                    else:
                        self.log_result(f"{test_name} - Large File", "FAIL", "Large file not rejected")
                
                return True
            else:
                self.log_result(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except ImportError:
            self.log_result(test_name, "SKIP", "PIL not available for image generation")
            return True
        except Exception as e:
            self.log_result(test_name, "ERROR", str(e))
            return False
    
    def test_personal_info_update(self) -> bool:
        """개인정보 수정 테스트"""
        test_name = "MyPage - Personal Info Update"
        
        test_updates = [
            {
                "nickname": f"Updated{self.generate_random_string(5)}",
                "description": "테스트 설명입니다."
            },
            {
                "phone": "010-1234-5678",
                "birth_date": "1990-01-01"
            },
            {
                "nickname": "<script>alert('XSS')</script>",  # XSS 테스트
                "description": "'; DROP TABLE users; --"  # SQL Injection 테스트
            }
        ]
        
        all_passed = True
        for i, update_data in enumerate(test_updates):
            try:
                response = self.session.patch(
                    f"{self.base_url}/api/users/profile/",
                    json=update_data
                )
                
                if i < 2:  # 정상 케이스
                    if response.status_code == 200:
                        updated = response.json()
                        
                        # XSS 체크
                        if "<script>" in str(updated):
                            self.log_result(f"{test_name} - Case {i+1}", "FAIL", "XSS vulnerability detected", "critical")
                            self.test_results["security_issues"].append({
                                "type": "XSS",
                                "endpoint": "/api/users/profile/",
                                "details": "Script tags in response"
                            })
                            all_passed = False
                        else:
                            self.log_result(f"{test_name} - Case {i+1}", "PASS", "Info updated successfully")
                    else:
                        self.log_result(f"{test_name} - Case {i+1}", "FAIL", f"Status: {response.status_code}")
                        all_passed = False
                else:  # 보안 테스트 케이스
                    if response.status_code in [200, 201]:
                        # 성공하면 안됨
                        response_text = response.text
                        if "<script>" in response_text or "DROP TABLE" in response_text:
                            self.log_result(f"{test_name} - Security Case", "FAIL", "Security payload not sanitized", "critical")
                            all_passed = False
                    else:
                        self.log_result(f"{test_name} - Security Case", "PASS", "Malicious input rejected")
                        
            except Exception as e:
                self.log_result(f"{test_name} - Case {i+1}", "ERROR", str(e))
                all_passed = False
        
        return all_passed
    
    def test_mypage_edge_cases(self) -> bool:
        """마이페이지 엣지 케이스 테스트"""
        test_name = "MyPage - Edge Cases"
        
        # 인증 없이 접근 시도
        old_auth = self.session.headers.get("Authorization")
        self.session.headers.pop("Authorization", None)
        
        try:
            response = self.session.get(f"{self.base_url}/api/users/mypage/")
            if response.status_code == 401:
                self.log_result(f"{test_name} - Unauthorized Access", "PASS", "Properly requires authentication")
            else:
                self.log_result(f"{test_name} - Unauthorized Access", "FAIL", f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_result(f"{test_name} - Unauthorized Access", "ERROR", str(e))
        
        # 인증 복원
        if old_auth:
            self.session.headers["Authorization"] = old_auth
        
        # 동시 다중 요청 테스트
        def concurrent_request():
            try:
                response = self.session.get(f"{self.base_url}/api/users/mypage/")
                return response.status_code == 200
            except:
                return False
        
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
                futures = [executor.submit(concurrent_request) for _ in range(20)]
                results = [f.result() for f in concurrent.futures.as_completed(futures)]
            
            success_rate = sum(results) / len(results)
            if success_rate >= 0.95:
                self.log_result(f"{test_name} - Concurrent Requests", "PASS", f"Success rate: {success_rate*100:.1f}%")
            else:
                self.log_result(f"{test_name} - Concurrent Requests", "FAIL", f"Low success rate: {success_rate*100:.1f}%")
                
        except Exception as e:
            self.log_result(f"{test_name} - Concurrent Requests", "ERROR", str(e))
        
        return True
    
    def run_mypage_tests(self):
        """마이페이지 전체 테스트 실행"""
        print("\n" + "="*60)
        print("사용자 여정 2: 마이페이지 기능 테스트")
        print("="*60 + "\n")
        
        # 로그인 상태 확인
        if "Authorization" not in self.session.headers:
            print("인증이 필요합니다. 로그인 먼저 수행하세요.")
            return
        
        # 정상 시나리오
        print("\n[정상 시나리오 테스트]")
        self.test_mypage_info_retrieval()
        self.test_activity_history()
        self.test_user_preferences()
        
        # 파일 업로드
        print("\n[파일 업로드 테스트]")
        self.test_profile_image_upload()
        
        # 정보 수정
        print("\n[정보 수정 테스트]")
        self.test_personal_info_update()
        
        # 엣지 케이스
        print("\n[엣지 케이스 테스트]")
        self.test_mypage_edge_cases()
        
    def generate_report(self) -> str:
        """테스트 결과 리포트 생성"""
        report = []
        report.append("\n" + "="*60)
        report.append("테스트 결과 요약")
        report.append("="*60)
        report.append(f"성공: {len(self.test_results['passed'])}")
        report.append(f"실패: {len(self.test_results['failed'])}")
        report.append(f"오류: {len(self.test_results['errors'])}")
        report.append(f"경고: {len(self.test_results['warnings'])}")
        report.append(f"보안 이슈: {len(self.test_results['security_issues'])}")
        
        if self.test_results['failed']:
            report.append("\n실패한 테스트:")
            for fail in self.test_results['failed']:
                report.append(f"  - {fail['test']}: {fail['details']}")
                
        if self.test_results['security_issues']:
            report.append("\n발견된 보안 취약점:")
            for issue in self.test_results['security_issues']:
                report.append(f"  - {issue['type']} at {issue['endpoint']}")
                
        if self.test_results['performance']:
            report.append("\n성능 측정 결과:")
            for op, times in self.test_results['performance'].items():
                avg_time = sum(times) / len(times)
                report.append(f"  - {op}: 평균 {avg_time:.3f}초")
                
        return "\n".join(report)


if __name__ == "__main__":
    harness = VideoplanetTestHarness()
    
    # 사용자 온보딩 테스트
    harness.run_user_onboarding_tests()
    
    # 마이페이지 테스트 (로그인 후 실행)
    if harness.test_user:
        harness.run_mypage_tests()
    
    # 최종 리포트 생성
    print(harness.generate_report())