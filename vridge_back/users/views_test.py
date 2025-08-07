# -*- coding: utf-8 -*-
"""
테스트용 단순 회원가입 뷰
"""
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class TestSignUp(View):
    """최소한의 테스트 회원가입"""
    
    def post(self, request):
        try:
            # 단순 테스트 응답
            return JsonResponse({
                "message": "Test signup endpoint working",
                "status": "ok"
            }, status=200)
        except Exception as e:
            return JsonResponse({
                "message": f"Error: {str(e)}",
                "status": "error"
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class TestCreate(View):
    """실제 사용자 생성 테스트"""
    
    def post(self, request):
        try:
            from .models import User
            from django.utils import timezone
            
            # 요청 데이터 파싱
            if request.body:
                data = json.loads(request.body)
                email = data.get('email', f'test{timezone.now().timestamp()}@test.com')
                nickname = data.get('nickname', f'test{int(timezone.now().timestamp())}')
                password = data.get('password', 'Test1234!')
            else:
                # 기본값 사용
                timestamp = int(timezone.now().timestamp())
                email = f'test{timestamp}@test.com'
                nickname = f'test{timestamp}'
                password = 'Test1234!'
            
            # 사용자 생성 시도
            try:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password
                )
                user.nickname = nickname
                user.login_method = 'email'
                user.email_verified = True
                user.email_verified_at = timezone.now()
                user.save()
                
                return JsonResponse({
                    "message": "User created successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "nickname": user.nickname
                    }
                }, status=201)
            except Exception as create_error:
                return JsonResponse({
                    "message": f"User creation error: {str(create_error)}",
                    "type": type(create_error).__name__
                }, status=500)
                
        except Exception as e:
            return JsonResponse({
                "message": f"General error: {str(e)}",
                "type": type(e).__name__
            }, status=500)