#!/usr/bin/env python
"""Gemini 실패 시 DALL-E 폴백 테스트"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from video_planning.gemini_service import GeminiService
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("=" * 80)
print("Gemini API 실패 시 DALL-E 폴백 테스트")
print("=" * 80)

# GeminiService 초기화
print("\n1. 서비스 초기화...")
try:
    service = GeminiService()
    print("✅ GeminiService 초기화 성공")
    
    # DALL-E 서비스 상태 확인
    if service.image_service_available:
        print("✅ DALL-E 서비스 사용 가능")
    else:
        print("❌ DALL-E 서비스 사용 불가 (OPENAI_API_KEY 확인 필요)")
        print("   .env 파일에 OPENAI_API_KEY를 추가하세요:")
        print("   OPENAI_API_KEY=your-openai-api-key-here")
    
except Exception as e:
    print(f"❌ 초기화 실패: {str(e)}")
    sys.exit(1)

# 테스트 시나리오
print("\n2. 스토리보드 생성 테스트...")

# 간단한 샷 데이터
shot_data = {
    'shot_number': 1,
    'shot_type': '와이드샷',
    'camera_movement': '고정',
    'duration': 3,
    'description': '카페 내부 전체를 보여주는 와이드샷',
    'planning_options': {
        'tone': '따뜻한',
        'genre': '드라마',
        'concept': '일상'
    }
}

try:
    # 일부러 Gemini를 실패시키기 위해 잘못된 모델 설정
    original_model = service.model
    service.model = None  # Gemini 모델을 일시적으로 제거
    
    print("\n3. Gemini 모델을 일시적으로 비활성화하여 DALL-E 폴백 테스트...")
    
    result = service.generate_storyboards_from_shot(shot_data)
    
    if 'storyboards' in result:
        print("\n✅ 스토리보드 생성 성공!")
        
        # Gemini 오류 확인
        if result.get('gemini_error'):
            print(f"⚠️  Gemini 오류 발생: {result['gemini_error'][:100]}...")
            print("✅ 폴백 스토리보드 사용됨")
        
        # 생성된 스토리보드 확인
        for i, frame in enumerate(result['storyboards']):
            print(f"\n[프레임 {i+1}]")
            print(f"제목: {frame.get('title', 'N/A')}")
            print(f"설명: {frame.get('description_kr', 'N/A')}")
            
            # 이미지 확인
            if frame.get('image_url'):
                if frame.get('model_used') == 'dall-e':
                    print("✅ DALL-E로 이미지 생성됨")
                elif frame.get('is_placeholder'):
                    print("⚠️  플레이스홀더 이미지 사용됨")
                else:
                    print("✅ 이미지 생성됨")
            else:
                print("❌ 이미지 생성 실패")
    else:
        print("❌ 스토리보드 생성 실패")
        if 'error' in result:
            print(f"오류: {result['error']}")
    
    # 모델 복원
    service.model = original_model
    
except Exception as e:
    print(f"❌ 테스트 중 오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()

# 정상 작동 테스트
print("\n\n4. 정상 작동 테스트 (Gemini + DALL-E)...")

try:
    result = service.generate_storyboards_from_shot(shot_data)
    
    if 'storyboards' in result and not result.get('gemini_error'):
        print("✅ Gemini 정상 작동")
        
        for i, frame in enumerate(result['storyboards']):
            if frame.get('image_url'):
                model_used = frame.get('model_used', 'unknown')
                print(f"✅ 프레임 {i+1}: {model_used}로 이미지 생성")
    else:
        print("⚠️  Gemini 오류 발생")
        
except Exception as e:
    print(f"❌ 정상 테스트 실패: {str(e)}")

print("\n" + "=" * 80)
print("테스트 완료")
print("=" * 80)

# 설정 안내
if not service.image_service_available:
    print("\n💡 DALL-E를 사용하려면:")
    print("1. OpenAI API 키를 발급받으세요: https://platform.openai.com/api-keys")
    print("2. .env 파일에 추가하세요:")
    print("   OPENAI_API_KEY=sk-...")
    print("3. 서버를 재시작하세요")