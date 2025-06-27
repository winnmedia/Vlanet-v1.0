"""
Performance optimization middleware
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.http import HttpResponse
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