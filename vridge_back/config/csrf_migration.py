"""
CSRF 단계적 마이그레이션 설정
"""
from django.conf import settings
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator

# CSRF 보호가 필요한 엔드포인트 목록 (우선순위 순)
CSRF_PROTECTED_ENDPOINTS = {
    # Phase 1: 인증 관련 (최우선)
    'phase1': [
        'users.views.SignIn',
        'users.views.SignUp',
        'users.views.SendAuthNumber',
        'users.views.ResetPassword',
        'users.views.ChangePassword',
    ],
    # Phase 2: 사용자 정보 변경
    'phase2': [
        'users.views.UpdateUser',
        'users.views.UpdatePassword',
        'users.views.DeleteUser',
        'users.views.ProfileImageUpload',
    ],
    # Phase 3: 프로젝트/피드백 생성 및 수정
    'phase3': [
        'projects.views.CreateProject',
        'projects.views.UpdateProject',
        'projects.views.DeleteProject',
        'feedbacks.views.CreateFeedback',
        'feedbacks.views.UpdateFeedback',
    ],
}

# 현재 활성화된 Phase
ACTIVE_PHASES = getattr(settings, 'CSRF_ACTIVE_PHASES', ['phase1'])

def should_protect_endpoint(view_name):
    """특정 엔드포인트가 CSRF 보호를 받아야 하는지 확인"""
    for phase in ACTIVE_PHASES:
        if view_name in CSRF_PROTECTED_ENDPOINTS.get(phase, []):
            return True
    return False

def csrf_protect_if_enabled(view_class):
    """설정에 따라 CSRF 보호를 조건부로 적용하는 데코레이터"""
    view_name = f"{view_class.__module__}.{view_class.__name__}"
    
    if should_protect_endpoint(view_name):
        # CSRF 보호 활성화
        return method_decorator([ensure_csrf_cookie, csrf_protect], name='dispatch')(view_class)
    else:
        # 기존대로 CSRF 보호 비활성화
        from django.views.decorators.csrf import csrf_exempt
        return method_decorator(csrf_exempt, name='dispatch')(view_class)