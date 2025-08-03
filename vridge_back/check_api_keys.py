#!/usr/bin/env python
"""API 키 설정 확인 스크립트"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')
django.setup()

from django.conf import settings

print("=" * 50)
print("API 키 설정 확인")
print("=" * 50)

# Gemini API 키 확인
google_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
if google_key:
    print(f"✅ GOOGLE_API_KEY: {google_key[:10]}...{google_key[-4:]}")
else:
    print("❌ GOOGLE_API_KEY: 설정되지 않음")

# EXAONE API 키 확인
exaone_key = getattr(settings, 'EXAONE_API_KEY', None) or os.environ.get('EXAONE_API_KEY')
if exaone_key and exaone_key != 'your_exaone_api_key_here':
    print(f"✅ EXAONE_API_KEY: {exaone_key[:10]}...{exaone_key[-4:]}")
else:
    print("❌ EXAONE_API_KEY: 설정되지 않음 또는 기본값")

print("\n서비스 사용 가능 여부:")
print(f"- Gemini 서비스: {'사용 가능' if google_key else '사용 불가'}")
print(f"- EXAONE 서비스: {'사용 가능' if exaone_key and exaone_key != 'your_exaone_api_key_here' else '사용 불가'}")

if exaone_key and exaone_key != 'your_exaone_api_key_here':
    print("\n✅ 하이브리드 모드 활성화: EXAONE(텍스트) + Gemini(이미지)")
else:
    print("\n⚠️  Gemini 전용 모드: 모든 생성에 Gemini 사용")