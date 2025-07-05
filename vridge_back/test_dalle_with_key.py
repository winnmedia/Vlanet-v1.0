#!/usr/bin/env python
"""
DALL-E 실제 이미지 생성 테스트
"""
import os
import sys
import django
import json
from datetime import datetime

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# API 키 확인 및 설정
print("환경변수에서 API 키 확인 중...")
api_key = os.environ.get('OPENAI_API_KEY')
if not api_key:
    # Railway 환경변수에서 가져오기 시도
    try:
        # settings.py에서 API 키 확인
        django.setup()
        from django.conf import settings
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if api_key:
            os.environ['OPENAI_API_KEY'] = api_key
            print("✅ settings.py에서 API 키 발견")
    except:
        pass

if not api_key:
    print("❌ API 키를 찾을 수 없습니다.")
    print("다음 방법으로 설정해주세요:")
    print("1. export OPENAI_API_KEY='your-key'")
    print("2. Railway 환경변수 설정")
    sys.exit(1)

print(f"✅ API 키 발견: {api_key[:10]}...")

# Django 초기화 (API 키 설정 후)
django.setup()

from video_planning.dalle_service import DalleService
import base64
from PIL import Image
from io import BytesIO

def save_image(base64_data, filename):
    """Base64 이미지를 파일로 저장"""
    try:
        if base64_data.startswith('data:'):
            base64_data = base64_data.split(',')[1]
        
        img_data = base64.b64decode(base64_data)
        img = Image.open(BytesIO(img_data))
        
        # 저장 디렉토리
        output_dir = 'generated_images'
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        img.save(filepath)
        print(f"✅ 이미지 저장: {filepath}")
        
        # 이미지 정보
        print(f"   크기: {img.size}")
        print(f"   포맷: {img.format}")
        return filepath
    except Exception as e:
        print(f"❌ 이미지 저장 실패: {e}")
        return None

def test_dalle_generation():
    """DALL-E 이미지 생성 테스트"""
    
    print("\n" + "="*60)
    print("🎨 DALL-E 3 이미지 생성 실제 테스트")
    print("="*60)
    
    # 서비스 초기화
    service = DalleService()
    
    if not service.available:
        print("❌ DALL-E 서비스를 사용할 수 없습니다.")
        return
    
    # 테스트 케이스
    test_cases = [
        {
            'name': 'cafe_minimal',
            'frame': {
                'visual_description': '카페에 들어가는 남자',
                'composition': '미디엄샷',
                'lighting': '자연광'
            },
            'style': 'minimal'
        },
        {
            'name': 'presentation_sketch',
            'frame': {
                'visual_description': '회의실에서 프레젠테이션하는 여성',
                'composition': '와이드샷',
                'lighting': '실내조명'
            },
            'style': 'sketch'
        },
        {
            'name': 'park_watercolor',
            'frame': {
                'visual_description': '공원에서 뛰어노는 아이들',
                'composition': '풀샷',
                'lighting': '황금시간대'
            },
            'style': 'watercolor'
        }
    ]
    
    results = []
    
    for test in test_cases:
        print(f"\n📌 테스트: {test['name']}")
        print(f"   설명: {test['frame']['visual_description']}")
        print(f"   스타일: {test['style']}")
        
        # 프롬프트 확인
        prompt = service._create_visual_prompt(test['frame'], test['style'])
        print(f"   프롬프트: {prompt}")
        
        print("   생성 중...")
        
        # 이미지 생성
        result = service.generate_storyboard_image(test['frame'], test['style'])
        
        if result['success']:
            print("   ✅ 생성 성공!")
            
            # 타임스탬프 추가
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{test['name']}_{timestamp}.png"
            
            # 이미지 저장
            saved_path = save_image(result['image_url'], filename)
            
            # 결과 저장
            results.append({
                'test': test['name'],
                'prompt': result.get('prompt_used', prompt),
                'success': True,
                'image_path': saved_path,
                'model': result.get('model_used', 'dall-e-3')
            })
            
            # 프롬프트 분석
            if 'frame' in prompt.lower() or 'scene' in prompt.lower() or 'text' in prompt.lower():
                print("   ⚠️  주의: 금지 단어가 포함되었을 수 있습니다!")
            
        else:
            print(f"   ❌ 생성 실패: {result.get('error', 'Unknown error')}")
            results.append({
                'test': test['name'],
                'prompt': prompt,
                'success': False,
                'error': result.get('error', 'Unknown')
            })
    
    # 결과 요약
    print("\n" + "="*60)
    print("📊 테스트 결과 요약")
    print("="*60)
    
    success_count = sum(1 for r in results if r['success'])
    total_count = len(results)
    
    print(f"\n성공: {success_count}/{total_count}")
    
    # 결과를 JSON으로 저장
    result_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장: {result_file}")
    
    # 프롬프트 개선 제안
    if success_count < total_count:
        print("\n💡 프롬프트 개선 제안:")
        print("1. 더 단순한 프롬프트 시도")
        print("2. 스타일 키워드 변경")
        print("3. 동작 묘사를 더 구체적으로")

if __name__ == "__main__":
    test_dalle_generation()