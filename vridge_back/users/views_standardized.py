# -*- coding: utf-8 -*-
"""
표준화된 에러 처리를 적용한 User Views
기존 views.py를 점진적으로 이 패턴으로 마이그레이션
"""
import json
import logging
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from common.decorators import handle_errors, validate_json_request, APIResponse
from common.exceptions import APIException
from .validators import InputValidator
from .utils import user_validator, auth_send_email
from . import models
from config.csrf_migration import csrf_protect_if_enabled

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class CheckEmailStandardized(View):
    """표준화된 이메일 중복 확인"""
    
    @handle_errors
    @validate_json_request(required_fields=['email'])
    def post(self, request):
        data = request.json_data
        email = data.get("email")
        
        # 이메일 유효성 검증
        is_valid, error_message = InputValidator.validate_email(email)
        if not is_valid:
            return APIResponse.bad_request(error_message)
        
        # 중복 확인
        if models.User.objects.filter(email=email).exists():
            return APIResponse.conflict("이미 사용중인 이메일입니다.")
        
        return APIResponse.success({"available": True, "email": email})


@method_decorator(csrf_protect_if_enabled, name='dispatch')
class SignInStandardized(View):
    """표준화된 로그인"""
    
    @handle_errors
    @validate_json_request(required_fields=['email', 'password'])
    def post(self, request):
        data = request.json_data
        email = data.get("email")
        password = data.get("password")
        
        # 입력값 검증
        is_valid, error_message = InputValidator.validate_email(email)
        if not is_valid:
            return APIResponse.bad_request(error_message)
        
        is_valid, error_message = InputValidator.validate_password(password)
        if not is_valid:
            return APIResponse.bad_request(error_message)
        
        # 사용자 인증
        user = authenticate(email=email, password=password)
        
        if not user:
            # 사용자 존재 여부 확인
            if not models.User.objects.filter(email=email).exists():
                return APIResponse.not_found("등록되지 않은 이메일입니다.")
            return APIResponse.unauthorized("비밀번호가 일치하지 않습니다.")
        
        # 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return APIResponse.success({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "login_method": user.login_method,
            },
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        })


@method_decorator(csrf_protect_if_enabled, name='dispatch')
class SignUpStandardized(View):
    """표준화된 회원가입"""
    
    @handle_errors
    @validate_json_request(required_fields=['email', 'password', 'name'])
    def post(self, request):
        data = request.json_data
        
        # 입력값 검증
        validations = [
            InputValidator.validate_email(data.get('email')),
            InputValidator.validate_password(data.get('password')),
            InputValidator.validate_name(data.get('name'))
        ]
        
        for is_valid, error_message in validations:
            if not is_valid:
                return APIResponse.bad_request(error_message)
        
        # 이메일 중복 확인
        if models.User.objects.filter(email=data['email']).exists():
            return APIResponse.conflict("이미 사용중인 이메일입니다.")
        
        try:
            # 사용자 생성
            user = models.User.objects.create_user(
                email=data['email'],
                password=data['password'],
                name=data['name'],
                login_method='email'
            )
            
            # 인증 이메일 발송
            auth_send_email(user)
            
            return APIResponse.created({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name
                },
                "message": "회원가입이 완료되었습니다. 이메일을 확인해주세요."
            })
            
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            return APIResponse.internal_error("회원가입 처리 중 오류가 발생했습니다.")


class GetUserInfoStandardized(View):
    """표준화된 사용자 정보 조회"""
    
    @method_decorator(user_validator)
    @handle_errors
    def get(self, request):
        user = request.user
        
        return APIResponse.success({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "login_method": user.login_method,
                "created_at": user.created_at.isoformat(),
                "is_verified": user.is_verified
            }
        })


class UpdateUserInfoStandardized(View):
    """표준화된 사용자 정보 수정"""
    
    @method_decorator(user_validator)
    @handle_errors
    @validate_json_request()
    def patch(self, request):
        user = request.user
        data = request.json_data
        
        # 수정 가능한 필드만 처리
        updatable_fields = ['name', 'phone', 'company', 'position']
        updated_fields = []
        
        for field in updatable_fields:
            if field in data:
                value = data[field]
                
                # 필드별 검증
                if field == 'name':
                    is_valid, error_message = InputValidator.validate_name(value)
                    if not is_valid:
                        return APIResponse.bad_request(error_message)
                
                setattr(user, field, value)
                updated_fields.append(field)
        
        if updated_fields:
            user.save(update_fields=updated_fields)
            return APIResponse.success({
                "message": "사용자 정보가 수정되었습니다.",
                "updated_fields": updated_fields
            })
        
        return APIResponse.bad_request("수정할 필드를 입력해주세요.")