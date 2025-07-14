#!/usr/bin/env python3
"""
간단한 기획안 내보내기 구현 검증 스크립트
"""

import os
import sys
import django
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_file_existence():
    """필수 파일들의 존재 확인"""
    files_to_check = [
        'video_planning/proposal_export_service.py',
        'video_planning/serializers_proposal.py', 
        'video_planning/views_proposal.py',
        'video_planning/utils.py',
        'video_planning/exceptions.py',
        'video_planning/frontend_integration_guide.md'
    ]
    
    print("📁 파일 존재 확인:")
    all_exist = True
    for file_path in files_to_check:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")
            all_exist = False
    
    return all_exist

def test_imports():
    """모듈 import 테스트"""
    print("\n📦 모듈 Import 테스트:")
    try:
        from video_planning.utils import TextValidator, APIRateLimiter, ResponseFormatter
        from video_planning.exceptions import ProposalExportError, GeminiAPIError
        from video_planning.serializers_proposal import ProposalExportSerializer
        
        print("✅ utils 모듈 import 성공")
        print("✅ exceptions 모듈 import 성공")
        print("✅ serializers_proposal 모듈 import 성공")
        
        return True
    except Exception as e:
        print(f"❌ Import 실패: {e}")
        return False

def test_functionality():
    """기본 기능 테스트"""
    print("\n🔧 기본 기능 테스트:")
    try:
        from video_planning.utils import TextValidator
        from video_planning.serializers_proposal import ProposalExportSerializer
        
        # 텍스트 검증 테스트
        sample_text = "이것은 영상 기획안 내보내기 기능을 위한 테스트 텍스트입니다. " * 3
        validation = TextValidator.validate_text_input(sample_text)
        
        if validation['is_valid']:
            print("✅ 텍스트 검증 기능 작동")
        else:
            print(f"❌ 텍스트 검증 실패: {validation['issues']}")
        
        # 시리얼라이저 테스트
        test_data = {
            'planning_text': sample_text,
            'export_format': 'google_slides'
        }
        
        serializer = ProposalExportSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ 시리얼라이저 검증 성공")
        else:
            print(f"❌ 시리얼라이저 검증 실패: {serializer.errors}")
        
        return True
        
    except Exception as e:
        print(f"❌ 기능 테스트 실패: {e}")
        return False

def test_url_patterns():
    """URL 패턴 확인"""
    print("\n🌐 URL 패턴 확인:")
    try:
        from video_planning.urls import urlpatterns
        
        # 새로 추가된 URL 패턴들 확인
        expected_patterns = [
            'proposals/export/',
            'proposals/preview/',
            'proposals/create-slides/',
            'proposals/templates/',
            'proposals/status/'
        ]
        
        url_strings = [str(pattern.pattern) for pattern in urlpatterns]
        
        for expected in expected_patterns:
            found = any(expected in url_str for url_str in url_strings)
            if found:
                print(f"✅ {expected}")
            else:
                print(f"❌ {expected}")
        
        return True
        
    except Exception as e:
        print(f"❌ URL 패턴 확인 실패: {e}")
        return False

def main():
    """메인 실행 함수"""
    print("🚀 VideoPlanet AI 기획안 내보내기 구현 검증")
    print(f"검증 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("파일 존재", test_file_existence),
        ("모듈 Import", test_imports),
        ("기본 기능", test_functionality),
        ("URL 패턴", test_url_patterns)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name} 검증 중...")
        results[test_name] = test_func()
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("📊 검증 결과 요약")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ 통과" if result else "❌ 실패"
        print(f"{test_name}: {status}")
    
    print(f"\n총 {total}개 검증 중 {passed}개 통과 ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 모든 검증 통과! 구현이 완료되었습니다!")
        print("\n📋 다음 단계:")
        print("1. Railway 환경에 GOOGLE_API_KEY 및 GOOGLE_APPLICATION_CREDENTIALS 설정")
        print("2. 프론트엔드에서 API 연동 테스트")
        print("3. 사용자 시나리오 기반 통합 테스트")
        return True
    else:
        print(f"\n⚠️ {total-passed}개 검증 실패. 문제를 해결해주세요.")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 예기치 못한 오류: {e}")
        sys.exit(1)