"""
Custom CORS middleware to handle CORS headers explicitly
"""
from django.http import HttpResponse


class CustomCORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = [
            'https://www.vlanet.net',
            'https://vlanet.net',
            'https://vridgefront.vercel.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ]

    def __call__(self, request):
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response.status_code = 200
        else:
            response = self.get_response(request)
        
        # Get origin from request
        origin = request.META.get('HTTP_ORIGIN')
        
        # Check if origin is allowed
        if origin in self.allowed_origins or '.vercel.app' in (origin or ''):
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Accept, Accept-Encoding, Authorization, Content-Type, Origin, X-Requested-With, X-CSRFToken'
            response['Access-Control-Max-Age'] = '86400'
        
        return response