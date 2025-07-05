#!/usr/bin/env python
"""
DALL-E 이미지 생성 실제 테스트
"""
import os
import sys
import django
import base64
from PIL import Image
from io import BytesIO

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 테스트용 API 키 설정 (필요시)
# os.environ['OPENAI_API_KEY'] = 'your-api-key-here'

django.setup()

from video_planning.dalle_service import DalleService

def save_base64_image(base64_string, filename):
    """Base64 이미지를 파일로 저장"""
    try:
        # data:image/png;base64, 부분 제거
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # 디코딩
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        # 저장
        output_dir = 'test_images'
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)
        image.save(filepath)
        print(f"   ✅ 이미지 저장됨: {filepath}")
        return True
    except Exception as e:
        print(f"   ❌ 이미지 저장 실패: {e}")
        return False

def test_image_generation():
    """실제 이미지 생성 테스트"""
    
    service = DalleService()
    
    if not service.available:
        print("❌ DALL-E 서비스를 사용할 수 없습니다.")
        print("   OPENAI_API_KEY를 설정해주세요.")
        return
    
    # 다양한 테스트 케이스
    test_cases = [
        {
            'name': 'cafe_entrance',
            'frame': {
                'visual_description': '카페에 들어가는 남자',
                'composition': '미디엄샷',
                'lighting': '자연광'
            },
            'styles': ['sketch', 'minimal', 'realistic']
        },
        {
            'name': 'presentation',
            'frame': {
                'visual_description': '회의실에서 프레젠테이션하는 여성',
                'composition': '와이드샷',
                'lighting': '실내조명'
            },
            'styles': ['sketch', 'cinematic']
        },
        {
            'name': 'park_play',
            'frame': {
                'visual_description': '공원에서 뛰어노는 아이들',
                'composition': '풀샷',
                'lighting': '황금시간대'
            },
            'styles': ['sketch', 'watercolor']
        }
    ]
    
    print("="*60)
    print("🎨 DALL-E 이미지 생성 실제 테스트")
    print("="*60)
    
    success_count = 0
    fail_count = 0
    
    for test in test_cases:
        print(f"\n📌 테스트: {test['name']}")
        print(f"   설명: {test['frame']['visual_description']}")
        
        for style in test['styles']:
            print(f"\n   [{style}] 스타일로 생성 시도...")
            
            # 프롬프트 확인
            prompt = service._create_visual_prompt(test['frame'], style)
            print(f"   프롬프트: {prompt}")
            
            # 이미지 생성
            result = service.generate_storyboard_image(test['frame'], style)
            
            if result['success']:
                success_count += 1
                print(f"   ✅ 이미지 생성 성공!")
                print(f"   모델: {result.get('model_used', 'unknown')}")
                
                # 이미지 저장
                filename = f"{test['name']}_{style}.png"
                if result.get('image_url'):
                    save_base64_image(result['image_url'], filename)
            else:
                fail_count += 1
                print(f"   ❌ 이미지 생성 실패: {result.get('error', 'Unknown error')}")
                
                # 오류에 따라 프롬프트 조정
                if 'text' in result.get('error', '').lower():
                    print("   🔧 텍스트 관련 오류 감지. 프롬프트 재조정 중...")
                    # 프롬프트 단순화
                    simplified_prompt = prompt.replace('illustration only', '')
                    simplified_prompt = simplified_prompt.replace('cinematic composition', '')
                    print(f"   재시도 프롬프트: {simplified_prompt}")
                    
                    # 재시도는 수동으로 해야 함 (API 한도 고려)
    
    print("\n" + "="*60)
    print(f"테스트 결과: 성공 {success_count}개, 실패 {fail_count}개")
    print("="*60)

def test_prompt_variations():
    """프롬프트 변형 테스트"""
    
    service = DalleService()
    
    # 동일한 장면에 대한 다양한 프롬프트 시도
    base_scene = {
        'visual_description': '카페에 들어가는 남자',
        'composition': '미디엄샷',
        'lighting': '자연광'
    }
    
    # 프롬프트 변형
    prompt_variations = [
        # 원본
        lambda p: p,
        
        # 더 간단하게
        lambda p: p.split(',')[0] + ', ' + p.split(',')[1],
        
        # 스타일 강조
        lambda p: p.replace('sketch', 'detailed pencil sketch artwork'),
        
        # 동작 강조
        lambda p: p.replace('man entering', 'businessman walking into'),
        
        # 분위기 추가
        lambda p: p + ', morning atmosphere, busy urban setting',
        
        # 극단적 단순화
        lambda p: 'pencil drawing of man entering café'
    ]
    
    print("\n" + "="*60)
    print("🔬 프롬프트 변형 테스트")
    print("="*60)
    
    original_prompt = service._create_visual_prompt(base_scene, 'sketch')
    print(f"\n원본 프롬프트: {original_prompt}")
    
    for i, variation in enumerate(prompt_variations):
        varied_prompt = variation(original_prompt)
        print(f"\n변형 {i+1}: {varied_prompt}")
        
        # 실제 생성은 API 키가 있을 때만
        if service.available:
            # 여기서 실제 이미지 생성 시도
            pass

if __name__ == "__main__":
    # 메인 테스트
    test_image_generation()
    
    # 프롬프트 변형 테스트
    test_prompt_variations()