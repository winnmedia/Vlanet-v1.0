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
        비밀번호 유효성 검증 (사용자 친화적으로 완화)
        Returns: (is_valid: bool, error_message: str or None)
        """
        if not password:
            return False, "비밀번호를 입력해주세요."
        
        # 길이 검증
        if len(password) < cls.PASSWORD_MIN_LENGTH:
            return False, f"비밀번호는 최소 {cls.PASSWORD_MIN_LENGTH}자 이상이어야 합니다."
        
        if len(password) > cls.PASSWORD_MAX_LENGTH:
            return False, f"비밀번호는 최대 {cls.PASSWORD_MAX_LENGTH}자까지 가능합니다."
        
        # 사용자 친화적 비밀번호 정책
        # 옵션 1: 문자 + 숫자
        # 옵션 2: 문자 + 특수문자
        # 옵션 3: 숫자 + 특수문자
        has_letter = bool(re.search(r'[A-Za-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=]', password))
        
        # 최소 2가지 타입만 있으면 OK
        type_count = sum([has_letter, has_digit, has_special])
        
        if type_count < 2:
            if has_letter and not has_digit and not has_special:
                return False, "비밀번호에 숫자나 특수문자를 추가해주세요."
            elif has_digit and not has_letter and not has_special:
                return False, "비밀번호에 문자나 특수문자를 추가해주세요."
            else:
                return False, "비밀번호는 문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다."
        
        # 너무 단순한 패턴만 체크 (완화)
        if password.lower() in ['password', '12345678', 'qwerty', 'admin']:
            return False, "너무 일반적인 비밀번호는 사용할 수 없습니다."
        
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


class FileValidator:
    """파일 업로드 보안 검증"""
    
    # 허용된 파일 확장자
    ALLOWED_EXTENSIONS = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'video': ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        'document': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        'audio': ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    }
    
    # MIME 타입 매핑
    MIME_TYPE_MAPPING = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'pdf': 'application/pdf',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
    }
    
    # 파일 크기 제한 (바이트)
    MAX_FILE_SIZES = {
        'image': 10 * 1024 * 1024,  # 10MB
        'video': 500 * 1024 * 1024,  # 500MB
        'document': 50 * 1024 * 1024,  # 50MB
        'audio': 50 * 1024 * 1024,  # 50MB
    }
    
    @classmethod
    def validate_file(cls, file, file_type='image'):
        """
        파일 검증
        Returns: (is_valid: bool, error_message: str or None)
        """
        if not file:
            return False, "파일을 선택해주세요."
        
        # 파일 이름 검증
        filename = file.name
        if not filename:
            return False, "파일 이름이 없습니다."
        
        # 파일 이름 길이 제한
        if len(filename) > 255:
            return False, "파일 이름이 너무 깁니다."
        
        # 파일 이름에서 위험한 문자 제거
        dangerous_chars = ['..', '/', '\\', '\x00', '%00']
        for char in dangerous_chars:
            if char in filename:
                return False, "파일 이름에 허용되지 않는 문자가 포함되어 있습니다."
        
        # 확장자 검증
        ext = filename.split('.')[-1].lower()
        allowed_exts = cls.ALLOWED_EXTENSIONS.get(file_type, [])
        if ext not in allowed_exts:
            return False, f"허용되지 않는 파일 형식입니다. 허용된 형식: {', '.join(allowed_exts)}"
        
        # 파일 크기 검증
        max_size = cls.MAX_FILE_SIZES.get(file_type, 10 * 1024 * 1024)
        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            return False, f"파일 크기가 너무 큽니다. 최대 {max_size_mb}MB까지 허용됩니다."
        
        # MIME 타입 검증 (magic 모듈이 있는 경우)
        try:
            import magic
            # 파일의 실제 MIME 타입 확인
            mime = magic.from_buffer(file.read(1024), mime=True)
            file.seek(0)  # 파일 포인터 초기화
            
            expected_mime = cls.MIME_TYPE_MAPPING.get(ext)
            if expected_mime and mime != expected_mime:
                return False, "파일 내용이 확장자와 일치하지 않습니다."
        except ImportError:
            # magic 모듈이 없는 경우 기본 검증만 수행
            pass
        except Exception as e:
            logger.warning(f"MIME type validation error: {str(e)}")
        
        # 파일 내용 검증 (악성 코드 패턴)
        try:
            file.seek(0)
            content_sample = file.read(1024)  # 처음 1KB만 검사
            file.seek(0)
            
            # 실행 파일 시그니처 검사
            executable_signatures = [
                b'MZ',  # Windows PE
                b'\x7fELF',  # Linux ELF
                b'\xca\xfe\xba\xbe',  # Mach-O
                b'\xfe\xed\xfa',  # Mach-O
                b'#!/bin/',  # Shell script
                b'#!/usr/bin/',  # Shell script
            ]
            
            for sig in executable_signatures:
                if content_sample.startswith(sig):
                    return False, "실행 파일은 업로드할 수 없습니다."
            
            # PHP 코드 검사
            if b'<?php' in content_sample.lower():
                return False, "PHP 코드가 포함된 파일은 업로드할 수 없습니다."
            
        except Exception as e:
            logger.warning(f"File content validation error: {str(e)}")
        
        return True, None
    
    @classmethod
    def sanitize_filename(cls, filename):
        """파일명 안전하게 변환"""
        import string
        import random
        
        # 확장자 분리
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        
        # 안전한 문자만 남기기
        safe_chars = string.ascii_letters + string.digits + '-_'
        safe_name = ''.join(c if c in safe_chars else '_' for c in name)
        
        # 빈 이름이 되는 경우 랜덤 이름 생성
        if not safe_name:
            safe_name = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        # 길이 제한
        if len(safe_name) > 100:
            safe_name = safe_name[:100]
        
        # 타임스탬프 추가 (중복 방지)
        import time
        timestamp = str(int(time.time()))
        
        return f"{safe_name}_{timestamp}.{ext}" if ext else f"{safe_name}_{timestamp}"