import os
import google.generativeai as genai
from django.conf import settings

# Django 설정 초기화
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
import django
django.setup()

# API 키 확인
api_key = settings.GOOGLE_API_KEY
print(f"API Key: {api_key[:10]}..." if api_key else "API Key not found")

# Gemini 직접 테스트
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

prompt = """
간단한 테스트입니다. "안녕하세요"라고 대답해주세요.
"""

try:
    response = model.generate_content(prompt)
    print("\n✅ Gemini API 응답:")
    print(response.text)
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    print(f"오류 타입: {type(e).__name__}")