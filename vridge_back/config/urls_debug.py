"""
URL 디버깅 및 문제 해결을 위한 View
Railway 환경에서 URL 매핑 문제를 진단
"""
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.urls import get_resolver
import json


@method_decorator(csrf_exempt, name='dispatch')
class URLDebugView(View):
    """URL 매핑 상태를 확인하는 디버그 뷰"""
    
    def get(self, request):
        """현재 등록된 모든 URL 패턴 반환"""
        resolver = get_resolver()
        auth_urls = []
        
        for pattern in resolver.url_patterns:
            pattern_str = str(pattern.pattern)
            if 'auth' in pattern_str:
                url_info = {
                    'pattern': pattern_str,
                    'name': getattr(pattern, 'name', None)
                }
                
                if hasattr(pattern, 'callback'):
                    callback = pattern.callback
                    if hasattr(callback, 'view_class'):
                        url_info['view_class'] = f"{callback.view_class.__module__}.{callback.view_class.__name__}"
                        url_info['methods'] = [m for m in ['get', 'post', 'put', 'patch', 'delete'] 
                                              if hasattr(callback.view_class, m)]
                    else:
                        url_info['view'] = str(callback)
                        
                auth_urls.append(url_info)
        
        return JsonResponse({
            'auth_endpoints': auth_urls,
            'total_patterns': len(resolver.url_patterns),
            'settings_module': request.META.get('DJANGO_SETTINGS_MODULE', 'unknown')
        })


@method_decorator(csrf_exempt, name='dispatch')
class AuthTestView(View):
    """인증 엔드포인트 테스트용 뷰"""
    
    def get(self, request):
        """GET 요청 처리"""
        return JsonResponse({
            'message': 'Auth test endpoint is working',
            'method': 'GET',
            'path': request.path
        })
    
    def post(self, request):
        """POST 요청 처리"""
        try:
            data = json.loads(request.body) if request.body else {}
        except:
            data = {}
            
        return JsonResponse({
            'message': 'Auth test endpoint is working',
            'method': 'POST',
            'path': request.path,
            'received_data': data
        })


def auth_endpoint_status(request):
    """인증 엔드포인트 상태 확인"""
    from django.urls import reverse, NoReverseMatch
    
    endpoints = {
        'auth_login': '/api/auth/login/',
        'auth_signup': '/api/auth/signup/',
        'auth_refresh': '/api/auth/refresh/',
        'auth_check_email': '/api/auth/check-email/',
        'auth_check_nickname': '/api/auth/check-nickname/',
        'auth_me': '/api/auth/me/',
    }
    
    status = {}
    for name, expected_url in endpoints.items():
        try:
            actual_url = reverse(name)
            status[name] = {
                'expected': expected_url,
                'actual': actual_url,
                'match': expected_url == actual_url,
                'status': 'OK' if expected_url == actual_url else 'MISMATCH'
            }
        except NoReverseMatch:
            status[name] = {
                'expected': expected_url,
                'actual': None,
                'match': False,
                'status': 'NOT_FOUND'
            }
    
    # View 클래스 임포트 확인
    import_status = {}
    try:
        from users.views_signup_safe import SafeSignUp, SafeSignIn
        import_status['SafeSignUp'] = 'OK'
        import_status['SafeSignIn'] = 'OK'
    except ImportError as e:
        import_status['SafeSignUp'] = f'FAILED: {e}'
        import_status['SafeSignIn'] = f'FAILED: {e}'
    
    try:
        from users.views_auth_fixed import ImprovedSignIn
        import_status['ImprovedSignIn'] = 'OK'
    except ImportError as e:
        import_status['ImprovedSignIn'] = f'FAILED: {e}'
    
    return JsonResponse({
        'endpoints': status,
        'imports': import_status,
        'host': request.get_host(),
        'is_secure': request.is_secure()
    })