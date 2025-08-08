#!/usr/bin/env python
"""
URL 디버깅 스크립트
Django에 등록된 모든 URL 패턴을 출력하여 문제를 진단합니다.
"""
import os
import sys
import django

# Django 설정 모듈 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')

# Django 초기화
django.setup()

from django.urls import get_resolver
from django.conf import settings

def show_urls(urlpatterns=None, depth=0):
    """재귀적으로 모든 URL 패턴을 출력"""
    if urlpatterns is None:
        urlpatterns = get_resolver().url_patterns
        
    for pattern in urlpatterns:
        print("  " * depth, end="")
        
        # URLPattern 또는 URLResolver 처리
        if hasattr(pattern, 'pattern'):
            # 패턴 정보 출력
            pattern_str = str(pattern.pattern)
            print(f"Pattern: {pattern_str}", end="")
            
            # View 정보가 있으면 출력
            if hasattr(pattern, 'callback'):
                view = pattern.callback
                if hasattr(view, 'view_class'):
                    view_name = f"{view.view_class.__module__}.{view.view_class.__name__}"
                else:
                    view_name = f"{view.__module__}.{view.__name__}" if hasattr(view, '__name__') else str(view)
                print(f" -> {view_name}", end="")
                
            # 이름이 있으면 출력
            if hasattr(pattern, 'name') and pattern.name:
                print(f" [name={pattern.name}]", end="")
                
            print()  # 줄바꿈
            
            # 하위 패턴이 있으면 재귀 호출
            if hasattr(pattern, 'url_patterns'):
                show_urls(pattern.url_patterns, depth + 1)

def find_auth_urls():
    """인증 관련 URL만 찾아서 출력"""
    print("\n=== Authentication URLs ===")
    resolver = get_resolver()
    
    for pattern in resolver.url_patterns:
        pattern_str = str(pattern.pattern)
        
        # auth 관련 URL만 필터링
        if 'auth' in pattern_str.lower():
            print(f"\nPattern: {pattern_str}")
            
            if hasattr(pattern, 'callback'):
                view = pattern.callback
                if hasattr(view, 'view_class'):
                    print(f"  View Class: {view.view_class.__module__}.{view.view_class.__name__}")
                    print(f"  View Class Location: {view.view_class.__module__}")
                else:
                    print(f"  View: {view}")
                    
            if hasattr(pattern, 'name'):
                print(f"  Name: {pattern.name}")
                
def check_view_imports():
    """View 클래스들이 제대로 임포트되는지 확인"""
    print("\n=== Checking View Imports ===")
    
    try:
        from users.views_signup_safe import SafeSignUp, SafeSignIn
        print("✅ SafeSignUp imported successfully:", SafeSignUp)
        print("✅ SafeSignIn imported successfully:", SafeSignIn)
    except ImportError as e:
        print("❌ Failed to import SafeSignUp/SafeSignIn:", e)
        
    try:
        from rest_framework_simplejwt.views import TokenRefreshView
        print("✅ TokenRefreshView imported successfully:", TokenRefreshView)
    except ImportError as e:
        print("❌ Failed to import TokenRefreshView:", e)

def main():
    print("=" * 60)
    print("Django URL Pattern Debug")
    print("=" * 60)
    print(f"Settings Module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ROOT_URLCONF: {settings.ROOT_URLCONF}")
    print("=" * 60)
    
    # View 임포트 확인
    check_view_imports()
    
    # 인증 URL 확인
    find_auth_urls()
    
    # 전체 URL 패턴 출력 (선택적)
    print("\n=== All URL Patterns ===")
    show_urls()

if __name__ == "__main__":
    main()