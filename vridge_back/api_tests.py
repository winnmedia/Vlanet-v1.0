#!/usr/bin/env python3
"""
VideoPlanet API 통합 테스트
Q, The Gatekeeper of Truth

백엔드 API의 모든 엔드포인트를 검증합니다.
보안, 성능, 안정성을 종합적으로 테스트합니다.
"""

import requests
import json
import time
import concurrent.futures
from datetime import datetime
from typing import Dict, List, Tuple, Any
import random
import string

# 테스트 환경 설정
BASE_URL = "https://videoplanet.up.railway.app/api"
TEST_CREDENTIALS = {
    "email": "test@example.com",
    "password": "testpassword123"
}

# 테스트 보고서
test_report = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "errors": [],
    "start_time": datetime.now(),
    "end_time": None,
    "performance_issues": [],
    "security_vulnerabilities": []
}


class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
    def authenticate(self) -> bool:
        """테스트용 인증 토큰 획득"""
        try:
            response = self.session.post(
                f"{BASE_URL}/users/login/",
                json=TEST_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token", data.get("token"))
                self.session.headers.update({
                    "Authorization": f"Bearer {self.auth_token}"
                })
                return True
            return False
        except Exception as e:
            print(f"인증 실패: {e}")
            return False
    
    def test_endpoint(self, method: str, endpoint: str, 
                     data: Dict = None, expected_status: int = 200,
                     test_name: str = "") -> Dict:
        """개별 엔드포인트 테스트"""
        test_report["total_tests"] += 1
        
        result = {
            "test_name": test_name or f"{method} {endpoint}",
            "success": False,
            "message": "",
            "response_time": 0,
            "status_code": None,
            "error": None
        }
        
        try:
            start_time = time.time()
            
            if method == "GET":
                response = self.session.get(f"{BASE_URL}{endpoint}")
            elif method == "POST":
                response = self.session.post(f"{BASE_URL}{endpoint}", json=data)
            elif method == "PUT":
                response = self.session.put(f"{BASE_URL}{endpoint}", json=data)
            elif method == "DELETE":
                response = self.session.delete(f"{BASE_URL}{endpoint}")
            elif method == "PATCH":
                response = self.session.patch(f"{BASE_URL}{endpoint}", json=data)
            
            response_time = (time.time() - start_time) * 1000  # ms
            result["response_time"] = response_time
            result["status_code"] = response.status_code
            
            # 성능 문제 감지
            if response_time > 1000:  # 1초 이상
                test_report["performance_issues"].append({
                    "endpoint": endpoint,
                    "response_time": response_time,
                    "severity": "HIGH" if response_time > 3000 else "MEDIUM"
                })
            
            # 상태 코드 검증
            if response.status_code == expected_status:
                result["success"] = True
                result["message"] = f"정상 응답 ({response_time:.0f}ms)"
                test_report["passed"] += 1
            else:
                result["success"] = False
                result["message"] = f"예상: {expected_status}, 실제: {response.status_code}"
                test_report["failed"] += 1
                test_report["errors"].append(result)
            
            # 응답 데이터 검증
            if response.status_code == 200:
                try:
                    data = response.json()
                    if not data:
                        result["message"] += " (빈 응답)"
                except:
                    result["message"] += " (JSON 파싱 실패)"
                    
        except Exception as e:
            result["success"] = False
            result["error"] = str(e)
            result["message"] = f"테스트 실패: {e}"
            test_report["failed"] += 1
            test_report["errors"].append(result)
        
        return result
    
    def test_security_headers(self, endpoint: str) -> Dict:
        """보안 헤더 검증"""
        result = {
            "endpoint": endpoint,
            "vulnerabilities": []
        }
        
        try:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            headers = response.headers
            
            # 필수 보안 헤더 확인
            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": ["DENY", "SAMEORIGIN"],
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": None,  # HTTPS에서만
                "Content-Security-Policy": None
            }
            
            for header, expected_values in security_headers.items():
                if header not in headers:
                    result["vulnerabilities"].append({
                        "header": header,
                        "issue": "누락됨",
                        "severity": "HIGH" if header in ["X-Content-Type-Options", "X-Frame-Options"] else "MEDIUM"
                    })
                elif expected_values:
                    actual_value = headers[header]
                    if isinstance(expected_values, list):
                        if actual_value not in expected_values:
                            result["vulnerabilities"].append({
                                "header": header,
                                "issue": f"잘못된 값: {actual_value}",
                                "severity": "MEDIUM"
                            })
                    elif actual_value != expected_values:
                        result["vulnerabilities"].append({
                            "header": header,
                            "issue": f"잘못된 값: {actual_value}",
                            "severity": "MEDIUM"
                        })
            
            if result["vulnerabilities"]:
                test_report["security_vulnerabilities"].extend(result["vulnerabilities"])
                
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def test_sql_injection(self, endpoint: str, param_name: str) -> Dict:
        """SQL 인젝션 취약점 테스트"""
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM users--",
            "' OR 1=1--",
            "admin'--"
        ]
        
        vulnerabilities = []
        
        for payload in sql_payloads:
            try:
                response = self.session.get(
                    f"{BASE_URL}{endpoint}",
                    params={param_name: payload}
                )
                
                # SQL 에러 메시지 감지
                error_indicators = [
                    "sql", "SQL", "mysql", "sqlite", "postgresql",
                    "ORA-", "syntax error", "database error"
                ]
                
                response_text = response.text.lower()
                for indicator in error_indicators:
                    if indicator.lower() in response_text:
                        vulnerabilities.append({
                            "type": "SQL Injection",
                            "endpoint": endpoint,
                            "payload": payload,
                            "severity": "CRITICAL"
                        })
                        break
                        
            except:
                pass
        
        if vulnerabilities:
            test_report["security_vulnerabilities"].extend(vulnerabilities)
            
        return {
            "endpoint": endpoint,
            "vulnerable": len(vulnerabilities) > 0,
            "payloads_tested": len(sql_payloads)
        }
    
    def test_rate_limiting(self, endpoint: str, requests_count: int = 100) -> Dict:
        """Rate Limiting 테스트"""
        start_time = time.time()
        success_count = 0
        rate_limited = False
        
        for i in range(requests_count):
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                if response.status_code == 429:  # Too Many Requests
                    rate_limited = True
                    break
                elif response.status_code == 200:
                    success_count += 1
            except:
                pass
        
        duration = time.time() - start_time
        
        return {
            "endpoint": endpoint,
            "requests_sent": requests_count,
            "successful_requests": success_count,
            "rate_limited": rate_limited,
            "duration": duration,
            "requests_per_second": success_count / duration if duration > 0 else 0
        }
    
    def test_concurrent_requests(self, endpoint: str, concurrent_users: int = 10) -> Dict:
        """동시 요청 처리 테스트"""
        def make_request():
            start = time.time()
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                return {
                    "success": response.status_code == 200,
                    "response_time": (time.time() - start) * 1000,
                    "status_code": response.status_code
                }
            except Exception as e:
                return {
                    "success": False,
                    "response_time": (time.time() - start) * 1000,
                    "error": str(e)
                }
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(make_request) for _ in range(concurrent_users)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        successful = sum(1 for r in results if r["success"])
        avg_response_time = sum(r["response_time"] for r in results) / len(results)
        
        return {
            "endpoint": endpoint,
            "concurrent_users": concurrent_users,
            "successful_requests": successful,
            "failed_requests": concurrent_users - successful,
            "average_response_time": avg_response_time,
            "max_response_time": max(r["response_time"] for r in results),
            "min_response_time": min(r["response_time"] for r in results)
        }


