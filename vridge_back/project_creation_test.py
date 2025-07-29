#!/usr/bin/env python3
"""
VideoPlanet 프로젝트 생성 및 관리 테스트
작성자: Q, The Gatekeeper of Truth
작성일: 2025-01-28
"""

import requests
import json
import time
from datetime import datetime, timedelta
import random
import string

class ProjectTestHarness:
    def __init__(self):
        self.base_url = "https://videoplanet.up.railway.app"
        self.session = requests.Session()
        self.test_results = {
            "project_tests": [],
            "performance": {},
            "security_issues": []
        }
        self.auth_token = None
        self.user_id = None
        self.test_project_id = None
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """테스트 결과 기록"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        result = {
            "timestamp": timestamp,
            "test": test_name,
            "status": status,
            "details": details
        }
        self.test_results["project_tests"].append(result)
        print(f"[{timestamp}] {test_name}: {status} - {details}")
        
    def login_with_demo_account(self) -> bool:
        """데모 계정으로 로그인"""
        test_name = "Demo Account Login"
        
        # 여러 데모 계정 시도
        demo_accounts = [
            {"email": "demo1@videoplanet.com", "password": "demo1234"},
            {"email": "test@example.com", "password": "Test123!"},
            {"email": "admin@videoplanet.com", "password": "admin123"}
        ]
        
        for account in demo_accounts:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/users/login/",
                    json=account
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "token" in data:
                        self.auth_token = data["token"]
                        self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                        self.user_id = data.get("user_id") or data.get("id")
                        self.log_test(test_name, "PASS", f"Logged in with {account['email']}")
                        return True
                        
            except Exception as e:
                continue
                
        self.log_test(test_name, "FAIL", "Could not login with any demo account")
        return False
        
    def test_project_creation_normal(self) -> dict:
        """정상적인 프로젝트 생성 테스트"""
        test_name = "Project Creation - Normal Flow"
        start_time = time.time()
        
        try:
            project_data = {
                "name": f"테스트 프로젝트 {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "자동화 테스트를 위한 프로젝트입니다.",
                "genre": "광고",
                "tone_manner": "모던하고 세련된",
                "concept": "제품 홍보를 위한 짧은 광고 영상",
                "duration": 30,
                "start_date": datetime.now().strftime("%Y-%m-%d"),
                "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            }
            
            response = self.session.post(
                f"{self.base_url}/api/projects/",
                json=project_data
            )
            
            duration = time.time() - start_time
            self.test_results["performance"]["project_creation"] = duration
            
            if response.status_code == 201:
                project = response.json()
                self.test_project_id = project.get("id")
                self.log_test(test_name, "PASS", f"Project created with ID: {self.test_project_id}")
                return project
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return None
            
    def test_project_creation_invalid_data(self):
        """잘못된 데이터로 프로젝트 생성 테스트"""
        test_name = "Project Creation - Invalid Data"
        
        test_cases = [
            {"name": ""},  # 빈 이름
            {"name": "Test", "start_date": "invalid-date"},  # 잘못된 날짜 형식
            {"name": "Test", "end_date": "2020-01-01"},  # 과거 종료일
            {"name": "a" * 256},  # 너무 긴 이름
        ]
        
        all_passed = True
        for i, test_data in enumerate(test_cases):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/projects/",
                    json=test_data
                )
                
                if response.status_code in [400, 422]:
                    self.log_test(f"{test_name} - Case {i+1}", "PASS", "Invalid data properly rejected")
                else:
                    self.log_test(f"{test_name} - Case {i+1}", "FAIL", f"Expected 400/422, got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"{test_name} - Case {i+1}", "ERROR", str(e))
                all_passed = False
                
        return all_passed
        
    def test_project_list_retrieval(self):
        """프로젝트 목록 조회 테스트"""
        test_name = "Project List Retrieval"
        start_time = time.time()
        
        try:
            response = self.session.get(f"{self.base_url}/api/projects/")
            duration = time.time() - start_time
            
            if response.status_code == 200:
                projects = response.json()
                self.log_test(test_name, "PASS", f"Retrieved {len(projects)} projects in {duration:.2f}s")
                
                # 응답 구조 검증
                if projects and isinstance(projects, list):
                    project = projects[0]
                    required_fields = ["id", "name", "created", "updated"]
                    missing_fields = [field for field in required_fields if field not in project]
                    if missing_fields:
                        self.log_test(test_name + " - Structure", "WARNING", 
                                    f"Missing fields: {missing_fields}")
                                    
                return projects
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return None
            
    def test_project_detail_retrieval(self):
        """프로젝트 상세 조회 테스트"""
        test_name = "Project Detail Retrieval"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return None
            
        try:
            response = self.session.get(f"{self.base_url}/api/projects/{self.test_project_id}/")
            
            if response.status_code == 200:
                project = response.json()
                self.log_test(test_name, "PASS", f"Retrieved project details")
                return project
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return None
            
    def test_project_update(self):
        """프로젝트 수정 테스트"""
        test_name = "Project Update"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return False
            
        try:
            update_data = {
                "name": "수정된 프로젝트 이름",
                "description": "수정된 설명입니다."
            }
            
            response = self.session.patch(
                f"{self.base_url}/api/projects/{self.test_project_id}/",
                json=update_data
            )
            
            if response.status_code == 200:
                self.log_test(test_name, "PASS", "Project updated successfully")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return False
            
    def test_project_phase_management(self):
        """프로젝트 단계 관리 테스트"""
        test_name = "Project Phase Management"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return False
            
        phases = [
            {"phase": "planning", "status": "in_progress"},
            {"phase": "planning", "status": "completed"},
            {"phase": "production", "status": "in_progress"}
        ]
        
        all_passed = True
        for phase_data in phases:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/projects/{self.test_project_id}/phase/",
                    json=phase_data
                )
                
                if response.status_code in [200, 201]:
                    self.log_test(f"{test_name} - {phase_data['phase']}", "PASS", 
                                f"Phase updated to {phase_data['status']}")
                else:
                    self.log_test(f"{test_name} - {phase_data['phase']}", "FAIL", 
                                f"Status: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"{test_name} - {phase_data['phase']}", "ERROR", str(e))
                all_passed = False
                
        return all_passed
        
    def test_project_member_invitation(self):
        """프로젝트 멤버 초대 테스트"""
        test_name = "Project Member Invitation"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return False
            
        try:
            invite_data = {
                "email": "newmember@test.com",
                "role": "member"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/projects/{self.test_project_id}/invite/",
                json=invite_data
            )
            
            if response.status_code in [200, 201]:
                self.log_test(test_name, "PASS", "Member invited successfully")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return False
            
    def test_project_file_upload(self):
        """프로젝트 파일 업로드 테스트"""
        test_name = "Project File Upload"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return False
            
        try:
            # 텍스트 파일 생성
            files = {
                'file': ('test_document.txt', b'This is a test document', 'text/plain')
            }
            
            response = self.session.post(
                f"{self.base_url}/api/projects/{self.test_project_id}/files/",
                files=files
            )
            
            if response.status_code in [200, 201]:
                self.log_test(test_name, "PASS", "File uploaded successfully")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return False
            
    def test_project_deletion(self):
        """프로젝트 삭제 테스트"""
        test_name = "Project Deletion"
        
        if not self.test_project_id:
            self.log_test(test_name, "SKIP", "No test project available")
            return False
            
        try:
            response = self.session.delete(
                f"{self.base_url}/api/projects/{self.test_project_id}/"
            )
            
            if response.status_code in [200, 204]:
                self.log_test(test_name, "PASS", "Project deleted successfully")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return False
            
    def test_concurrent_project_creation(self):
        """동시 프로젝트 생성 테스트"""
        test_name = "Concurrent Project Creation"
        
        import concurrent.futures
        
        def create_project():
            try:
                data = {
                    "name": f"Concurrent Project {random.randint(1000, 9999)}",
                    "description": "Concurrent test"
                }
                response = self.session.post(f"{self.base_url}/api/projects/", json=data)
                return response.status_code == 201
            except:
                return False
                
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(create_project) for _ in range(5)]
                results = [f.result() for f in concurrent.futures.as_completed(futures)]
                
            success_rate = sum(results) / len(results)
            if success_rate >= 0.8:
                self.log_test(test_name, "PASS", f"Success rate: {success_rate*100:.1f}%")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Low success rate: {success_rate*100:.1f}%")
                return False
                
        except Exception as e:
            self.log_test(test_name, "ERROR", str(e))
            return False
            
    def run_all_tests(self):
        """모든 프로젝트 관련 테스트 실행"""
        print("\n" + "="*60)
        print("사용자 여정 2: 프로젝트 생성 및 초기 설정 테스트")
        print("="*60 + "\n")
        
        # 로그인
        if not self.login_with_demo_account():
            print("Failed to login. Aborting tests.")
            return
            
        # 정상 시나리오
        print("\n[정상 시나리오 테스트]")
        self.test_project_creation_normal()
        self.test_project_list_retrieval()
        self.test_project_detail_retrieval()
        self.test_project_update()
        self.test_project_phase_management()
        
        # 예외 상황
        print("\n[예외 상황 테스트]")
        self.test_project_creation_invalid_data()
        
        # 엣지 케이스
        print("\n[엣지 케이스 테스트]")
        self.test_concurrent_project_creation()
        
        # 협업 기능
        print("\n[협업 기능 테스트]")
        self.test_project_member_invitation()
        self.test_project_file_upload()
        
        # 정리
        print("\n[정리]")
        self.test_project_deletion()
        
    def generate_report(self):
        """테스트 결과 리포트 생성"""
        report = []
        report.append("\n" + "="*60)
        report.append("프로젝트 테스트 결과 요약")
        report.append("="*60)
        
        passed = sum(1 for test in self.test_results["project_tests"] if test["status"] == "PASS")
        failed = sum(1 for test in self.test_results["project_tests"] if test["status"] == "FAIL")
        errors = sum(1 for test in self.test_results["project_tests"] if test["status"] == "ERROR")
        skipped = sum(1 for test in self.test_results["project_tests"] if test["status"] == "SKIP")
        
        report.append(f"성공: {passed}")
        report.append(f"실패: {failed}")
        report.append(f"오류: {errors}")
        report.append(f"스킵: {skipped}")
        
        if failed > 0:
            report.append("\n실패한 테스트:")
            for test in self.test_results["project_tests"]:
                if test["status"] == "FAIL":
                    report.append(f"  - {test['test']}: {test['details']}")
                    
        return "\n".join(report)


if __name__ == "__main__":
    harness = ProjectTestHarness()
    harness.run_all_tests()
    print(harness.generate_report())