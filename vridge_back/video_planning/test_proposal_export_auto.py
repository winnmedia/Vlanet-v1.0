"""
기획안 내보내기 기능 자동 테스트 스크립트
"""

import json
import requests
import time
import os
import sys
from datetime import datetime

def test_imports():
    """Django 환경에서 모듈 import 테스트"""
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        
        from video_planning.proposal_export_service import ProposalExportService
        from video_planning.google_slides_service import GoogleSlidesService
        from video_planning.gemini_service import GeminiService
        
        print("✅ Django 모듈 import 성공")
        return True
    except Exception as e:
        print(f"❌ Django 모듈 import 실패: {e}")
        return False

def test_service_initialization():
    """서비스 초기화 테스트"""
    try:
        from video_planning.proposal_export_service import ProposalExportService
        
        # ProposalExportService 초기화 테스트
        service = ProposalExportService()
        print("✅ ProposalExportService 초기화 성공")
        
        # 서비스 상태 확인
        print(f"- Gemini 모델: {service.gemini_model.model_name}")
        print(f"- Google Slides 사용 가능: {service.slides_available}")
        
        return True
    except Exception as e:
        print(f"❌ 서비스 초기화 실패: {e}")
        return False

def test_text_processing():
    """텍스트 처리 테스트 (Gemini API 호출 없이)"""
    try:
        from video_planning.utils import TextValidator
        
        sample_text = """
        영상 제목: 테스트 영상 기획안
        
        프로젝트 개요:
        이것은 테스트용 기획안입니다. 
        AI가 이 텍스트를 구조화된 프레젠테이션으로 변환할 수 있는지 테스트합니다.
        
        타겟 오디언스: 개발팀
        목적: 기능 테스트
        예상 길이: 2분
        """
        
        # 텍스트 검증
        validation_result = TextValidator.validate_text_input(sample_text)
        
        print("✅ 텍스트 검증 테스트 성공")
        print(f"- 검증 결과: {validation_result['is_valid']}")
        print(f"- 정제된 텍스트 길이: {len(validation_result['sanitized_text'])}")
        
        # 키워드 추출 테스트
        keywords = TextValidator.extract_keywords(sample_text)
        print(f"- 추출된 키워드: {keywords[:5]}")
        
        return True
    except Exception as e:
        print(f"❌ 텍스트 처리 테스트 실패: {e}")
        return False

def test_api_endpoints():
    """API 엔드포인트 테스트 (실제 호출 없이 URL 패턴 확인)"""
    try:
        from django.urls import reverse
        
        # URL 패턴 테스트
        urls_to_test = [
            'video_planning:export_proposal',
            'video_planning:preview_structure',
            'video_planning:create_slides_from_structure',
            'video_planning:get_available_templates',
            'video_planning:get_service_status'
        ]
        
        for url_name in urls_to_test:
            try:
                url = reverse(url_name)
                print(f"✅ URL 패턴 확인: {url_name} -> {url}")
            except Exception as e:
                print(f"❌ URL 패턴 오류: {url_name} -> {e}")
                return False
        
        return True
    except Exception as e:
        print(f"❌ URL 패턴 테스트 실패: {e}")
        return False

