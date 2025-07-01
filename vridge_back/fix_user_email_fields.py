import os
import sys
import django

# Django 설정 초기화
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_simple")
django.setup()

from users.models import User
from django.db import transaction

def fix_user_email_fields():
    """email 필드가 비어있는 사용자들 수정"""
    try:
        with transaction.atomic():
            # email이 비어있는 사용자 찾기
            users_without_email = User.objects.filter(email="")
            count = users_without_email.count()
            
            if count == 0:
                print("email 필드가 비어있는 사용자가 없습니다.")
                return
            
            print(f"email 필드가 비어있는 사용자 {count}명 발견")
            print("-" * 50)
            
            fixed_count = 0
            for user in users_without_email:
                # username이 이메일 형식인 경우 email 필드에 복사
                if "@" in user.username:
                    user.email = user.username
                    user.save()
                    print(f"✅ 수정됨: {user.username}")
                    fixed_count += 1
                else:
                    print(f"❌ 건너뜀: {user.username} (이메일 형식이 아님)")
            
            print("-" * 50)
            print(f"총 {fixed_count}명의 사용자 수정 완료")
            
    except Exception as e:
        print(f"오류 발생: {e}")

def check_specific_user(email):
    """특정 사용자 확인"""
    try:
        user = User.objects.get(username=email)
        print(f"\n사용자 정보:")
        print(f"  username: {user.username}")
        print(f"  email: {user.email}")
        print(f"  is_active: {user.is_active}")
        print(f"  date_joined: {user.date_joined}")
        
        if not user.email:
            print(f"\n⚠️  email 필드가 비어있습니다!")
            if "@" in user.username:
                user.email = user.username
                user.save()
                print(f"✅ email 필드를 {user.username}으로 설정했습니다.")
                
    except User.DoesNotExist:
        print(f"사용자를 찾을 수 없습니다: {email}")
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # 특정 사용자 확인
        email = sys.argv[1]
        check_specific_user(email)
    else:
        # 전체 사용자 수정
        fix_user_email_fields()
        
        print("\n특정 사용자를 확인하려면:")
        print("python fix_user_email_fields.py user@example.com")