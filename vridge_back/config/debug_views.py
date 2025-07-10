import os
import sys
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import user_passes_test
from django.views.decorators.csrf import csrf_exempt

def is_superuser(user):
    return user.is_authenticated and user.is_superuser

@csrf_exempt
def debug_info(request):
    """
    디버깅 정보를 반환하는 뷰
    Railway 환경에서만 활성화되며, ENABLE_DEBUG_INFO 환경변수로 제어
    """
    # Railway 환경이 아니거나 디버그 정보가 비활성화된 경우
    if not settings.IS_RAILWAY or os.environ.get('ENABLE_DEBUG_INFO', 'False').lower() != 'true':
        return JsonResponse({'error': 'Debug info not available'}, status=403)
    
    # 기본 정보
    debug_data = {
        'environment': {
            'IS_RAILWAY': settings.IS_RAILWAY,
            'DEBUG': settings.DEBUG,
            'RAILWAY_ENVIRONMENT': os.environ.get('RAILWAY_ENVIRONMENT'),
            'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE'),
            'PYTHON_VERSION': sys.version,
        },
        'database': {
            'ENGINE': settings.DATABASES['default']['ENGINE'],
            'NAME': settings.DATABASES['default'].get('NAME', 'N/A'),
            'HOST': settings.DATABASES['default'].get('HOST', 'N/A')[:20] + '...' if settings.DATABASES['default'].get('HOST') else 'N/A',
        },
        'installed_apps': {
            'django_apps': settings.DJANGO_APPS,
            'project_apps': settings.PROJECT_APPS,
            'third_party_apps': settings.THIRD_PARTY_APPS,
        },
        'middleware': settings.MIDDLEWARE,
        'cors': {
            'CORS_ALLOWED_ORIGINS': settings.CORS_ALLOWED_ORIGINS,
            'CORS_ALLOW_CREDENTIALS': settings.CORS_ALLOW_CREDENTIALS,
        },
        'static_files': {
            'STATIC_URL': settings.STATIC_URL,
            'STATIC_ROOT': str(settings.STATIC_ROOT),
            'STATICFILES_DIRS': [str(d) for d in settings.STATICFILES_DIRS],
        },
        'media_files': {
            'MEDIA_URL': settings.MEDIA_URL,
            'MEDIA_ROOT': str(settings.MEDIA_ROOT),
            'MEDIA_ROOT_EXISTS': os.path.exists(settings.MEDIA_ROOT),
        },
        'cache': {
            'BACKEND': settings.CACHES['default']['BACKEND'],
            'LOCATION': settings.CACHES['default'].get('LOCATION', 'N/A')[:30] + '...' if settings.CACHES['default'].get('LOCATION') else 'N/A',
        },
        'logging': {
            'handlers': list(settings.LOGGING.get('handlers', {}).keys()),
            'loggers': list(settings.LOGGING.get('loggers', {}).keys()),
        }
    }
    
    # 환경변수 (민감한 정보 제외)
    safe_env_vars = {}
    for key, value in os.environ.items():
        if any(sensitive in key.upper() for sensitive in ['PASSWORD', 'SECRET', 'KEY', 'TOKEN']):
            safe_env_vars[key] = '***HIDDEN***'
        else:
            safe_env_vars[key] = value[:50] + '...' if len(value) > 50 else value
    
    debug_data['environment_variables'] = safe_env_vars
    
    return JsonResponse(debug_data, json_dumps_params={'indent': 2})

@csrf_exempt
def test_error(request):
    """
    에러 핸들링 테스트를 위한 뷰
    """
    error_type = request.GET.get('type', '500')
    
    if error_type == '404':
        from django.http import Http404
        raise Http404("Test 404 error")
    elif error_type == '403':
        from django.core.exceptions import PermissionDenied
        raise PermissionDenied("Test 403 error")
    elif error_type == '400':
        from django.core.exceptions import BadRequest
        raise BadRequest("Test 400 error")
    else:
        # 500 에러 테스트
        raise Exception("Test 500 error - This is a deliberate test exception")