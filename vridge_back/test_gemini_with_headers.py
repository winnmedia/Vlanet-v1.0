#!/usr/bin/env python
"""Gemini API 테스트 - 헤더 포함"""
import os
import requests
import json

api_key = os.environ.get('GOOGLE_API_KEY', 'AIzaSyAIc-MPLtFJah3Kvy8vDaprrUefOP4sryk')
print(f"API Key: {api_key[:10]}...{api_key[-4:]}")

# REST API 직접 호출
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

headers = {
    "Content-Type": "application/json",
    "Referer": "http://localhost:3000",  # 로컬호스트 referer 추가
    "Origin": "http://localhost:3000"
}

data = {
    "contents": [{
        "parts": [{
            "text": "안녕하세요를 영어로 번역해주세요"
        }]
    }]
}

print("\nREST API로 테스트 (헤더 포함):")
try:
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 성공: {result['candidates'][0]['content']['parts'][0]['text']}")
    else:
        print(f"❌ 실패: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"오류: {e}")

# 다른 referer 시도
headers["Referer"] = "https://localhost"
headers["Origin"] = "https://localhost"

print("\nHTTPS localhost referer로 재시도:")
try:
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 성공: {result['candidates'][0]['content']['parts'][0]['text']}")
    else:
        print(f"❌ 실패: {response.status_code}")
        print(response.text[:200])
except Exception as e:
    print(f"오류: {e}")