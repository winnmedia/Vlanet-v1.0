from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from django.db import transaction
import json

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class CreateTestUsers(View):
    def post(self, request):
        """테스트 사용자 생성 엔드포인트"""
        try:
            # 보안을 위해 특정 키 확인
            data = json.loads(request.body)
            secret_key = data.get("secret_key")
            
            # 간단한 보안 체크
            if secret_key != "create-test-users-2024":
                return JsonResponse({"message": "Unauthorized"}, status=401)
            
            created_users = []
            test_users = [
                {
                    "email": "test@example.com",
                    "password": "testpass123",
                    "first_name": "Test",
                    "last_name": "User",
                    "nickname": "테스트유저"
                },
                {
                    "email": "admin@example.com",
                    "password": "adminpass123", 
                    "first_name": "Admin",
                    "last_name": "User",
                    "nickname": "관리자",
                    "is_staff": True,
                    "is_superuser": True
                },
                {
                    "email": "demo@example.com",
                    "password": "demopass123",
                    "first_name": "Demo",
                    "last_name": "User", 
                    "nickname": "데모유저"
                }
            ]
            
            for user_data in test_users:
                email = user_data["email"]
                password = user_data["password"]
                
                try:
                    with transaction.atomic():
                        if User.objects.filter(username=email).exists():
                            user = User.objects.get(username=email)
                            user.set_password(password)
                            user.email = email
                            user.first_name = user_data.get("first_name", "")
                            user.last_name = user_data.get("last_name", "")
                            user.nickname = user_data.get("nickname", "")
                            user.is_active = True
                            if user_data.get("is_staff"):
                                user.is_staff = True
                            if user_data.get("is_superuser"):
                                user.is_superuser = True
                            user.save()
                            created_users.append({"email": email, "status": "updated"})
                        else:
                            user = User.objects.create_user(
                                username=email,
                                email=email,
                                password=password,
                                first_name=user_data.get("first_name", ""),
                                last_name=user_data.get("last_name", ""),
                                is_active=True,
                                is_staff=user_data.get("is_staff", False),
                                is_superuser=user_data.get("is_superuser", False)
                            )
                            user.nickname = user_data.get("nickname", "")
                            user.save()
                            created_users.append({"email": email, "status": "created"})
                            
                except Exception as e:
                    created_users.append({"email": email, "status": "error", "message": str(e)})
            
            return JsonResponse({
                "message": "Test users processed",
                "users": created_users,
                "credentials": [
                    {"email": "test@example.com", "password": "testpass123"},
                    {"email": "admin@example.com", "password": "adminpass123"},
                    {"email": "demo@example.com", "password": "demopass123"}
                ]
            }, status=200)
            
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)