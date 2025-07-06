#!/usr/bin/env python
import requests
import json

API_BASE_URL = "https://videoplanet.up.railway.app"
LOCAL_URL = "http://localhost:8000"

def test_improved_prompts(base_url=API_BASE_URL):
    """개선된 프롬프트 생성 테스트"""
    
    test_cases = [
        {
            "description": "카페에 들어가는 남자",
            "style": "minimal"
        },
        {
            "description": "비오는 밤 거리를 걷는 여성",
            "style": "detailed"
        },
        {
            "description": "A man walking into a coffee shop",
            "style": "artistic"
        },
        {
            "description": "햇살이 비치는 공원에서 책을 읽는 노인",
            "style": "cinematic"
        }
    ]
    
    endpoint = f"{base_url}/api/video-planning/test-improved-prompts/"
    
    print(f"테스트 엔드포인트: {endpoint}\n")
    print("=" * 80)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n테스트 케이스 {i}:")
        print(f"입력: {test_case['description']}")
        print(f"스타일: {test_case['style']}")
        
        try:
            response = requests.post(endpoint, json=test_case)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'success':
                    print("\n✅ 성공:")
                    print(f"  - 원본: {data['input']['original']}")
                    print(f"  - 영어 여부: {data['processing']['is_english']}")
                    
                    if data['processing']['translated']:
                        print(f"  - 번역: {data['processing']['translated']}")
                    
                    print(f"\n  📝 개선된 프롬프트:")
                    print(f"  {data['output']['improved_prompt']}")
                    
                    print(f"\n  🎨 스타일 파라미터:")
                    params = data['output']['style_parameters']
                    print(f"  - Quality: {params['quality']}")
                    print(f"  - Style: {params['style']}")
                    print(f"  - Additional: {params['additional_prompt']}")
                else:
                    print(f"\n❌ 실패: {data.get('message', 'Unknown error')}")
            else:
                print(f"\n❌ HTTP 오류: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"\n❌ 요청 실패: {str(e)}")
        
        print("\n" + "-" * 80)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "local":
        print("로컬 서버에서 테스트합니다...")
        test_improved_prompts(LOCAL_URL)
    else:
        print("프로덕션 서버에서 테스트합니다...")
        test_improved_prompts(API_BASE_URL)