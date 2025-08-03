#!/usr/bin/env python
"""Hugging Face EXAONE API 테스트 스크립트"""
import os
import sys
import django
import requests

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from django.conf import settings

# API 키 확인
hf_api_key = getattr(settings, 'HUGGINGFACE_API_KEY', None) or os.environ.get('HUGGINGFACE_API_KEY')

print("=" * 60)
print("Hugging Face EXAONE API 테스트")
print("=" * 60)

if not hf_api_key or hf_api_key == 'your_huggingface_api_key_here':
    print("❌ Hugging Face API 키가 설정되지 않았습니다.")
    print("\n📝 API 키 받는 방법:")
    print("1. https://huggingface.co/ 접속")
    print("2. 회원가입 또는 로그인")
    print("3. 우측 상단 프로필 클릭 → Settings")
    print("4. Access Tokens 메뉴 클릭")
    print("5. 'New token' 클릭")
    print("6. Token name: VideoPlanet")
    print("7. Token type: Read (읽기 전용)")
    print("8. 생성된 토큰 복사")
    print("\n📋 .env 파일에 추가:")
    print("HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx")
    sys.exit(1)

print(f"✅ API 키 확인: {hf_api_key[:10]}...{hf_api_key[-4:]}")

# 모델 정보
model_id = "LGAI-EXAONE/EXAONE-4.0-32B"
api_url = f"https://api-inference.huggingface.co/models/{model_id}"

print(f"\n🔍 모델 테스트: {model_id}")

# 간단한 테스트 요청
headers = {
    "Authorization": f"Bearer {hf_api_key}",
    "Content-Type": "application/json"
}

# EXAONE 프롬프트 형식
prompt = "[|system|]당신은 친절한 AI 어시스턴트입니다.[|endofturn|]\n[|user|]안녕하세요. 간단히 자기소개를 해주세요.[|endofturn|]\n[|assistant|]"

data = {
    "inputs": prompt,
    "parameters": {
        "temperature": 0.7,
        "max_new_tokens": 150,
        "top_p": 0.9,
        "do_sample": True,
        "return_full_text": False
    }
}

print("\n🔄 API 요청 중...")

try:
    response = requests.post(api_url, headers=headers, json=data, timeout=30)
    
    print(f"\n📡 응답 상태: {response.status_code}")
    
    if response.status_code == 503:
        print("\n⏳ 모델이 로딩 중입니다. 잠시 후 다시 시도해주세요.")
        print("   (첫 요청 시 모델 로딩에 20-30초가 걸릴 수 있습니다)")
        
    elif response.status_code == 200:
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get('generated_text', '')
            print(f"\n✅ API 테스트 성공!")
            print(f"응답: {generated_text}")
        else:
            print(f"\n⚠️  응답 형식이 예상과 다릅니다: {result}")
            
    else:
        print(f"\n❌ API 오류: {response.text}")
        
        if response.status_code == 401:
            print("\n💡 API 키가 올바르지 않습니다. 다시 확인해주세요.")
        elif response.status_code == 429:
            print("\n💡 API 요청 한도를 초과했습니다.")
        
except requests.exceptions.Timeout:
    print("\n❌ 요청 시간 초과 (30초)")
    print("💡 모델이 처음 로딩되는 경우 시간이 걸릴 수 있습니다.")
    
except Exception as e:
    print(f"\n❌ 요청 실패: {str(e)}")

print("\n" + "=" * 60)
print("테스트 완료")
print("=" * 60)

# 서비스 통합 테스트
print("\n📦 서비스 통합 테스트...")
try:
    from video_planning.huggingface_exaone_service import HuggingFaceExaoneService
    
    service = HuggingFaceExaoneService()
    if service.available:
        print("✅ HuggingFaceExaoneService 초기화 성공")
        
        # 간단한 스토리 생성 테스트
        test_result = service.generate_stories_from_planning(
            "영화관에서 팝콘을 먹는 즐거움에 대한 짧은 영상",
            {"genre": "일상", "tone": "유쾌한"}
        )
        
        if test_result:
            print("✅ 스토리 생성 테스트 성공")
        else:
            print("⚠️  스토리 생성 테스트 실패")
    else:
        print("❌ HuggingFaceExaoneService 사용 불가 (API 키 없음)")
        
except Exception as e:
    print(f"❌ 서비스 테스트 실패: {str(e)}")

print("\n💡 API가 정상 작동하면 VideoPlanet에서 텍스트 생성 시 HF EXAONE이 사용됩니다.")