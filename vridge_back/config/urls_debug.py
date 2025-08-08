"""
디버그 URL 및 뷰
인증 시스템 상태를 확인하기 위한 엔드포인트
"""
from django.views import View
from django.http import JsonResponse
from django.urls import get_resolver
import json

class URLDebugView(View):
    """등록된 URL 패턴 확인"""
    def get(self, request):
        resolver = get_resolver()
        patterns = []
        
        # URL 패턴 수집
        for pattern in resolver.url_patterns:
            if hasattr(pattern, 'pattern'):
                patterns.append(str(pattern.pattern))
        
        return JsonResponse({
            "total_patterns": len(patterns),
            "auth_patterns": [p for p in patterns if 'auth' in p],
            "all_patterns": patterns[:50]  # 처음 50개만
        })

class AuthTestView(View):
    """인증 테스트 엔드포인트"""
    def get(self, request):
        return JsonResponse({
            "message": "Auth test endpoint is working",
            "method": "GET"
        })
    
    def post(self, request):
        try:
            data = json.loads(request.body) if request.body else {}
        except:
            data = {}
        
        return JsonResponse({
            "message": "Auth test endpoint received POST",
            "received_data": data,
            "headers": {
                "Content-Type": request.headers.get("Content-Type"),
                "Authorization": request.headers.get("Authorization", "Not provided")
            }
        })

def auth_endpoint_status(request):
    """인증 엔드포인트 상태 확인"""
    from django.urls import reverse, NoReverseMatch
    
    endpoints = {
        'auth_login': '/api/auth/login/',
        'auth_signup': '/api/auth/signup/',
        'auth_refresh': '/api/auth/refresh/',
        'auth_me': '/api/auth/me/',
    }
    
    status = {}
    for name, path in endpoints.items():
        try:
            url = reverse(name)
            status[name] = {
                "path": path,
                "reverse_url": url,
                "status": "registered"
            }
        except NoReverseMatch:
            status[name] = {
                "path": path,
                "status": "not_found"
            }
    
    # 현재 사용 중인 뷰 정보
    try:
        from config.auth_fallback import get_auth_views, _is_railway_env
        auth_views = get_auth_views()
        view_info = {
            "is_railway": _is_railway_env(),
            "login_view": auth_views['login'].__name__,
            "signup_view": auth_views['signup'].__name__,
        }
    except:
        view_info = {"error": "Could not load auth views"}
    
    return JsonResponse({
        "endpoints": status,
        "view_info": view_info,
        "message": "Use these endpoints for authentication"
    })