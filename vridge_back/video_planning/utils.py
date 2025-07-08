"""
기획안 내보내기 관련 유틸리티 함수
"""

import re
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class TextValidator:
    """텍스트 검증 유틸리티"""
    
    # 악성 패턴 (간단한 XSS, SQL 인젝션 방지)
    MALICIOUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'SELECT\s+.*\s+FROM',
        r'DROP\s+TABLE',
        r'INSERT\s+INTO',
        r'UPDATE\s+.*\s+SET',
        r'DELETE\s+FROM'
    ]
    
    @classmethod
    def validate_text_input(cls, text: str) -> Dict[str, Any]:
        """
        입력 텍스트 검증
        
        Returns:
            {
                'is_valid': bool,
                'sanitized_text': str,
                'issues': List[str]
            }
        """
        issues = []
        sanitized_text = text.strip()
        
        # 길이 검증
        if len(sanitized_text) < 50:
            issues.append("텍스트가 너무 짧습니다 (최소 50자)")
        elif len(sanitized_text) > 10000:
            issues.append("텍스트가 너무 깁니다 (최대 10,000자)")
        
        # 악성 패턴 검사
        for pattern in cls.MALICIOUS_PATTERNS:
            if re.search(pattern, sanitized_text, re.IGNORECASE):
                issues.append(f"보안 위험 패턴 감지: {pattern}")
        
        # HTML 태그 제거 (기본적인 XSS 방지)
        sanitized_text = re.sub(r'<[^>]+>', '', sanitized_text)
        
        # 연속 공백 정리
        sanitized_text = re.sub(r'\s+', ' ', sanitized_text)
        
        return {
            'is_valid': len(issues) == 0,
            'sanitized_text': sanitized_text,
            'issues': issues
        }
    
    @classmethod
    def extract_keywords(cls, text: str, max_keywords: int = 10) -> List[str]:
        """텍스트에서 키워드 추출"""
        # 간단한 키워드 추출 (실제로는 더 정교한 NLP 라이브러리 사용 권장)
        words = re.findall(r'\b\w{3,}\b', text.lower())
        
        # 불용어 제거 (한국어 기본 불용어)
        stop_words = {'그리고', '하지만', '그러나', '따라서', '그래서', '또한', '이것', '그것', '이런', '그런'}
        keywords = [word for word in words if word not in stop_words]
        
        # 빈도수 기반 정렬
        word_count = {}
        for word in keywords:
            word_count[word] = word_count.get(word, 0) + 1
        
        sorted_keywords = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
        return [word for word, count in sorted_keywords[:max_keywords]]


class APIRateLimiter:
    """API 호출 제한 관리"""
    
    @staticmethod
    def check_rate_limit(user_id: str, service: str, limit: int = 10, window: int = 3600) -> Dict[str, Any]:
        """
        사용자별 API 호출 제한 확인
        
        Args:
            user_id: 사용자 ID
            service: 서비스명 (gemini, google_slides)
            limit: 제한 횟수
            window: 시간 윈도우 (초)
        
        Returns:
            {
                'allowed': bool,
                'remaining': int,
                'reset_time': datetime
            }
        """
        cache_key = f"rate_limit:{service}:{user_id}"
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            # 제한 초과
            ttl = cache.ttl(cache_key)
            reset_time = datetime.now() + timedelta(seconds=ttl if ttl > 0 else window)
            return {
                'allowed': False,
                'remaining': 0,
                'reset_time': reset_time
            }
        
        # 카운트 증가
        cache.set(cache_key, current_count + 1, window)
        
        return {
            'allowed': True,
            'remaining': limit - current_count - 1,
            'reset_time': datetime.now() + timedelta(seconds=window)
        }


class ResponseFormatter:
    """API 응답 포맷터"""
    
    @staticmethod
    def success_response(data: Any, message: str = "성공") -> Dict[str, Any]:
        """성공 응답 포맷"""
        return {
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def error_response(error: str, error_code: str = None, details: Any = None) -> Dict[str, Any]:
        """에러 응답 포맷"""
        response = {
            'success': False,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        
        if error_code:
            response['error_code'] = error_code
        
        if details:
            response['details'] = details
        
        return response
    
    @staticmethod
    def partial_success_response(data: Any, error: str, completed_steps: List[str]) -> Dict[str, Any]:
        """부분 성공 응답 포맷"""
        return {
            'success': False,
            'partial_success': True,
            'data': data,
            'error': error,
            'completed_steps': completed_steps,
            'timestamp': datetime.now().isoformat()
        }


class ConfigManager:
    """설정 관리 유틸리티"""
    
    @staticmethod
    def get_api_key(service: str) -> Optional[str]:
        """서비스별 API 키 조회"""
        key_mapping = {
            'gemini': 'GOOGLE_API_KEY',
            'google_slides': 'GOOGLE_APPLICATION_CREDENTIALS',
            'openai': 'OPENAI_API_KEY'
        }
        
        env_var = key_mapping.get(service)
        if not env_var:
            logger.warning(f"Unknown service: {service}")
            return None
        
        api_key = getattr(settings, env_var, None)
        if not api_key:
            logger.warning(f"API key not found for {service}: {env_var}")
        
        return api_key
    
    @staticmethod
    def get_service_limits() -> Dict[str, Dict[str, int]]:
        """서비스별 제한값 조회"""
        return {
            'gemini': {
                'daily_requests': 1500,
                'hourly_requests': 60,
                'max_text_length': 10000
            },
            'google_slides': {
                'daily_requests': 100,
                'hourly_requests': 20,
                'max_slides_per_presentation': 50
            }
        }


class DebugLogger:
    """디버깅 로거"""
    
    @staticmethod
    def log_api_call(service: str, user_id: str, request_data: Dict, response_data: Dict, duration: float):
        """API 호출 로그"""
        log_data = {
            'service': service,
            'user_id': user_id,
            'request_size': len(str(request_data)),
            'response_size': len(str(response_data)),
            'duration_ms': round(duration * 1000, 2),
            'success': response_data.get('success', False),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"API Call: {json.dumps(log_data)}")
    
    @staticmethod
    def log_error(service: str, error: Exception, context: Dict = None):
        """에러 로그"""
        log_data = {
            'service': service,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        
        logger.error(f"Service Error: {json.dumps(log_data)}", exc_info=True)


def retry_with_exponential_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """지수 백오프를 사용한 재시도 데코레이터"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay}s: {str(e)}")
                    
                    import time
                    time.sleep(delay)
            
        return wrapper
    return decorator