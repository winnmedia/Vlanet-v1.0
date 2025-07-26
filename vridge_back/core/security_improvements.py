import os
import hashlib
import hmac
from functools import wraps
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from cryptography.fernet import Fernet
import jwt

class SecurityManager:
    """중앙 집중식 보안 관리자"""
    
    def __init__(self):
        # 암호화 키 (환경변수에서 로드하거나 생성)
        self.encryption_key = os.environ.get('ENCRYPTION_KEY')
        if not self.encryption_key:
            self.encryption_key = Fernet.generate_key()
        self.cipher = Fernet(self.encryption_key)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """민감한 데이터 암호화"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """암호화된 데이터 복호화"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def hash_password(self, password: str, salt: str = None) -> tuple:
        """비밀번호 해싱 (PBKDF2)"""
        if not salt:
            salt = os.urandom(32)
        else:
            salt = salt.encode() if isinstance(salt, str) else salt
        
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000  # iterations
        )
        
        return key.hex(), salt.hex()
    
    def verify_password(self, password: str, hashed: str, salt: str) -> bool:
        """비밀번호 검증"""
        new_hash, _ = self.hash_password(password, bytes.fromhex(salt))
        return hmac.compare_digest(new_hash, hashed)
    
    def generate_secure_token(self, payload: dict, expiry_hours: int = 24) -> str:
        """안전한 JWT 토큰 생성"""
        payload['exp'] = datetime.utcnow() + timedelta(hours=expiry_hours)
        payload['iat'] = datetime.utcnow()
        payload['jti'] = os.urandom(16).hex()  # 고유 토큰 ID
        
        return jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    
    def verify_token(self, token: str) -> dict:
        """토큰 검증"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            
            # 토큰 블랙리스트 체크
            if self.is_token_blacklisted(payload.get('jti')):
                raise jwt.InvalidTokenError('Token has been revoked')
            
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError('Token has expired')
        except jwt.InvalidTokenError as e:
            raise ValueError(f'Invalid token: {str(e)}')
    
    def blacklist_token(self, token_id: str, expiry_seconds: int = 86400):
        """토큰 블랙리스트에 추가"""
        cache.set(f'blacklist_token_{token_id}', True, expiry_seconds)
    
    def is_token_blacklisted(self, token_id: str) -> bool:
        """토큰 블랙리스트 확인"""
        return bool(cache.get(f'blacklist_token_{token_id}'))


class RateLimiter:
    """향상된 Rate Limiting"""
    
    @staticmethod
    def limit_api_calls(max_calls: int = 100, window_seconds: int = 60):
        """API 호출 제한 데코레이터"""
        def decorator(func):
            @wraps(func)
            def wrapper(request, *args, **kwargs):
                # IP 또는 사용자 기반 키 생성
                if request.user.is_authenticated:
                    key = f'rate_limit_user_{request.user.id}_{func.__name__}'
                else:
                    ip = request.META.get('REMOTE_ADDR', 'unknown')
                    key = f'rate_limit_ip_{ip}_{func.__name__}'
                
                # 현재 카운트 확인
                current_count = cache.get(key, 0)
                
                if current_count >= max_calls:
                    return JsonResponse({
                        'error': 'Rate limit exceeded',
                        'retry_after': window_seconds
                    }, status=429)
                
                # 카운트 증가
                cache.set(key, current_count + 1, window_seconds)
                
                # 원래 함수 실행
                response = func(request, *args, **kwargs)
                
                # Rate limit 헤더 추가
                response['X-RateLimit-Limit'] = str(max_calls)
                response['X-RateLimit-Remaining'] = str(max_calls - current_count - 1)
                response['X-RateLimit-Reset'] = str(int(timezone.now().timestamp()) + window_seconds)
                
                return response
            
            return wrapper
        return decorator
    
    @staticmethod
    def limit_login_attempts(max_attempts: int = 5, lockout_minutes: int = 30):
        """로그인 시도 제한"""
        def decorator(func):
            @wraps(func)
            def wrapper(request, *args, **kwargs):
                email = request.POST.get('email', request.data.get('email', ''))
                key = f'login_attempts_{email}'
                lockout_key = f'login_lockout_{email}'
                
                # 잠금 상태 확인
                if cache.get(lockout_key):
                    return JsonResponse({
                        'error': '너무 많은 로그인 시도로 계정이 일시적으로 잠겼습니다.',
                        'retry_after_minutes': lockout_minutes
                    }, status=429)
                
                # 시도 횟수 확인
                attempts = cache.get(key, 0)
                
                # 원래 함수 실행
                response = func(request, *args, **kwargs)
                
                # 실패한 경우
                if response.status_code == 401:
                    attempts += 1
                    cache.set(key, attempts, lockout_minutes * 60)
                    
                    if attempts >= max_attempts:
                        cache.set(lockout_key, True, lockout_minutes * 60)
                        return JsonResponse({
                            'error': f'{max_attempts}회 실패로 {lockout_minutes}분간 로그인이 제한됩니다.',
                            'locked_until': (timezone.now() + timedelta(minutes=lockout_minutes)).isoformat()
                        }, status=429)
                    else:
                        response.data['attempts_remaining'] = max_attempts - attempts
                
                # 성공한 경우 카운트 초기화
                elif response.status_code == 200:
                    cache.delete(key)
                    cache.delete(lockout_key)
                
                return response
            
            return wrapper
        return decorator


class InputValidator:
    """입력 검증 강화"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """이메일 형식 검증"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password_strength(password: str) -> dict:
        """비밀번호 강도 검증"""
        import re
        
        result = {
            'valid': True,
            'score': 0,
            'errors': []
        }
        
        # 길이 체크
        if len(password) < 10:
            result['errors'].append('비밀번호는 10자 이상이어야 합니다')
            result['valid'] = False
        else:
            result['score'] += 1
        
        # 대문자 체크
        if not re.search(r'[A-Z]', password):
            result['errors'].append('대문자를 포함해야 합니다')
            result['valid'] = False
        else:
            result['score'] += 1
        
        # 소문자 체크
        if not re.search(r'[a-z]', password):
            result['errors'].append('소문자를 포함해야 합니다')
            result['valid'] = False
        else:
            result['score'] += 1
        
        # 숫자 체크
        if not re.search(r'[0-9]', password):
            result['errors'].append('숫자를 포함해야 합니다')
            result['valid'] = False
        else:
            result['score'] += 1
        
        # 특수문자 체크
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            result['errors'].append('특수문자를 포함해야 합니다')
            result['valid'] = False
        else:
            result['score'] += 1
        
        # 연속된 문자 체크
        if re.search(r'(.)\1{2,}', password):
            result['errors'].append('같은 문자가 3번 이상 연속될 수 없습니다')
            result['valid'] = False
        
        # 일반적인 패턴 체크
        common_patterns = ['123', 'abc', 'password', 'qwerty']
        for pattern in common_patterns:
            if pattern in password.lower():
                result['errors'].append(f'일반적인 패턴({pattern})을 포함할 수 없습니다')
                result['valid'] = False
                break
        
        return result
    
    @staticmethod
    def sanitize_input(text: str, max_length: int = 1000) -> str:
        """입력값 살균"""
        import html
        import re
        
        # HTML 이스케이프
        text = html.escape(text)
        
        # 길이 제한
        text = text[:max_length]
        
        # 위험한 패턴 제거
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>.*?</iframe>',
        ]
        
        for pattern in dangerous_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()


