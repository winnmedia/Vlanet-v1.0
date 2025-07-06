#!/usr/bin/env python
"""
Railway 환경에서 API 키 상태 확인
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

print("=" * 60)
print("🔍 API 키 상태 확인")
print("=" * 60)

# 환경변수에서 직접 확인
env_key = os.environ.get('OPENAI_API_KEY', '')
print(f"1. os.environ.get('OPENAI_API_KEY'): {'설정됨' if env_key else '없음'}")
if env_key:
    print(f"   키 시작 부분: {env_key[:10]}...")

# Django 설정 확인
django.setup()
from django.conf import settings

settings_key = getattr(settings, 'OPENAI_API_KEY', '')
print(f"\n2. settings.OPENAI_API_KEY: {'설정됨' if settings_key else '없음'}")
if settings_key:
    print(f"   키 시작 부분: {settings_key[:10]}...")

# DalleService 초기화 테스트
print("\n3. DalleService 초기화 테스트:")
try:
    from video_planning.dalle_service import DalleService
    service = DalleService()
    print(f"   - 서비스 사용 가능: {service.available}")
    print(f"   - API 키 설정: {'있음' if service.api_key else '없음'}")
    if service.api_key:
        print(f"   - 키 시작 부분: {service.api_key[:10]}...")
except Exception as e:
    print(f"   ❌ 초기화 실패: {e}")

print("\n" + "=" * 60)