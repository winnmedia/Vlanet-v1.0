"""
기획안 내보내기 기능 테스트 스크립트
"""

import json
import requests
import time
import os
from datetime import datetime

class ProposalExportTester:
    def __init__(self, base_url="https://videoplanet.up.railway.app/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        
    def authenticate(self, email="test@test.com", password="test1234"):
        """로그인 후 토큰 획득"""
        login_url = f"{self.base_url}/users/login/"
        
        login_data = {
            "email": email,
            "password": password
        }
        
        response = self.session.post(login_url, json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get('access')
            self.session.headers.update({
                'Authorization': f'Bearer {self.auth_token}'
            })
            print(f"✅ 로그인 성공: {email}")
            return True
        else:
            print(f"❌ 로그인 실패: {response.status_code} - {response.text}")
            return False
    
    def test_service_status(self):
        """서비스 상태 확인 테스트"""
        print("\n🔍 서비스 상태 확인 테스트")
        
        url = f"{self.base_url}/video-planning/proposals/status/"
        response = self.session.get(url)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 서비스 상태: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return data
        else:
            print(f"❌ 서비스 상태 확인 실패: {response.text}")
            return None
    
    def test_preview_structure(self):
        """구조 미리보기 테스트"""
        print("\n🔍 구조 미리보기 테스트")
        
        sample_text = """
        영상 제목: 친환경 브랜드 소개 영상
        
        프로젝트 개요:
        우리 회사는 친환경 제품을 전문으로 하는 브랜드입니다. 
        이번 영상을 통해 브랜드 철학과 대표 제품들을 소개하고자 합니다.
        
        타겟 오디언스: 20-40대 환경 의식이 높은 소비자
        목적: 브랜드 인지도 향상 및 신제품 홍보
        예상 길이: 3-5분
        
        주요 내용:
        1. 브랜드 스토리 소개
        2. 친환경 제조 과정 설명
        3. 대표 제품 3가지 소개
        4. 고객 후기 및 사용 사례
        5. 브랜드 미션과 비전 제시
        
        제작 방향:
        - 자연스러운 색감과 따뜻한 톤앤매너
        - 제품 사용 장면 중심의 라이프스타일 영상
        - 고객 인터뷰와 제품 클로즈업 컷 활용
        
        예산: 500만원 ~ 800만원
        일정: 기획 1주, 촬영 2일, 편집 1주
        """
        
        url = f"{self.base_url}/video-planning/proposals/preview/"
        data = {
            "planning_text": sample_text,
            "preview_only": True
        }
        
        response = self.session.post(url, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 구조 미리보기 성공")
            print(f"슬라이드 수: {result.get('slide_count', 0)}")
            
            # 구조화된 데이터 저장
            self.structured_data = result.get('structured_data')
            
            # 첫 번째 슬라이드 내용 출력
            slides = self.structured_data.get('slides', [])
            if slides:
                print(f"첫 번째 슬라이드: {slides[0].get('title', 'N/A')}")
            
            return result
        else:
            print(f"❌ 구조 미리보기 실패: {response.text}")
            return None
    
    def test_full_export(self):
        """전체 내보내기 테스트 (Google Slides 생성 포함)"""
        print("\n🔍 전체 내보내기 테스트")
        
        sample_text = """
        프로젝트명: 스마트 홈 IoT 제품 소개 영상
        
        기획 배경:
        스마트 홈 시장이 급성장하고 있는 가운데, 우리 회사의 새로운 IoT 제품 라인을 
        효과적으로 소개할 필요가 있습니다.
        
        제품 특징:
        - 음성 인식 기반 홈 컨트롤 시스템
        - 에너지 효율성 30% 향상
        - 간편한 설치 및 사용법
        - 스마트폰 앱 연동
        
        타겟: 30-50대 기술 얼리어답터, 고소득층
        목표: 제품 런칭 전 사전 마케팅 및 예약 판매 유도
        러닝타임: 2-3분
        
        콘텐츠 구성:
        1. 도입부: 기존 생활의 불편함 제시 (30초)
        2. 제품 소개: 주요 기능 및 장점 (90초)
        3. 사용 시연: 실제 가정에서의 활용 (60초)
        4. 마무리: 구매 유도 및 브랜드 메시지 (30초)
        
        제작 스타일:
        - 모던하고 세련된 영상미
        - 기술적 신뢰감을 주는 연출
        - 라이프스타일과 기술의 조화
        
        촬영 장소: 모델하우스 또는 인테리어 쇼룸
        예산: 1000만원 ~ 1500만원
        일정: 총 4주 (기획 1주, 촬영 1주, 편집 2주)
        """
        
        url = f"{self.base_url}/video-planning/proposals/export/"
        data = {
            "planning_text": sample_text,
            "export_format": "google_slides",
            "title": "스마트 홈 IoT 제품 소개 영상 기획서"
        }
        
        print("API 호출 중...")
        start_time = time.time()
        
        response = self.session.post(url, json=data)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"소요 시간: {duration:.2f}초")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 전체 내보내기 성공")
            
            if result.get('presentation'):
                presentation = result['presentation']
                print(f"Google Slides URL: {presentation.get('url')}")
                print(f"프레젠테이션 ID: {presentation.get('id')}")
                print(f"슬라이드 수: {presentation.get('slide_count')}")
            
            return result
        
        elif response.status_code == 207:  # Multi-Status (부분 성공)
            result = response.json()
            print(f"⚠️ 부분 성공: {result.get('message')}")
            print(f"실패 단계: {result.get('step')}")
            
            if result.get('structured_data'):
                print("✅ 구조화는 성공, Google Slides 생성만 실패")
                
            return result
        else:
            print(f"❌ 전체 내보내기 실패: {response.text}")
            return None
    
    def test_create_slides_from_structure(self):
        """구조화된 데이터로 Google Slides 생성 테스트"""
        if not hasattr(self, 'structured_data') or not self.structured_data:
            print("❌ 구조화된 데이터가 없습니다. 먼저 preview_structure를 실행하세요.")
            return None
        
        print("\n🔍 구조화된 데이터로 Google Slides 생성 테스트")
        
        url = f"{self.base_url}/video-planning/proposals/create-slides/"
        
        response = self.session.post(url, json=self.structured_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Google Slides 생성 성공")
            
            if result.get('presentation'):
                presentation = result['presentation']
                print(f"Google Slides URL: {presentation.get('url')}")
                print(f"프레젠테이션 ID: {presentation.get('id')}")
            
            return result
        else:
            print(f"❌ Google Slides 생성 실패: {response.text}")
            return None
    
    def test_get_templates(self):
        """템플릿 목록 조회 테스트"""
        print("\n🔍 템플릿 목록 조회 테스트")
        
        url = f"{self.base_url}/video-planning/proposals/templates/"
        response = self.session.get(url)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 템플릿 조회 성공")
            
            templates = result.get('templates', [])
            print(f"사용 가능한 템플릿 수: {len(templates)}")
            
            for template in templates:
                print(f"- {template['name']}: {template['description']}")
            
            return result
        else:
            print(f"❌ 템플릿 조회 실패: {response.text}")
            return None
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("🚀 기획안 내보내기 기능 종합 테스트 시작")
        print(f"테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"API 베이스 URL: {self.base_url}")
        
        # 1. 인증
        if not self.authenticate():
            print("❌ 인증 실패로 테스트를 중단합니다.")
            return
        
        # 2. 서비스 상태 확인
        status_result = self.test_service_status()
        
        # 3. 템플릿 조회
        templates_result = self.test_get_templates()
        
        # 4. 구조 미리보기
        preview_result = self.test_preview_structure()
        
        # 5. 구조화된 데이터로 Google Slides 생성 (선택적)
        if preview_result:
            slides_result = self.test_create_slides_from_structure()
        
        # 6. 전체 내보내기 (통합 테스트)
        full_export_result = self.test_full_export()
        
        # 결과 요약
        print("\n" + "="*60)
        print("📊 테스트 결과 요약")
        print("="*60)
        
        results = {
            "서비스 상태": "✅" if status_result else "❌",
            "템플릿 조회": "✅" if templates_result else "❌",
            "구조 미리보기": "✅" if preview_result else "❌",
            "Google Slides 생성": "✅" if hasattr(self, 'slides_result') and getattr(self, 'slides_result') else "⚠️",
            "전체 내보내기": "✅" if full_export_result else "❌"
        }
        
        for test_name, result in results.items():
            print(f"{test_name}: {result}")
        
        # 서비스 상태 정보
        if status_result:
            services = status_result.get('services', {})
            print(f"\n서비스 상태:")
            print(f"- Gemini API: {'✅' if services.get('gemini_api') else '❌'}")
            print(f"- Google Slides: {'✅' if services.get('google_slides') else '❌'}")
        
        print("\n테스트 완료!")


def main():
    """메인 실행 함수"""
    tester = ProposalExportTester()
    
    # 환경변수에서 테스트 계정 정보 가져오기 (선택적)
    test_email = os.environ.get('TEST_EMAIL', 'test@test.com')
    test_password = os.environ.get('TEST_PASSWORD', 'test1234')
    
    # 사용자 입력으로 테스트 계정 설정 (선택적)
    print("기획안 내보내기 기능 테스트")
    print("테스트용 계정 정보를 입력하세요 (기본값 사용시 Enter)")
    
    email_input = input(f"이메일 [{test_email}]: ").strip()
    if email_input:
        test_email = email_input
    
    password_input = input("비밀번호 [****]: ").strip()
    if password_input:
        test_password = password_input
    
    # 테스트 실행
    tester.authenticate(test_email, test_password)
    tester.run_all_tests()


if __name__ == "__main__":
    main()