class APIKeyManager:
    """API 키 관리"""
    
    @staticmethod
    def generate_api_key(user_id: int, name: str) -> dict:
        """API 키 생성"""
        # 고유한 키 생성
        raw_key = f"{user_id}:{name}:{datetime.utcnow().timestamp()}:{os.urandom(32).hex()}"
        api_key = hashlib.sha256(raw_key.encode()).hexdigest()
        
        # 키 해시 저장 (원본 키는 저장하지 않음)
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # 데이터베이스에 저장
        from users.models import APIKey
        api_key_obj = APIKey.objects.create(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            last_used=None
        )
        
        return {
            'id': api_key_obj.id,
            'key': api_key,  # 한 번만 표시됨
            'name': name,
            'created': api_key_obj.created.isoformat()
        }
    
    @staticmethod
    def verify_api_key(api_key: str) -> dict:
        """API 키 검증"""
        from users.models import APIKey
        
        # 키 해시 계산
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # 데이터베이스에서 확인
        try:
            api_key_obj = APIKey.objects.get(
                key_hash=key_hash,
                is_active=True
            )
            
            # 마지막 사용 시간 업데이트
            api_key_obj.last_used = timezone.now()
            api_key_obj.save()
            
            return {
                'valid': True,
                'user_id': api_key_obj.user_id,
                'scopes': api_key_obj.scopes
            }
        except APIKey.DoesNotExist:
            return {'valid': False}


# 보안 설정 체크리스트
SECURITY_CHECKLIST = {
    'https_only': True,
    'secure_cookies': True,
    'csrf_protection': True,
    'xss_protection': True,
    'sql_injection_protection': True,
    'rate_limiting': True,
    'input_validation': True,
    'output_encoding': True,
    'authentication': True,
    'authorization': True,
    'encryption_at_rest': True,
    'encryption_in_transit': True,
    'audit_logging': True,
    'vulnerability_scanning': True,
    'penetration_testing': False,  # 주기적으로 수행
    'security_training': False,  # 팀 교육 필요
}