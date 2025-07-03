#!/usr/bin/env python3
"""
Django SECRET_KEY 생성 스크립트
"""
import secrets
import string

def generate_secret_key(length=50):
    """안전한 SECRET_KEY 생성"""
    # 사용할 문자: 영문 대소문자, 숫자, 특수문자
    characters = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    
    # 랜덤하게 선택하여 키 생성
    secret_key = ''.join(secrets.choice(characters) for _ in range(length))
    
    return secret_key

if __name__ == "__main__":
    print("=== Django SECRET_KEY 생성기 ===\n")
    
    # 3개의 다른 키 생성
    for i in range(3):
        key = generate_secret_key()
        print(f"옵션 {i+1}:")
        print(f"{key}\n")
    
    print("위 키 중 하나를 선택하여 Railway 환경 변수에 설정하세요.")
    print("설정 방법: Railway Dashboard > Variables > SECRET_KEY")