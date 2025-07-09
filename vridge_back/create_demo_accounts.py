#!/usr/bin/env python
"""
데모 계정 생성 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from django.contrib.auth.hashers import make_password

def create_demo_accounts():
    """5개의 데모 계정 생성"""
    print("=" * 50)
    print("데모 계정 생성 시작")
    print("=" * 50)
    
    # 데모 계정 정보
    demo_accounts = [
        {
            "username": "demo1@videoplanet.com",
            "nickname": "김영상",
            "password": "demo1234",
            "description": "영상 편집자"
        },
        {
            "username": "demo2@videoplanet.com", 
            "nickname": "이편집",
            "password": "demo1234",
            "description": "프리랜서 에디터"
        },
        {
            "username": "demo3@videoplanet.com",
            "nickname": "박크리에이터",
            "password": "demo1234",
            "description": "콘텐츠 크리에이터"
        },
        {
            "username": "demo4@videoplanet.com",
            "nickname": "최프로듀서",
            "password": "demo1234",
            "description": "영상 프로듀서"
        },
        {
            "username": "demo5@videoplanet.com",
            "nickname": "정디렉터",
            "password": "demo1234",
            "description": "크리에이티브 디렉터"
        }
    ]
    
    created_accounts = []
    
    for account in demo_accounts:
        try:
            # 기존 계정 확인
            if User.objects.filter(username=account["username"]).exists():
                print(f"⚠️  계정이 이미 존재합니다: {account['username']}")
                user = User.objects.get(username=account["username"])
                # 비밀번호 업데이트
                user.password = make_password(account["password"])
                user.save()
                print(f"   비밀번호를 업데이트했습니다.")
            else:
                # 새 계정 생성
                user = User.objects.create(
                    username=account["username"],
                    nickname=account["nickname"],
                    password=make_password(account["password"]),
                    login_method="email",
                    email=account["username"]  # username과 동일하게 설정
                )
                print(f"✅ 계정 생성 완료: {account['username']}")
            
            created_accounts.append({
                "email": account["username"],
                "password": account["password"],
                "nickname": account["nickname"],
                "description": account["description"]
            })
            
        except Exception as e:
            print(f"❌ 계정 생성 실패 ({account['username']}): {e}")
    
    # 결과 출력
    print("\n" + "=" * 50)
    print("생성된 데모 계정 정보")
    print("=" * 50)
    print("\n다음 계정으로 로그인할 수 있습니다:\n")
    
    for i, account in enumerate(created_accounts, 1):
        print(f"{i}. {account['nickname']} - {account['description']}")
        print(f"   이메일: {account['email']}")
        print(f"   비밀번호: {account['password']}")
        print()
    
    # 계정 정보 파일로 저장
    with open("DEMO_ACCOUNTS.md", "w", encoding="utf-8") as f:
        f.write("# VideoPlanet 데모 계정 정보\n\n")
        f.write("다음 계정으로 로그인하여 서비스를 테스트할 수 있습니다.\n\n")
        f.write("## 데모 계정 목록\n\n")
        
        for i, account in enumerate(created_accounts, 1):
            f.write(f"### {i}. {account['nickname']}\n")
            f.write(f"- **설명**: {account['description']}\n")
            f.write(f"- **이메일**: `{account['email']}`\n")
            f.write(f"- **비밀번호**: `{account['password']}`\n\n")
        
        f.write("## 주의사항\n\n")
        f.write("- 이 계정들은 데모/테스트 용도로만 사용하세요.\n")
        f.write("- 실제 서비스에서는 반드시 비밀번호를 변경하세요.\n")
        f.write("- 모든 계정의 초기 비밀번호는 동일합니다.\n")
    
    print("✅ 계정 정보가 DEMO_ACCOUNTS.md 파일에 저장되었습니다.")

if __name__ == "__main__":
    create_demo_accounts()