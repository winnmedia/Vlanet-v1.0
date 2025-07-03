import hashlib
import secrets
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class PasswordResetSecurity:
    """비밀번호 재설정 보안 유틸리티"""
    
    @staticmethod
    def generate_auth_code():
        """보안 강화된 6자리 인증 코드 생성"""
        return str(secrets.randbelow(900000) + 100000)
    
    @staticmethod
    def hash_auth_code(auth_code):
        """인증 코드 해시화"""
        return hashlib.sha256(f"{auth_code}{settings.SECRET_KEY}".encode()).hexdigest()
    
    @staticmethod
    def verify_auth_code(provided_code, stored_hash):
        """인증 코드 검증"""
        provided_hash = PasswordResetSecurity.hash_auth_code(provided_code)
        return secrets.compare_digest(provided_hash, stored_hash)
    
    @staticmethod
    def check_rate_limit(identifier, action_type="auth_request", limit=3, window=300):
        """Rate limiting 체크 (기본: 5분에 3회)"""
        cache_key = f"rate_limit:{action_type}:{identifier}"
        
        # 현재 시도 횟수 가져오기
        attempts = cache.get(cache_key, 0)
        
        if attempts >= limit:
            return False, f"{window//60}분 내에 {limit}회까지만 시도할 수 있습니다."
        
        # 시도 횟수 증가
        cache.set(cache_key, attempts + 1, window)
        return True, None
    
    @staticmethod
    def store_auth_code(email, auth_code, expiry_minutes=10):
        """인증 코드를 캐시에 저장 (기본: 10분 만료)"""
        cache_key = f"password_reset:{email}"
        hashed_code = PasswordResetSecurity.hash_auth_code(auth_code)
        
        data = {
            'code': hashed_code,
            'created_at': datetime.now().isoformat(),
            'attempts': 0
        }
        
        cache.set(cache_key, data, expiry_minutes * 60)
        logger.info(f"Auth code stored for {email}, expires in {expiry_minutes} minutes")
    
    @staticmethod
    def verify_and_get_auth_code(email, provided_code, max_attempts=5):
        """인증 코드 검증 및 시도 횟수 체크"""
        cache_key = f"password_reset:{email}"
        data = cache.get(cache_key)
        
        if not data:
            return False, "인증 코드가 만료되었거나 존재하지 않습니다."
        
        # 시도 횟수 체크
        if data['attempts'] >= max_attempts:
            cache.delete(cache_key)
            return False, "인증 시도 횟수를 초과했습니다. 새로운 인증 코드를 요청해주세요."
        
        # 시도 횟수 증가
        data['attempts'] += 1
        cache.set(cache_key, data, 600)  # 10분 유지
        
        # 코드 검증
        if PasswordResetSecurity.verify_auth_code(provided_code, data['code']):
            # 성공 시 캐시에서 제거
            cache.delete(cache_key)
            return True, None
        
        return False, f"인증 코드가 일치하지 않습니다. ({data['attempts']}/{max_attempts} 시도)"
    
    @staticmethod
    def generate_reset_token(user_id):
        """비밀번호 재설정용 임시 토큰 생성"""
        token = secrets.token_urlsafe(32)
        cache_key = f"reset_token:{token}"
        
        cache.set(cache_key, {
            'user_id': user_id,
            'created_at': datetime.now().isoformat()
        }, 600)  # 10분 만료
        
        return token
    
    @staticmethod
    def verify_reset_token(token):
        """재설정 토큰 검증"""
        cache_key = f"reset_token:{token}"
        data = cache.get(cache_key)
        
        if not data:
            return None, "토큰이 만료되었거나 유효하지 않습니다."
        
        # 토큰 사용 후 삭제
        cache.delete(cache_key)
        return data['user_id'], None