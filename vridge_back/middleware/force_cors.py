"""강제 CORS 헤더 추가 미들웨어"""
import logging

logger = logging.getLogger(__name__)


class ForceCorsMiddleware:
    """CORS 헤더를 강제로 추가하는 미들웨어"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        # 허용할 origin 목록
        self.allowed_origins = [
            "https://vlanet.net",
            "https://www.vlanet.net",
            "http://vlanet.net",
            "http://www.vlanet.net",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://videoplanet.up.railway.app",
            "https://videoplanetready.vercel.app",
            "https://vlanet-v1-0.vercel.app",
        ]

    def __call__(self, request):
        # 요청의 Origin 헤더 확인
        origin = request.headers.get('Origin', '')
        
        # 응답 생성
        response = self.get_response(request)
        
        # Origin이 허용 목록에 있거나, Vercel 도메인인 경우
        if origin in self.allowed_origins or '.vercel.app' in origin:
            # CORS 헤더 강제 추가
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Accept, Accept-Encoding, Authorization, Content-Type, Origin, X-Requested-With, X-CSRFToken, X-Idempotency-Key'
            response['Access-Control-Max-Age'] = '86400'
            
            # OPTIONS 요청인 경우 (preflight)
            if request.method == 'OPTIONS':
                response['Content-Length'] = '0'
                response.status_code = 200
            
            logger.info(f"[Force CORS] Added headers for origin: {origin}")
        else:
            logger.warning(f"[Force CORS] Origin not allowed: {origin}")
        
        return response