def test_serializers():
    """시리얼라이저 테스트"""
    try:
        from video_planning.serializers_proposal import (
            ProposalExportSerializer,
            ProposalStructurePreviewSerializer,
            StructuredProposalSerializer
        )
        
        # ProposalExportSerializer 테스트
        test_data = {
            'planning_text': '이것은 테스트용 기획안 텍스트입니다. ' * 10,  # 50자 이상
            'export_format': 'google_slides'
        }
        
        serializer = ProposalExportSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ ProposalExportSerializer 검증 성공")
        else:
            print(f"❌ ProposalExportSerializer 검증 실패: {serializer.errors}")
            return False
        
        # 구조화된 데이터 시리얼라이저 테스트
        structured_data = {
            'metadata': {
                'title': '테스트 기획서',
                'project_type': '테스트',
                'target_audience': '개발팀',
                'duration': '2분'
            },
            'slides': [
                {
                    'slide_number': 1,
                    'layout': 'TITLE',
                    'title': '제목 슬라이드',
                    'content': {
                        'title_text': '테스트 기획서',
                        'subtitle_text': '자동화 테스트'
                    }
                },
                {
                    'slide_number': 2,
                    'layout': 'TITLE_AND_BODY',
                    'title': '내용 슬라이드',
                    'content': {
                        'bullet_points': ['포인트 1', '포인트 2', '포인트 3']
                    }
                },
                {
                    'slide_number': 3,
                    'layout': 'TITLE_AND_TWO_COLUMNS',
                    'title': '2열 슬라이드',
                    'content': {
                        'left_column': ['왼쪽 1', '왼쪽 2'],
                        'right_column': ['오른쪽 1', '오른쪽 2']
                    }
                }
            ]
        }
        
        structured_serializer = StructuredProposalSerializer(data=structured_data)
        if structured_serializer.is_valid():
            print("✅ StructuredProposalSerializer 검증 성공")
        else:
            print(f"❌ StructuredProposalSerializer 검증 실패: {structured_serializer.errors}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ 시리얼라이저 테스트 실패: {e}")
        return False

def test_environment_variables():
    """환경 변수 설정 확인"""
    try:
        from django.conf import settings
        
        # 필수 환경 변수 확인
        required_vars = ['GOOGLE_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS']
        
        for var in required_vars:
            value = getattr(settings, var, None)
            if value:
                print(f"✅ {var}: 설정됨 (길이: {len(str(value))})")
            else:
                print(f"⚠️ {var}: 설정되지 않음")
        
        # 선택적 환경 변수 확인
        optional_vars = ['OPENAI_API_KEY', 'HUGGINGFACE_API_KEY']
        
        for var in optional_vars:
            value = getattr(settings, var, None)
            if value:
                print(f"✅ {var}: 설정됨")
            else:
                print(f"ℹ️ {var}: 설정되지 않음 (선택사항)")
        
        return True
    except Exception as e:
        print(f"❌ 환경 변수 확인 실패: {e}")
        return False

def test_database_connection():
    """데이터베이스 연결 테스트"""
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        print("✅ 데이터베이스 연결 성공")
        return True
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False

def run_comprehensive_test():
    """종합 테스트 실행"""
    print("🚀 VideoPlanet 기획안 내보내기 기능 종합 테스트")
    print(f"테스트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("Django 모듈 Import", test_imports),
        ("환경 변수 설정", test_environment_variables),
        ("데이터베이스 연결", test_database_connection),
        ("서비스 초기화", test_service_initialization),
        ("텍스트 처리", test_text_processing),
        ("시리얼라이저", test_serializers),
        ("API 엔드포인트", test_api_endpoints)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name} 테스트 중...")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} 테스트 예외 발생: {e}")
            results[test_name] = False
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("📊 테스트 결과 요약")
    print("=" * 60)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ 통과" if result else "❌ 실패"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n총 {total}개 테스트 중 {passed}개 통과 ({passed/total*100:.1f}%)")
    
    # 배포 준비 상태 평가
    if passed == total:
        print("\n🎉 모든 테스트 통과! 배포 준비 완료!")
        return True
    elif passed >= total * 0.8:
        print(f"\n⚠️ 대부분 테스트 통과 ({passed}/{total}). 실패한 테스트를 확인하고 배포하세요.")
        return False
    else:
        print(f"\n❌ 다수 테스트 실패 ({passed}/{total}). 문제를 해결한 후 다시 테스트하세요.")
        return False

def main():
    """메인 실행 함수"""
    try:
        # Django 설정 강제 로드
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        
        # 종합 테스트 실행
        success = run_comprehensive_test()
        
        # 종료 코드 설정
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n테스트가 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 테스트 실행 중 예기치 못한 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()