def run_all_tests():
    """모든 테스트 실행"""
    print("="*50)
    print("VideoPlanet API 통합 테스트")
    print("Q, The Gatekeeper of Truth")
    print("="*50)
    
    tester = APITester()
    
    # 인증 테스트
    print("\n[인증 테스트]")
    if not tester.authenticate():
        print("❌ 인증 실패 - 테스트를 진행할 수 없습니다")
        return test_report
    print("✅ 인증 성공")
    
    # 1. 기능 테스트
    print("\n[기능 테스트]")
    
    # 프로젝트 관련 API
    print("\n프로젝트 API:")
    tester.test_endpoint("GET", "/projects/list/", test_name="프로젝트 목록 조회")
    tester.test_endpoint("POST", "/projects/create/", 
                        data={"name": "테스트 프로젝트", "description": "테스트"},
                        test_name="프로젝트 생성")
    
    # 사용자 관련 API
    print("\n사용자 API:")
    tester.test_endpoint("GET", "/users/profile/", test_name="프로필 조회")
    tester.test_endpoint("PUT", "/users/profile/update/",
                        data={"name": "테스트 사용자"},
                        test_name="프로필 수정")
    
    # 영상 기획 API
    print("\n영상 기획 API:")
    tester.test_endpoint("GET", "/video-planning/recent/", test_name="최근 기획 조회")
    tester.test_endpoint("POST", "/video-planning/generate/",
                        data={"prompt": "테스트 영상 기획"},
                        test_name="기획 생성")
    
    # 피드백 API
    print("\n피드백 API:")
    tester.test_endpoint("GET", "/feedbacks/list/", test_name="피드백 목록 조회")
    
    # 2. 보안 테스트
    print("\n[보안 테스트]")
    
    # 보안 헤더 검사
    print("\n보안 헤더 검사:")
    tester.test_security_headers("/projects/list/")
    
    # SQL 인젝션 테스트
    print("\nSQL 인젝션 테스트:")
    tester.test_sql_injection("/projects/list/", "search")
    
    # XSS 테스트
    print("\nXSS 테스트:")
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')"
    ]
    for payload in xss_payloads:
        tester.test_endpoint("POST", "/projects/create/",
                           data={"name": payload, "description": payload},
                           expected_status=400,
                           test_name=f"XSS 방어 - {payload[:20]}...")
    
    # 3. 성능 테스트
    print("\n[성능 테스트]")
    
    # Rate Limiting 테스트
    print("\nRate Limiting 테스트:")
    rate_limit_result = tester.test_rate_limiting("/projects/list/", 50)
    print(f"Rate Limited: {rate_limit_result['rate_limited']}")
    print(f"요청 속도: {rate_limit_result['requests_per_second']:.1f} req/s")
    
    # 동시 요청 테스트
    print("\n동시 요청 처리 테스트:")
    concurrent_result = tester.test_concurrent_requests("/projects/list/", 20)
    print(f"성공률: {concurrent_result['successful_requests']}/{concurrent_result['concurrent_users']}")
    print(f"평균 응답 시간: {concurrent_result['average_response_time']:.0f}ms")
    
    # 4. 엣지 케이스 테스트
    print("\n[엣지 케이스 테스트]")
    
    # 큰 페이로드 테스트
    print("\n대용량 데이터 처리:")
    large_data = {
        "name": "A" * 10000,
        "description": "B" * 50000
    }
    tester.test_endpoint("POST", "/projects/create/",
                        data=large_data,
                        expected_status=400,
                        test_name="대용량 페이로드 거부")
    
    # 잘못된 데이터 타입
    print("\n데이터 검증:")
    invalid_data = {
        "name": 12345,  # 문자열이어야 함
        "start_date": "invalid-date",
        "budget": "not-a-number"
    }
    tester.test_endpoint("POST", "/projects/create/",
                        data=invalid_data,
                        expected_status=400,
                        test_name="잘못된 데이터 타입 검증")
    
    # 최종 보고서
    test_report["end_time"] = datetime.now()
    duration = (test_report["end_time"] - test_report["start_time"]).total_seconds()
    
    print("\n" + "="*50)
    print("테스트 완료 보고서")
    print("="*50)
    print(f"총 테스트: {test_report['total_tests']}")
    print(f"통과: {test_report['passed']} ({test_report['passed']/test_report['total_tests']*100:.1f}%)")
    print(f"실패: {test_report['failed']} ({test_report['failed']/test_report['total_tests']*100:.1f}%)")
    print(f"실행 시간: {duration:.2f}초")
    
    if test_report["performance_issues"]:
        print(f"\n성능 문제: {len(test_report['performance_issues'])}건")
        for issue in test_report["performance_issues"][:3]:
            print(f"  - {issue['endpoint']}: {issue['response_time']:.0f}ms ({issue['severity']})")
    
    if test_report["security_vulnerabilities"]:
        print(f"\n보안 취약점: {len(test_report['security_vulnerabilities'])}건")
        critical_vulns = [v for v in test_report["security_vulnerabilities"] if v.get("severity") == "CRITICAL"]
        if critical_vulns:
            print(f"  ⚠️  치명적 취약점 {len(critical_vulns)}건 발견!")
    
    print("\n" + "="*50)
    if test_report["failed"] == 0 and not test_report["security_vulnerabilities"]:
        print("✅ Zero-Defect 상태 달성!")
    else:
        print("❌ 결함 발견 - 즉시 수정 필요!")
    print("="*50)
    
    return test_report


if __name__ == "__main__":
    report = run_all_tests()
    
    # 상세 오류 로그 출력
    if report["errors"]:
        print("\n[상세 오류 로그]")
        for error in report["errors"][:5]:
            print(f"\n테스트: {error['test_name']}")
            print(f"메시지: {error['message']}")
            if error.get('error'):
                print(f"오류: {error['error']}")