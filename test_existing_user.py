#!/usr/bin/env python3
"""
기존 사용자로 테스트
"""
import requests
import json

BASE_URL = "https://videoplanet.up.railway.app"
FRONTEND_ORIGIN = "https://vlanet.net"

# 기존에 생성된 사용자
existing_user = {
    "email": "test_1751372840@example.com",
    "password": "TestPassword123!"
}

def test_login():
    """로그인 테스트"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    response = requests.post(f"{BASE_URL}/users/login", headers=headers, json=existing_user)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code in [200, 201]:
        data = response.json()
        token = data.get("vridge_session")
        print(f"\nToken: {token}")
        return token
    return None

def test_auth_endpoint(token):
    """인증된 엔드포인트 테스트"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": FRONTEND_ORIGIN
    }
    response = requests.get(f"{BASE_URL}/projects/project_list", headers=headers)
    print(f"\nProject List Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")

def test_email_send():
    """이메일 발송 테스트 (새 이메일로)"""
    headers = {
        "Content-Type": "application/json",
        "Origin": FRONTEND_ORIGIN
    }
    data = {"email": "newtest@example.com"}
    response = requests.post(f"{BASE_URL}/users/send_authnumber/signup", headers=headers, json=data)
    print(f"\nEmail Send Status: {response.status_code}")
    print(f"Response: {response.json()}")

print("=== 기존 사용자 테스트 ===")
token = test_login()

if token:
    test_auth_endpoint(token)

test_email_send()