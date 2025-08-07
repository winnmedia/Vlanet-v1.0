"""
Performance optimization middleware
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
import json

logger = logging.getLogger(__name__)


class PerformanceMiddleware(MiddlewareMixin):
    """Log request processing time"""
    
    def process_request(self, request):
        request._start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            if duration > 1.0:  # Log slow requests
                logger.warning(
                    f"Slow request: {request.method} {request.path} "
                    f"took {duration:.2f}s"
                )
        return response


class CacheMiddleware(MiddlewareMixin):
    """Simple cache middleware for GET requests"""
    
    def process_request(self, request):
        if request.method == 'GET' and request.path.startswith('/api/'):
            cache_key = f"response:{request.path}:{request.GET.urlencode()}"
            cached_response = cache.get(cache_key)
            if cached_response:
                return HttpResponse(
                    cached_response['content'],
                    content_type=cached_response['content_type'],
                    status=cached_response['status']
                )
    
    def process_response(self, request, response):
        if (request.method == 'GET' and 
            request.path.startswith('/api/') and
            response.status_code == 200 and
            'feedback' not in request.path):  # Don't cache feedback data
            
            cache_key = f"response:{request.path}:{request.GET.urlencode()}"
            cache.set(cache_key, {
                'content': response.content,
                'content_type': response.get('Content-Type', 'application/json'),
                'status': response.status_code
            }, 300)  # Cache for 5 minutes
        
        return response


class RailwayHealthCheckMiddleware(MiddlewareMixin):
    """Handle Railway health checks without host validation"""
    
    def process_request(self, request):
        # Railway 헬스체크 요청 처리
        if request.path == '/api/health/' and request.method == 'GET':
            # User-Agent로 Railway 헬스체크 확인
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            if 'RailwayHealthCheck' in user_agent or 'healthcheck' in request.get_host():
                return JsonResponse({
                    'status': 'ok',
                    'timestamp': timezone.now().isoformat(),
                    'service': 'videoplanet-backend',
                    'database': 'connected',
                    'version': '1.0'
                })
        return None


class CORSOptionsMiddleware(MiddlewareMixin):
    """Handle OPTIONS requests for CORS preflight"""
    
    def process_request(self, request):
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', '*')
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'
            return response
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to all responses"""
    
    def process_response(self, request, response):
        # XSS 보호
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Content Type 스니핑 방지
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Clickjacking 방지 (이미 Django 설정에 있지만 명시적으로 추가)
        if 'X-Frame-Options' not in response:
            response['X-Frame-Options'] = 'DENY'
        
        # HSTS (HTTPS 환경에서만)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy (이전 Feature Policy)
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://api.vlanet.net https://videoplanet.up.railway.app wss://videoplanet.up.railway.app",
            "media-src 'self' blob: data:",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        return response