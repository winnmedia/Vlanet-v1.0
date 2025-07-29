#!/usr/bin/env python3
"""
VideoPlanet 프론트엔드 사용자 여정 테스트
작성자: Q, The Gatekeeper of Truth
작성일: 2025-01-28
"""

import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import random
import string

class FrontendTestHarness:
    def __init__(self):
        self.frontend_url = "https://vlanet.net"
        self.test_results = {
            "ui_issues": [],
            "accessibility_issues": [],
            "performance_metrics": {},
            "screenshots": []
        }
        
    def log_issue(self, category: str, severity: str, issue: str, element: str = None):
        """이슈 기록"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "category": category,
            "severity": severity,
            "issue": issue,
            "element": element
        }
        
        if category == "ui":
            self.test_results["ui_issues"].append(log_entry)
        elif category == "accessibility":
            self.test_results["accessibility_issues"].append(log_entry)
            
        print(f"[{timestamp}] [{severity.upper()}] {category}: {issue}")
        
    def generate_random_string(self, length: int = 10) -> str:
        """랜덤 문자열 생성"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
        
    def test_signup_page_ui(self):
        """회원가입 페이지 UI/UX 테스트"""
        print("\n=== 회원가입 페이지 UI/UX 테스트 ===")
        
        # Headless Chrome 설정
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            # 페이지 로딩 시간 측정
            start_time = time.time()
            driver.get(f"{self.frontend_url}/signup")
            load_time = time.time() - start_time
            
            self.test_results["performance_metrics"]["signup_page_load"] = load_time
            print(f"페이지 로딩 시간: {load_time:.2f}초")
            
            # 기본 UI 요소 확인
            wait = WebDriverWait(driver, 10)
            
            # 이메일 입력 필드
            try:
                email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
                if not email_input.get_attribute("type") == "email":
                    self.log_issue("ui", "minor", "이메일 필드 type이 'email'이 아님", "email input")
            except TimeoutException:
                self.log_issue("ui", "critical", "이메일 입력 필드를 찾을 수 없음")
                
            # 비밀번호 입력 필드
            try:
                password_input = driver.find_element(By.NAME, "password")
                if not password_input.get_attribute("type") == "password":
                    self.log_issue("ui", "major", "비밀번호 필드가 마스킹되지 않음", "password input")
            except NoSuchElementException:
                self.log_issue("ui", "critical", "비밀번호 입력 필드를 찾을 수 없음")
                
            # 닉네임 입력 필드
            try:
                nickname_input = driver.find_element(By.NAME, "nickname")
            except NoSuchElementException:
                self.log_issue("ui", "critical", "닉네임 입력 필드를 찾을 수 없음")
                
            # 회원가입 버튼
            try:
                signup_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                button_text = signup_button.text
                if not button_text:
                    self.log_issue("ui", "minor", "회원가입 버튼에 텍스트가 없음", "submit button")
            except NoSuchElementException:
                self.log_issue("ui", "critical", "회원가입 버튼을 찾을 수 없음")
                
            # 접근성 테스트
            # 1. 라벨 확인
            inputs = driver.find_elements(By.TAG_NAME, "input")
            for input_elem in inputs:
                input_id = input_elem.get_attribute("id")
                if input_id:
                    try:
                        label = driver.find_element(By.CSS_SELECTOR, f"label[for='{input_id}']")
                    except NoSuchElementException:
                        self.log_issue("accessibility", "major", 
                                     f"입력 필드에 라벨이 없음", f"input#{input_id}")
                                     
            # 2. ARIA 속성 확인
            form = driver.find_element(By.TAG_NAME, "form")
            if not form.get_attribute("role"):
                self.log_issue("accessibility", "minor", "form 요소에 role 속성이 없음")
                
            # 3. 키보드 네비게이션 테스트
            try:
                # Tab 키로 이동 가능한지 확인
                active_element = driver.switch_to.active_element
                active_element.send_keys(Keys.TAB)
                time.sleep(0.5)
                
                new_active = driver.switch_to.active_element
                if active_element == new_active:
                    self.log_issue("accessibility", "major", "Tab 키 네비게이션이 작동하지 않음")
            except Exception as e:
                self.log_issue("accessibility", "warning", f"키보드 네비게이션 테스트 실패: {str(e)}")
                
            # 반응형 디자인 테스트
            viewports = [
                {"width": 375, "height": 667, "device": "iPhone SE"},
                {"width": 768, "height": 1024, "device": "iPad"},
                {"width": 1920, "height": 1080, "device": "Desktop"}
            ]
            
            for viewport in viewports:
                driver.set_window_size(viewport["width"], viewport["height"])
                time.sleep(0.5)
                
                # 스크린샷 저장
                screenshot_name = f"signup_{viewport['device']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                driver.save_screenshot(screenshot_name)
                self.test_results["screenshots"].append(screenshot_name)
                
                # 모든 요소가 뷰포트 내에 있는지 확인
                elements = driver.find_elements(By.CSS_SELECTOR, "input, button")
                for elem in elements:
                    location = elem.location
                    size = elem.size
                    if location['x'] + size['width'] > viewport['width']:
                        self.log_issue("ui", "major", 
                                     f"{viewport['device']}에서 요소가 화면을 벗어남",
                                     elem.get_attribute('name') or elem.tag_name)
                                     
        except Exception as e:
            print(f"테스트 중 오류 발생: {str(e)}")
            
        finally:
            driver.quit()
            
    def test_login_page_ui(self):
        """로그인 페이지 UI/UX 테스트"""
        print("\n=== 로그인 페이지 UI/UX 테스트 ===")
        
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            # 페이지 로딩
            start_time = time.time()
            driver.get(f"{self.frontend_url}/login")
            load_time = time.time() - start_time
            
            self.test_results["performance_metrics"]["login_page_load"] = load_time
            print(f"페이지 로딩 시간: {load_time:.2f}초")
            
            wait = WebDriverWait(driver, 10)
            
            # 소셜 로그인 버튼 확인
            social_providers = ["google", "kakao", "naver"]
            for provider in social_providers:
                try:
                    social_button = driver.find_element(By.CSS_SELECTOR, f"[class*='{provider}']")
                    if not social_button.is_displayed():
                        self.log_issue("ui", "major", f"{provider} 로그인 버튼이 표시되지 않음")
                except NoSuchElementException:
                    self.log_issue("ui", "minor", f"{provider} 로그인 버튼을 찾을 수 없음")
                    
            # 비밀번호 찾기 링크
            try:
                forgot_password = driver.find_element(By.PARTIAL_LINK_TEXT, "비밀번호")
            except NoSuchElementException:
                self.log_issue("ui", "minor", "비밀번호 찾기 링크가 없음")
                
            # 회원가입 링크
            try:
                signup_link = driver.find_element(By.PARTIAL_LINK_TEXT, "회원가입")
            except NoSuchElementException:
                self.log_issue("ui", "major", "회원가입 링크가 없음")
                
        except Exception as e:
            print(f"테스트 중 오류 발생: {str(e)}")
            
        finally:
            driver.quit()
            
    def generate_report(self):
        """테스트 결과 리포트 생성"""
        report = []
        report.append("\n=== 프론트엔드 UI/UX 테스트 결과 ===")
        
        # UI 이슈
        if self.test_results["ui_issues"]:
            report.append("\nUI 이슈:")
            critical_count = sum(1 for issue in self.test_results["ui_issues"] if issue["severity"] == "critical")
            major_count = sum(1 for issue in self.test_results["ui_issues"] if issue["severity"] == "major")
            minor_count = sum(1 for issue in self.test_results["ui_issues"] if issue["severity"] == "minor")
            
            report.append(f"  - Critical: {critical_count}")
            report.append(f"  - Major: {major_count}")
            report.append(f"  - Minor: {minor_count}")
            
            for issue in self.test_results["ui_issues"]:
                if issue["severity"] == "critical":
                    report.append(f"\n  🔴 [{issue['severity'].upper()}] {issue['issue']}")
                    if issue["element"]:
                        report.append(f"     Element: {issue['element']}")
                        
        # 접근성 이슈
        if self.test_results["accessibility_issues"]:
            report.append("\n접근성 이슈:")
            for issue in self.test_results["accessibility_issues"]:
                report.append(f"  - [{issue['severity'].upper()}] {issue['issue']}")
                
        # 성능 메트릭
        if self.test_results["performance_metrics"]:
            report.append("\n성능 측정:")
            for metric, value in self.test_results["performance_metrics"].items():
                report.append(f"  - {metric}: {value:.2f}초")
                
        return "\n".join(report)


if __name__ == "__main__":
    try:
        harness = FrontendTestHarness()
        harness.test_signup_page_ui()
        harness.test_login_page_ui()
        print(harness.generate_report())
    except Exception as e:
        print(f"테스트 실행 실패: {str(e)}")
        print("Selenium WebDriver가 설치되어 있지 않을 수 있습니다.")