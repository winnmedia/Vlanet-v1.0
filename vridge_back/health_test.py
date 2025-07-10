#!/usr/bin/env python3
"""
Railway 헬스체크 테스트 스크립트
"""
import os
import sys
import django
import time
import json

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.test import Client
from django.db import connection

def test_health_endpoint():
    """헬스체크 엔드포인트 테스트"""
    print("=== Railway 헬스체크 테스트 ===")
    
    client = Client()
    
    # 1. 간단한 헬스체크 테스트
    print("\n1. 간단한 헬스체크 (/api/health/)")
    try:
        response = client.get('/api/health/')
        print(f"   상태 코드: {response.status_code}")
        print(f"   응답: {response.json()}")
        print(f"   ✅ 성공" if response.status_code == 200 else "   ❌ 실패")
    except Exception as e:
        print(f"   ❌ 오류: {str(e)}")
    
    # 2. 상세 헬스체크 테스트
    print("\n2. 상세 헬스체크 (/api/health-full/)")
    try:
        response = client.get('/api/health-full/')
        print(f"   상태 코드: {response.status_code}")
        data = response.json()
        print(f"   서비스: {data.get('service')}")
        print(f"   상태: {data.get('status')}")
        print(f"   데이터베이스: {data.get('database')}")
        print(f"   환경: {data.get('environment')}")
        print(f"   ✅ 성공" if response.status_code == 200 else "   ❌ 실패")
    except Exception as e:
        print(f"   ❌ 오류: {str(e)}")
    
    # 3. 데이터베이스 연결 테스트
    print("\n3. 데이터베이스 연결 테스트")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        print(f"   ✅ 데이터베이스 연결 성공")
    except Exception as e:
        print(f"   ❌ 데이터베이스 연결 실패: {str(e)}")
    
    # 4. 응답 시간 테스트
    print("\n4. 응답 시간 테스트 (10회)")
    times = []
    for i in range(10):
        start = time.time()
        response = client.get('/api/health/')
        elapsed = (time.time() - start) * 1000  # ms
        times.append(elapsed)
        print(f"   시도 {i+1}: {elapsed:.2f}ms")
    
    avg_time = sum(times) / len(times)
    print(f"   평균 응답 시간: {avg_time:.2f}ms")
    print(f"   {'✅ 양호' if avg_time < 100 else '⚠️ 느림'}")
    
    # 5. 환경변수 확인
    print("\n5. 필수 환경변수 확인")
    env_vars = {
        'SECRET_KEY': bool(os.environ.get('SECRET_KEY')),
        'DATABASE_URL': bool(os.environ.get('DATABASE_URL')),
        'PORT': os.environ.get('PORT', 'Not set'),
        'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')
    }
    
    for var, value in env_vars.items():
        if isinstance(value, bool):
            print(f"   {var}: {'✅ 설정됨' if value else '❌ 없음'}")
        else:
            print(f"   {var}: {value}")
    
    print("\n=== 테스트 완료 ===")

if __name__ == '__main__':
    test_health_endpoint()