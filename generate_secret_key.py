#!/usr/bin/env python3
"""
Django SECRET_KEY 생성 스크립트
Railway 환경변수에 사용할 안전한 SECRET_KEY를 생성합니다.
"""

import random
import string
import secrets

def generate_secret_key_method1():
    """Django 스타일의 SECRET_KEY 생성"""
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(random.SystemRandom().choice(chars) for _ in range(50))

def generate_secret_key_method2():
    """Python secrets 모듈을 사용한 안전한 키 생성"""
    return secrets.token_urlsafe(50)

def generate_secret_key_method3():
    """Django의 get_random_secret_key 함수 재구현"""
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
    return 'django-insecure-' + ''.join(secrets.choice(chars) for _ in range(50))

if __name__ == "__main__":
    print("=== Django SECRET_KEY 생성기 ===\n")
    
    print("방법 1 - Django 스타일 (특수문자 포함):")
    key1 = generate_secret_key_method1()
    print(f"{key1}\n")
    
    print("방법 2 - URL 안전 토큰:")
    key2 = generate_secret_key_method2()
    print(f"{key2}\n")
    
    print("방법 3 - Django 기본 형식:")
    key3 = generate_secret_key_method3()
    print(f"{key3}\n")
    
    print("=" * 50)
    print("\n사용 방법:")
    print("1. 위의 키 중 하나를 복사하세요")
    print("2. Railway 대시보드 → Settings → Variables로 이동")
    print("3. 'Add Variable' 클릭")
    print("4. Name: SECRET_KEY")
    print("5. Value: 위에서 복사한 키 붙여넣기")
    print("6. 'Save' 클릭\n")
    
    print("⚠️  주의사항:")
    print("- 이 키는 절대 공개하면 안 됩니다")
    print("- 각 환경(개발/운영)마다 다른 키를 사용하세요")
    print("- 키를 변경하면 기존 세션이 무효화됩니다")