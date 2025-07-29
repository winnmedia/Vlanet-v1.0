# -*- coding: utf-8 -*-
"""
표준화된 에러 처리를 사용하는 View 예시
"""
import json
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from common.decorators import handle_errors, validate_json_request, standardize_response, APIResponse
from common.exceptions import APIException
from users.utils import user_validator


class ExampleView1(View):
    """
    데코레이터를 사용한 에러 처리 예시
    """
    
    @method_decorator(csrf_exempt, name='dispatch')
    @method_decorator(handle_errors)
    @method_decorator(validate_json_request(required_fields=['email', 'name']))
    def post(self, request):
        # request.json_data는 validate_json_request에서 자동으로 추가됨
        data = request.json_data
        
        # 비즈니스 로직
        if '@' not in data['email']:
            return APIResponse.bad_request("유효하지 않은 이메일 형식입니다.")
        
        # 성공 응답
        return APIResponse.created(
            data={"user_id": 123, "email": data['email']},
            message="사용자가 생성되었습니다."
        )


class ExampleView2(View):
    """
    APIException 클래스를 사용한 예시
    """
    
    @method_decorator(user_validator)
    def get(self, request):
        # 파라미터 검증
        user_id = request.GET.get('user_id')
        if not user_id:
            return APIException.bad_request("user_id 파라미터가 필요합니다.")
        
        # 데이터베이스 조회 시뮬레이션
        if user_id == "999":
            return APIException.not_found("사용자를 찾을 수 없습니다.")
        
        # 권한 검증
        if user_id != str(request.user.id):
            return APIException.forbidden("다른 사용자의 정보를 조회할 수 없습니다.")
        
        # 성공 응답
        return APIException.success(data={
            "user": {
                "id": user_id,
                "email": request.user.email,
                "name": request.user.name
            }
        })


class ExampleView3(View):
    """
    표준화된 응답 데코레이터 사용 예시
    """
    
    @method_decorator(standardize_response)
    def get(self, request):
        # 간단히 dict를 반환하면 자동으로 표준화된 응답으로 변환됨
        return {
            "products": [
                {"id": 1, "name": "Product A", "price": 10000},
                {"id": 2, "name": "Product B", "price": 20000}
            ],
            "total": 2
        }
    
    @method_decorator(standardize_response)
    def post(self, request):
        # 상태 코드와 함께 반환할 수도 있음
        return {"message": "Product created", "id": 123}, 201


class ExampleView4(View):
    """
    미들웨어가 자동으로 처리하는 예외 예시
    """
    
    def get(self, request):
        # 이 예외들은 ErrorHandlerMiddleware가 자동으로 처리함
        
        # ValidationError 예시
        from django.core.exceptions import ValidationError
        if request.GET.get('test') == 'validation':
            raise ValidationError({'email': ['이메일 형식이 올바르지 않습니다.']})
        
        # ObjectDoesNotExist 예시
        if request.GET.get('test') == 'not_found':
            from django.core.exceptions import ObjectDoesNotExist
            raise ObjectDoesNotExist("User matching query does not exist.")
        
        # PermissionDenied 예시
        if request.GET.get('test') == 'permission':
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("이 작업을 수행할 권한이 없습니다.")
        
        # IntegrityError 예시 (중복 데이터)
        if request.GET.get('test') == 'duplicate':
            from django.db import IntegrityError
            raise IntegrityError("UNIQUE constraint failed: users_user.email")
        
        return APIResponse.success({"message": "Test endpoint"})