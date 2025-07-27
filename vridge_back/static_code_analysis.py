#!/usr/bin/env python3
"""
VideoPlanet 정적 코드 분석 및 검증
서버 없이 수행하는 코드 품질 검사
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, List, Set, Tuple
import ast

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class StaticCodeAnalyzer:
    def __init__(self):
        self.issues = {
            "critical": [],
            "major": [],
            "minor": [],
            "info": []
        }
        self.stats = {
            "total_files": 0,
            "total_lines": 0,
            "python_files": 0,
            "js_files": 0,
            "test_coverage": 0
        }
        
    def print_header(self, text: str):
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}")
        print(f"{text:^80}")
        print(f"{'='*80}{Colors.ENDC}\n")
        
    def print_section(self, text: str):
        print(f"\n{Colors.OKBLUE}{Colors.BOLD}[{text}]{Colors.ENDC}")
        
    def analyze_backend(self):
        """백엔드 코드 분석"""
        self.print_section("백엔드 코드 분석")
        
        # 1. 영상 업로드 405 에러 원인 분석
        feedback_urls_path = "/home/winnmedia/VideoPlanet/vridge_back/feedbacks/urls.py"
        if os.path.exists(feedback_urls_path):
            with open(feedback_urls_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # URL 패턴 분석
            if re.search(r'path.*upload.*views\.upload', content):
                print(f"  ✓ {Colors.OKGREEN}영상 업로드 URL 패턴 존재{Colors.ENDC}")
                
                # POST 메서드 지원 확인
                feedback_views_path = "/home/winnmedia/VideoPlanet/vridge_back/feedbacks/views.py"
                if os.path.exists(feedback_views_path):
                    with open(feedback_views_path, 'r', encoding='utf-8') as f:
                        views_content = f.read()
                        
                    if re.search(r'@.*method.*POST|def.*upload.*request.*POST', views_content, re.IGNORECASE):
                        print(f"  ✓ {Colors.OKGREEN}POST 메서드 지원 확인{Colors.ENDC}")
                    else:
                        print(f"  ✗ {Colors.FAIL}영상 업로드 뷰에서 POST 메서드 미지원 (405 에러 원인){Colors.ENDC}")
                        self.issues["critical"].append("영상 업로드 API가 POST 메서드를 지원하지 않음")
            else:
                print(f"  ✗ {Colors.FAIL}영상 업로드 URL 패턴 누락{Colors.ENDC}")
                self.issues["critical"].append("feedbacks/urls.py에 upload 엔드포인트 누락")
                
        # 2. 게스트 피드백 기능 확인
        if os.path.exists(feedback_views_path):
            with open(feedback_views_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if "guest" in content.lower() or "GuestFeedbackSession" in content:
                print(f"  ✓ {Colors.OKGREEN}게스트 피드백 기능 구현 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}게스트 피드백 기능 미확인{Colors.ENDC}")
                self.issues["major"].append("게스트 피드백 기능 구현 확인 필요")
                
        # 3. 영상기획 관련 기능 확인
        planning_views_path = "/home/winnmedia/VideoPlanet/vridge_back/video_planning/views.py"
        if os.path.exists(planning_views_path):
            with open(planning_views_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 스토리 프레임워크 확인
            if "framework" in content.lower():
                print(f"  ✓ {Colors.OKGREEN}스토리 프레임워크 기능 확인{Colors.ENDC}")
            else:
                print(f"  ✗ {Colors.FAIL}스토리 프레임워크 기능 누락{Colors.ENDC}")
                self.issues["critical"].append("스토리 프레임워크 API 미구현")
                
            # 프롬프트 요약 기능 확인
            if "prompt" in content.lower() and "summary" in content.lower():
                print(f"  ✓ {Colors.OKGREEN}프롬프트 요약 기능 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}프롬프트 요약 기능 미확인{Colors.ENDC}")
                self.issues["major"].append("콘티 생성 후 프롬프트 요약 표시 기능 확인 필요")
                
    def analyze_frontend(self):
        """프론트엔드 코드 분석"""
        self.print_section("프론트엔드 코드 분석")
        
        # 1. 영상기획 페이지 분석
        planning_path = "/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/VideoPlanning.jsx"
        if os.path.exists(planning_path):
            with open(planning_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 토글 버튼 확인
            if re.search(r'toggle|switch|Toggle|Switch', content, re.IGNORECASE):
                print(f"  ✓ {Colors.OKGREEN}토글 버튼 컴포넌트 확인{Colors.ENDC}")
            else:
                print(f"  ✗ {Colors.FAIL}토글 버튼 미구현{Colors.ENDC}")
                self.issues["critical"].append("영상기획 페이지에 토글 버튼 누락")
                
            # 2단계 스토리 전개 확인
            if "2단계" in content or "second.*step" in content.lower():
                print(f"  ✓ {Colors.OKGREEN}2단계 스토리 전개 텍스트 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}2단계 스토리 전개 텍스트 미확인{Colors.ENDC}")
                self.issues["major"].append("2단계 스토리 전개 텍스트 표시 확인 필요")
                
            # 최근 기획안 불러오기 확인
            if re.search(r'recent|최근.*기획', content, re.IGNORECASE):
                print(f"  ✓ {Colors.OKGREEN}최근 기획안 불러오기 기능 확인{Colors.ENDC}")
            else:
                print(f"  ✗ {Colors.FAIL}최근 기획안 불러오기 기능 누락{Colors.ENDC}")
                self.issues["critical"].append("최근 기획안 불러오기 기능 미구현")
                
        # 2. 피드백 페이지 분석
        feedback_path = "/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/Feedback.jsx"
        if os.path.exists(feedback_path):
            with open(feedback_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 비디오 플레이어 반응형 확인
            if re.search(r'responsive|@media|flex.*video|width.*100%', content, re.IGNORECASE):
                print(f"  ✓ {Colors.OKGREEN}비디오 플레이어 반응형 스타일 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}비디오 플레이어 반응형 미확인{Colors.ENDC}")
                self.issues["major"].append("비디오 플레이어 반응형 디자인 확인 필요")
                
            # 시점 피드백 버튼 아이콘 및 툴팁
            if re.search(r'tooltip|Tooltip|title=', content):
                print(f"  ✓ {Colors.OKGREEN}툴팁 기능 확인{Colors.ENDC}")
            else:
                print(f"  ✗ {Colors.FAIL}시점 피드백 버튼 툴팁 누락{Colors.ENDC}")
                self.issues["major"].append("시점 피드백 버튼에 툴팁 추가 필요")
                
            # 탭 메뉴 가로 배치
            if re.search(r'flex.*row|horizontal.*tab|tab.*horizontal', content, re.IGNORECASE):
                print(f"  ✓ {Colors.OKGREEN}탭 메뉴 가로 배치 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}탭 메뉴 가로 배치 미확인{Colors.ENDC}")
                self.issues["minor"].append("탭 메뉴 가로 배치 스타일 확인 필요")
                
            # 닉네임 자동 설정
            if re.search(r'nickname.*auto|default.*nickname|닉네임.*자동', content, re.IGNORECASE):
                print(f"  ✓ {Colors.OKGREEN}닉네임 자동 설정 기능 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}닉네임 자동 설정 미확인{Colors.ENDC}")
                self.issues["major"].append("닉네임 자동 설정 기능 확인 필요")
                
    def analyze_css_consistency(self):
        """CSS 일관성 분석"""
        self.print_section("CSS/스타일 일관성 분석")
        
        # 브랜드 색상 일관성 확인
        brand_colors = {
            "primary": "#1631F8",
            "danger": "#dc3545",
            "success": "#28a745",
            "warning": "#ffc107",
            "info": "#17a2b8"
        }
        
        css_files = []
        for root, dirs, files in os.walk("/home/winnmedia/VideoPlanet/vridge_front/src"):
            for file in files:
                if file.endswith(('.css', '.scss')):
                    css_files.append(os.path.join(root, file))
                    
        inconsistent_colors = []
        for css_file in css_files[:10]:  # 처음 10개 파일만 검사
            try:
                with open(css_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # 잘못된 색상 사용 확인
                if "#1631F7" in content or "#1631F9" in content:  # 유사하지만 잘못된 색상
                    inconsistent_colors.append(os.path.basename(css_file))
            except:
                pass
                
        if inconsistent_colors:
            print(f"  ✗ {Colors.FAIL}일관되지 않은 브랜드 색상 사용: {', '.join(inconsistent_colors)}{Colors.ENDC}")
            self.issues["minor"].append(f"브랜드 색상 일관성 문제: {len(inconsistent_colors)}개 파일")
        else:
            print(f"  ✓ {Colors.OKGREEN}브랜드 색상 일관성 양호{Colors.ENDC}")
            
    def analyze_security(self):
        """보안 취약점 분석"""
        self.print_section("보안 취약점 분석")
        
        security_issues = []
        
        # 1. 하드코딩된 비밀키 확인
        for root, dirs, files in os.walk("/home/winnmedia/VideoPlanet/vridge_back"):
            if 'node_modules' in root or 'venv' in root:
                continue
                
            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        # 하드코딩된 비밀키 패턴
                        if re.search(r'SECRET_KEY\s*=\s*["\'][\w\-]{20,}["\']', content):
                            if 'settings' not in filepath:
                                security_issues.append(f"하드코딩된 SECRET_KEY: {os.path.basename(filepath)}")
                                
                        # API 키 노출
                        if re.search(r'(api_key|API_KEY)\s*=\s*["\'][\w\-]{20,}["\']', content):
                            security_issues.append(f"노출된 API 키: {os.path.basename(filepath)}")
                    except:
                        pass
                        
        # 2. SQL 인젝션 취약점 확인
        vulnerable_patterns = [
            r'\.raw\s*\(\s*["\'].*%s',  # Raw SQL with string formatting
            r'cursor\.execute\s*\(\s*["\'].*\+',  # String concatenation in SQL
            r'f["\'].*SELECT.*FROM.*{',  # f-string in SQL
        ]
        
        for root, dirs, files in os.walk("/home/winnmedia/VideoPlanet/vridge_back"):
            if 'migrations' in root:
                continue
                
            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        for pattern in vulnerable_patterns:
                            if re.search(pattern, content):
                                security_issues.append(f"잠재적 SQL 인젝션: {os.path.basename(filepath)}")
                                break
                    except:
                        pass
                        
        if security_issues:
            for issue in security_issues[:5]:  # 처음 5개만 표시
                print(f"  ✗ {Colors.FAIL}{issue}{Colors.ENDC}")
            self.issues["critical"].extend(security_issues)
        else:
            print(f"  ✓ {Colors.OKGREEN}심각한 보안 취약점 미발견{Colors.ENDC}")
            
    def analyze_performance(self):
        """성능 문제 분석"""
        self.print_section("성능 최적화 분석")
        
        # 1. N+1 쿼리 문제 확인
        n_plus_one_patterns = [
            r'for.*in.*\.objects\.all\(\)',
            r'for.*in.*\.filter\(',
            r'\.get\(.*\).*for.*in',
        ]
        
        performance_issues = []
        
        for root, dirs, files in os.walk("/home/winnmedia/VideoPlanet/vridge_back"):
            for file in files:
                if file.endswith('views.py'):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        for pattern in n_plus_one_patterns:
                            if re.search(pattern, content):
                                if 'select_related' not in content and 'prefetch_related' not in content:
                                    performance_issues.append(f"잠재적 N+1 쿼리: {os.path.basename(filepath)}")
                                    break
                    except:
                        pass
                        
        # 2. 대용량 파일 처리 확인
        if os.path.exists("/home/winnmedia/VideoPlanet/vridge_back/feedbacks/views.py"):
            with open("/home/winnmedia/VideoPlanet/vridge_back/feedbacks/views.py", 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'chunk' in content or 'stream' in content:
                print(f"  ✓ {Colors.OKGREEN}대용량 파일 스트리밍 처리 확인{Colors.ENDC}")
            else:
                print(f"  ⚠ {Colors.WARNING}대용량 비디오 파일 처리 최적화 필요{Colors.ENDC}")
                performance_issues.append("비디오 파일 스트리밍 처리 미구현")
                
        if performance_issues:
            for issue in performance_issues[:3]:
                print(f"  ⚠ {Colors.WARNING}{issue}{Colors.ENDC}")
            self.issues["major"].extend(performance_issues)
            
    def generate_report(self):
        """분석 보고서 생성"""
        self.print_header("정적 코드 분석 결과")
        
        total_issues = sum(len(issues) for issues in self.issues.values())
        
        print(f"{Colors.BOLD}발견된 이슈:")
        print(f"{Colors.FAIL}심각: {len(self.issues['critical'])}")
        print(f"{Colors.WARNING}주요: {len(self.issues['major'])}")
        print(f"{Colors.OKCYAN}경미: {len(self.issues['minor'])}")
        print(f"정보: {len(self.issues['info'])}")
        print(f"\n총 이슈: {total_issues}{Colors.ENDC}")
        
        if self.issues['critical']:
            print(f"\n{Colors.FAIL}{Colors.BOLD}즉시 수정이 필요한 심각한 이슈:{Colors.ENDC}")
            for issue in self.issues['critical'][:10]:
                print(f"  • {issue}")
                
        if self.issues['major']:
            print(f"\n{Colors.WARNING}{Colors.BOLD}주요 이슈:{Colors.ENDC}")
            for issue in self.issues['major'][:5]:
                print(f"  • {issue}")
                
        # JSON 보고서 저장
        report_data = {
            "analysis_date": datetime.now().isoformat(),
            "summary": {
                "total_issues": total_issues,
                "critical": len(self.issues['critical']),
                "major": len(self.issues['major']),
                "minor": len(self.issues['minor']),
                "info": len(self.issues['info'])
            },
            "issues": self.issues,
            "stats": self.stats
        }
        
        os.makedirs("test_results", exist_ok=True)
        report_path = f"test_results/static_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
            
        print(f"\n상세 분석 보고서: {report_path}")
        
        return len(self.issues['critical']) == 0  # 심각한 이슈가 없으면 성공
        
    def run_analysis(self):
        """전체 분석 실행"""
        self.print_header("VideoPlanet 정적 코드 분석")
        
        self.analyze_backend()
        self.analyze_frontend()
        self.analyze_css_consistency()
        self.analyze_security()
        self.analyze_performance()
        
        success = self.generate_report()
        
        if success:
            print(f"\n{Colors.OKGREEN}{Colors.BOLD}분석 완료: 심각한 이슈가 발견되지 않았습니다.{Colors.ENDC}")
        else:
            print(f"\n{Colors.FAIL}{Colors.BOLD}분석 완료: 즉시 수정이 필요한 심각한 이슈가 발견되었습니다.{Colors.ENDC}")
            
        return success

if __name__ == "__main__":
    analyzer = StaticCodeAnalyzer()
    analyzer.run_analysis()