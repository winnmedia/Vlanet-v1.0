#!/usr/bin/env python
"""Gemini API 직접 테스트 - 403 오류 해결"""
import os
import sys
import google.generativeai as genai

# API 키 설정
api_key = os.environ.get('GOOGLE_API_KEY', 'AIzaSyAIc-MPLtFJah3Kvy8vDaprrUefOP4sryk')
print(f"API Key: {api_key[:10]}...{api_key[-4:]}")

# Configure API
genai.configure(api_key=api_key)

# 모델 리스트 확인
print("\n사용 가능한 모델:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"모델 리스트 오류: {e}")

# 간단한 테스트
print("\n간단한 테스트:")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("안녕하세요를 영어로 번역해주세요")
    print(f"성공: {response.text}")
except Exception as e:
    print(f"오류: {e}")
    
    # 오류가 403이면 다른 방법 시도
    if "403" in str(e):
        print("\n대체 방법 시도...")
        try:
            # 다른 모델 시도
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("안녕하세요를 영어로 번역해주세요")
            print(f"gemini-pro 성공: {response.text}")
        except Exception as e2:
            print(f"gemini-pro도 실패: {e2}")

# API 키 정보 확인
print("\n\nAPI 키 문제 해결 방법:")
print("1. Google AI Studio (https://aistudio.google.com/apikey) 에서 새 API 키 생성")
print("2. API 키 제한사항 확인:")
print("   - Application restrictions: None")
print("   - API restrictions: None 또는 Generative Language API만 허용")
print("3. 새 API 키를 .env 파일에 업데이트")
print("4. export GOOGLE_API_KEY='새로운API키' 실행")