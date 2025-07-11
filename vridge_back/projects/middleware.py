"""
프로젝트 관련 미들웨어
멱등성 키 처리 및 중복 요청 방지
"""
import hashlib
import json
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class IdempotencyMiddleware(MiddlewareMixin):
    """
    멱등성 키를 이용한 중복 요청 방지 미들웨어
    """
    
    def process_request(self, request):
        # POST, PUT, PATCH 요청에 대해서만 처리
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return None
        
        # 프로젝트 생성 엔드포인트에만 적용
        if not request.path.startswith('/api/projects/'):
            return None
        
        # 멱등성 키 확인
        idempotency_key = request.headers.get('X-Idempotency-Key')
        if not idempotency_key:
            # 멱등성 키가 없으면 요청 본문으로 생성
            try:
                body = request.body.decode('utf-8')
                if body:
                    # 사용자 ID와 요청 본문을 조합하여 해시 생성
                    user_id = getattr(request.user, 'id', 'anonymous')
                    hash_input = f"{user_id}:{request.path}:{body}"
                    idempotency_key = hashlib.sha256(hash_input.encode()).hexdigest()
            except:
                return None
        
        if idempotency_key:
            cache_key = f"idempotency:{idempotency_key}"
            
            # 진행 중인 요청인지 확인
            in_progress = cache.get(f"{cache_key}:progress")
            if in_progress:
                return JsonResponse({
                    "message": "동일한 요청이 이미 처리 중입니다. 잠시 후 다시 시도해주세요.",
                    "code": "REQUEST_IN_PROGRESS"
                }, status=409)
            
            # 이미 처리된 요청인지 확인
            cached_response = cache.get(cache_key)
            if cached_response:
                return JsonResponse(cached_response['data'], status=cached_response['status'])
            
            # 요청 처리 중 표시
            cache.set(f"{cache_key}:progress", True, timeout=30)  # 30초 타임아웃
            
            # 요청 객체에 멱등성 키 저장
            request.idempotency_key = idempotency_key
            request.idempotency_cache_key = cache_key
    
    def process_response(self, request, response):
        # 멱등성 키가 있는 요청의 응답 캐싱
        if hasattr(request, 'idempotency_cache_key') and response.status_code < 500:
            cache_key = request.idempotency_cache_key
            
            # 진행 중 플래그 제거
            cache.delete(f"{cache_key}:progress")
            
            # 성공적인 응답만 캐싱 (2xx, 3xx)
            if 200 <= response.status_code < 400:
                try:
                    response_data = {
                        'data': json.loads(response.content),
                        'status': response.status_code
                    }
                    # 1시간 동안 캐싱
                    cache.set(cache_key, response_data, timeout=3600)
                except:
                    pass
        
        return response
    
    def process_exception(self, request, exception):
        # 예외 발생 시 진행 중 플래그 제거
        if hasattr(request, 'idempotency_cache_key'):
            cache_key = request.idempotency_cache_key
            cache.delete(f"{cache_key}:progress")