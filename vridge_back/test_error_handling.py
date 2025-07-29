#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
에러 처리 미들웨어 및 데코레이터 테스트 스크립트
"""
import os
import sys
import django
import json
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client
from django.urls import reverse
from users.models import User


def print_result(test_name, response):
    """테스트 결과 출력"""
    print(f"\n{'='*60}")
    print(f"Test: {test_name}")
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.get('Content-Type')}")
    
    try:
        data = json.loads(response.content)
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.content}")


def test_error_handling():
    """에러 처리 테스트"""
    client = Client()
    
    # 1. JSON 파싱 에러 테스트
    print("\n### 1. JSON 파싱 에러 테스트 ###")
    response = client.post(
        '/api/users/check-email/',
        data='{"invalid json}',
        content_type='application/json'
    )
    print_result("Invalid JSON", response)
    
    # 2. 필수 필드 누락 테스트
    print("\n### 2. 필수 필드 누락 테스트 ###")
    response = client.post(
        '/api/users/check-email/',
        data=json.dumps({}),
        content_type='application/json'
    )
    print_result("Missing Required Field", response)
    
    # 3. 유효성 검증 실패 테스트
    print("\n### 3. 유효성 검증 실패 테스트 ###")
    response = client.post(
        '/api/users/check-email/',
        data=json.dumps({"email": "invalid-email"}),
        content_type='application/json'
    )
    print_result("Invalid Email Format", response)
    
    # 4. 중복 데이터 테스트 (이메일이 이미 존재하는 경우)
    print("\n### 4. 중복 데이터 테스트 ###")
    # 먼저 사용자 생성
    try:
        test_user = User.objects.create_user(
            email="test@example.com",
            password="Test1234!",
            name="Test User"
        )
        
        response = client.post(
            '/api/users/check-email/',
            data=json.dumps({"email": "test@example.com"}),
            content_type='application/json'
        )
        print_result("Duplicate Email", response)
    except:
        pass
    
    # 5. 성공 응답 테스트
    print("\n### 5. 성공 응답 테스트 ###")
    response = client.post(
        '/api/users/check-email/',
        data=json.dumps({"email": "newuser@example.com"}),
        content_type='application/json'
    )
    print_result("Success Response", response)
    
    # 6. 404 Not Found 테스트
    print("\n### 6. 404 Not Found 테스트 ###")
    response = client.post('/api/nonexistent-endpoint/')
    print_result("404 Not Found", response)
    
    # 7. 인증 필요 엔드포인트 테스트 (401)
    print("\n### 7. 인증 실패 테스트 ###")
    response = client.get('/api/users/me/')
    print_result("Authentication Required", response)
    
    # 8. Content-Type 검증 테스트
    print("\n### 8. Content-Type 검증 테스트 ###")
    response = client.post(
        '/api/users/check-email/',
        data='email=test@example.com',
        content_type='application/x-www-form-urlencoded'
    )
    print_result("Invalid Content-Type", response)
    
    # 9. 로그인 실패 테스트 (잘못된 비밀번호)
    print("\n### 9. 로그인 실패 테스트 ###")
    response = client.post(
        '/api/users/signin/',
        data=json.dumps({
            "email": "test@example.com",
            "password": "WrongPassword"
        }),
        content_type='application/json'
    )
    print_result("Login Failed - Wrong Password", response)
    
    # 10. 로그인 실패 테스트 (존재하지 않는 사용자)
    print("\n### 10. 존재하지 않는 사용자 로그인 테스트 ###")
    response = client.post(
        '/api/users/signin/',
        data=json.dumps({
            "email": "nonexistent@example.com",
            "password": "Test1234!"
        }),
        content_type='application/json'
    )
    print_result("Login Failed - User Not Found", response)
    
    print("\n" + "="*60)
    print("에러 처리 테스트 완료!")
    print("="*60)


def test_response_standardization():
    """응답 표준화 테스트"""
    client = Client()
    
    print("\n\n### 응답 표준화 테스트 ###")
    
    # 성공 응답이 표준화되는지 확인
    response = client.get('/api/health/')
    print_result("Health Check - Standardized Response", response)
    
    # 실제 API 엔드포인트로 테스트 (프로젝트 목록 등)
    # 인증이 필요한 경우 토큰을 추가해야 함


if __name__ == "__main__":
    print("VideoPlanet 백엔드 에러 처리 테스트")
    print("="*60)
    print(f"테스트 시작: {datetime.now()}")
    
    try:
        test_error_handling()
        test_response_standardization()
    except Exception as e:
        print(f"\n테스트 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print(f"\n테스트 종료: {datetime.now()}")