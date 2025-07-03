import re
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class InputValidator:
    """입력 검증을 위한 유틸리티 클래스"""
    
    # 이메일 정규식 (RFC 5322 표준에 가까운 검증)
    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # 비밀번호 정책
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_MAX_LENGTH = 128
    
    @classmethod
    def validate_email(cls, email):
        """
        이메일 유효성 검증
        Returns: (is_valid: bool, error_message: str or None)
        """
        if not email:
            return False, "이메일을 입력해주세요."
        
        if len(email) > 254:  # RFC 5321 표준
            return False, "이메일이 너무 깁니다. (최대 254자)"
        
        # 기본 형식 검증
        if not cls.EMAIL_REGEX.match(email):
            return False, "올바른 이메일 형식이 아닙니다."
        
        # 도메인 부분 검증
        local_part, domain = email.rsplit('@', 1)
        
        # 로컬 부분 길이 검증 (RFC 5321)
        if len(local_part) > 64:
            return False, "이메일 사용자명이 너무 깁니다. (최대 64자)"
        
        # 연속된 점 검증
        if '..' in email:
            return False, "올바른 이메일 형식이 아닙니다."
        
        # 시작/끝 점 검증
        if local_part.startswith('.') or local_part.endswith('.'):
            return False, "올바른 이메일 형식이 아닙니다."
        
        # XSS 패턴 검증
        xss_patterns = ['<script', 'javascript:', 'onload=', 'onerror=', '<iframe']
        for pattern in xss_patterns:
            if pattern.lower() in email.lower():
                return False, "이메일에 허용되지 않는 문자가 포함되어 있습니다."
        
        return True, None
    
    @classmethod
    def validate_password(cls, password):
        """
        비밀번호 유효성 검증
        Returns: (is_valid: bool, error_message: str or None)
        """
        if not password:
            return False, "비밀번호를 입력해주세요."
        
        # 길이 검증
        if len(password) < cls.PASSWORD_MIN_LENGTH:
            return False, f"비밀번호는 최소 {cls.PASSWORD_MIN_LENGTH}자 이상이어야 합니다."
        
        if len(password) > cls.PASSWORD_MAX_LENGTH:
            return False, f"비밀번호는 최대 {cls.PASSWORD_MAX_LENGTH}자까지 가능합니다."
        
        # 복잡도 검증
        has_upper = re.search(r'[A-Z]', password)
        has_lower = re.search(r'[a-z]', password)
        has_digit = re.search(r'\d', password)
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
        
        missing_requirements = []
        if not has_upper:
            missing_requirements.append("대문자")
        if not has_lower:
            missing_requirements.append("소문자")
        if not has_digit:
            missing_requirements.append("숫자")
        if not has_special:
            missing_requirements.append("특수문자")
        
        if len(missing_requirements) > 1:  # 4개 중 최소 3개 요구사항 충족
            return False, f"비밀번호는 다음 중 최소 3가지를 포함해야 합니다: 대문자, 소문자, 숫자, 특수문자"
        
        # 동일 문자 반복 검증 (3회 이상 연속 반복 금지)
        if re.search(r'(.)\1{2,}', password):
            return False, "동일한 문자를 3회 이상 연속으로 사용할 수 없습니다."
        
        # 순차적 패턴 검증
        sequential_patterns = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'bcd', 'cde']
        for pattern in sequential_patterns:
            if pattern in password.lower():
                return False, "순차적인 문자열을 사용할 수 없습니다."
        
        return True, None
    
    @classmethod
    def validate_text_input(cls, text, field_name, max_length=1000):
        """
        일반 텍스트 입력 검증
        Returns: (is_valid: bool, error_message: str or None)
        """
        if not text:
            return False, f"{field_name}을(를) 입력해주세요."
        
        if len(text) > max_length:
            return False, f"{field_name}은(는) 최대 {max_length}자까지 입력 가능합니다."
        
        # XSS 패턴 검증
        xss_patterns = [
            '<script', '</script>', 'javascript:', 'onload=', 'onerror=', 
            '<iframe', 'eval(', 'alert(', 'document.cookie'
        ]
        for pattern in xss_patterns:
            if pattern.lower() in text.lower():
                return False, f"{field_name}에 허용되지 않는 스크립트가 포함되어 있습니다."
        
        return True, None


def validate_request_data(required_fields=None, optional_fields=None):
    """
    요청 데이터 검증 데코레이터
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            try:
                import json
                if request.method in ['POST', 'PUT', 'PATCH']:
                    data = json.loads(request.body)
                elif request.method == 'GET':
                    data = request.GET.dict()
                else:
                    data = {}
                
                # 필수 필드 검증
                if required_fields:
                    for field in required_fields:
                        if field not in data or not data[field]:
                            return JsonResponse({
                                'error': f'{field} 필드가 필요합니다.',
                                'code': 'MISSING_REQUIRED_FIELD'
                            }, status=400)
                
                # 이메일 필드 검증
                if 'email' in data:
                    is_valid, error_msg = InputValidator.validate_email(data['email'])
                    if not is_valid:
                        return JsonResponse({
                            'error': error_msg,
                            'code': 'INVALID_EMAIL'
                        }, status=400)
                
                # 비밀번호 필드 검증
                if 'password' in data:
                    is_valid, error_msg = InputValidator.validate_password(data['password'])
                    if not is_valid:
                        return JsonResponse({
                            'error': error_msg,
                            'code': 'INVALID_PASSWORD'
                        }, status=400)
                
                return view_func(request, *args, **kwargs)
                
            except json.JSONDecodeError:
                return JsonResponse({
                    'error': '잘못된 JSON 형식입니다.',
                    'code': 'INVALID_JSON'
                }, status=400)
            except Exception as e:
                logger.error(f"Request validation error: {str(e)}")
                return JsonResponse({
                    'error': '요청 처리 중 오류가 발생했습니다.',
                    'code': 'VALIDATION_ERROR'
                }, status=400)
        
        return wrapper
    return decorator