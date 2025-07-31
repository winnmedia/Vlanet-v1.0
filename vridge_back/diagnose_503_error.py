#!/usr/bin/env python3
"""
Django 503 오류 근본 원인 진단 스크립트
Railway 환경에서 Django가 시작되지 않는 문제를 체계적으로 진단합니다.
"""
import os
import sys
import importlib
import traceback
from pathlib import Path

# 색상 코드
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")

def check_environment():
    """환경변수 및 기본 설정 확인"""
    print_header("1. 환경변수 확인")
    
    critical_vars = {
        'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE', 'Not Set'),
        'SECRET_KEY': 'Set' if os.environ.get('SECRET_KEY') else 'Not Set',
        'DATABASE_URL': 'Set' if os.environ.get('DATABASE_URL') else 'Not Set',
        'DEBUG': os.environ.get('DEBUG', 'Not Set'),
        'ALLOWED_HOSTS': os.environ.get('ALLOWED_HOSTS', 'Not Set'),
        'CORS_ALLOWED_ORIGINS': os.environ.get('CORS_ALLOWED_ORIGINS', 'Not Set'),
    }
    
    all_set = True
    for var, value in critical_vars.items():
        if value in ['Not Set', '']:
            print(f"{Colors.RED}❌ {var}: {value}{Colors.ENDC}")
            all_set = False
        else:
            print(f"{Colors.GREEN}✅ {var}: {value}{Colors.ENDC}")
    
    return all_set

def check_python_path():
    """Python 경로 및 모듈 확인"""
    print_header("2. Python 경로 확인")
    
    print(f"Python 버전: {sys.version}")
    print(f"Python 실행 파일: {sys.executable}")
    print(f"\nPython 경로:")
    for i, path in enumerate(sys.path[:5]):
        print(f"  {i}: {path}")
    
    # 프로젝트 루트 확인
    project_root = Path(__file__).resolve().parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
        print(f"\n{Colors.YELLOW}⚠️  프로젝트 루트를 sys.path에 추가했습니다: {project_root}{Colors.ENDC}")
    
    return True

def check_django_settings():
    """Django 설정 모듈 임포트 테스트"""
    print_header("3. Django 설정 모듈 확인")
    
    settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
    print(f"설정 모듈: {settings_module}")
    
    try:
        # 설정 모듈 임포트 시도
        settings = importlib.import_module(settings_module)
        print(f"{Colors.GREEN}✅ 설정 모듈 임포트 성공{Colors.ENDC}")
        
        # 주요 설정 확인
        important_settings = ['SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS', 'DATABASES', 'INSTALLED_APPS']
        for setting in important_settings:
            if hasattr(settings, setting):
                value = getattr(settings, setting)
                if setting == 'SECRET_KEY':
                    value = value[:20] + '...' if value else 'Not Set'
                elif setting == 'DATABASES':
                    value = 'Configured' if value else 'Not Configured'
                elif isinstance(value, list) and len(value) > 3:
                    value = f"{len(value)} items"
                print(f"  - {setting}: {value}")
            else:
                print(f"  {Colors.RED}❌ {setting}: Not Found{Colors.ENDC}")
        
        return True
        
    except ImportError as e:
        print(f"{Colors.RED}❌ 설정 모듈 임포트 실패: {e}{Colors.ENDC}")
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"{Colors.RED}❌ 설정 확인 중 오류: {e}{Colors.ENDC}")
        traceback.print_exc()
        return False

def check_database_config():
    """데이터베이스 설정 확인"""
    print_header("4. 데이터베이스 설정 확인")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
        import django
        django.setup()
        
        from django.conf import settings
        from django.db import connection
        
        # 데이터베이스 설정 출력
        db_config = settings.DATABASES.get('default', {})
        print(f"데이터베이스 엔진: {db_config.get('ENGINE', 'Not Set')}")
        print(f"데이터베이스 이름: {db_config.get('NAME', 'Not Set')}")
        
        # 연결 테스트
        print("\n데이터베이스 연결 테스트...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"{Colors.GREEN}✅ 데이터베이스 연결 성공{Colors.ENDC}")
            return True
            
    except Exception as e:
        print(f"{Colors.RED}❌ 데이터베이스 연결 실패: {e}{Colors.ENDC}")
        traceback.print_exc()
        return False

def check_installed_apps():
    """INSTALLED_APPS 및 앱 임포트 확인"""
    print_header("5. Django 앱 확인")
    
    try:
        from django.conf import settings
        
        print("INSTALLED_APPS:")
        project_apps = [app for app in settings.INSTALLED_APPS if not app.startswith('django.')]
        
        for app in project_apps:
            try:
                importlib.import_module(app)
                print(f"{Colors.GREEN}  ✅ {app}{Colors.ENDC}")
            except ImportError as e:
                print(f"{Colors.RED}  ❌ {app}: {e}{Colors.ENDC}")
                
                # 앱 디렉토리 존재 여부 확인
                app_path = Path(app.replace('.', '/'))
                if not app_path.exists():
                    print(f"     → 디렉토리가 존재하지 않습니다: {app_path}")
                    
        return True
        
    except Exception as e:
        print(f"{Colors.RED}❌ 앱 확인 실패: {e}{Colors.ENDC}")
        return False

def check_middleware():
    """미들웨어 설정 확인"""
    print_header("6. 미들웨어 확인")
    
    try:
        from django.conf import settings
        
        print("MIDDLEWARE:")
        for middleware in settings.MIDDLEWARE:
            try:
                # 미들웨어 클래스 임포트 시도
                if '.' in middleware:
                    module_path, class_name = middleware.rsplit('.', 1)
                    module = importlib.import_module(module_path)
                    middleware_class = getattr(module, class_name)
                    print(f"{Colors.GREEN}  ✅ {middleware}{Colors.ENDC}")
            except Exception as e:
                print(f"{Colors.RED}  ❌ {middleware}: {e}{Colors.ENDC}")
                
        return True
        
    except Exception as e:
        print(f"{Colors.RED}❌ 미들웨어 확인 실패: {e}{Colors.ENDC}")
        return False

def simulate_django_startup():
    """Django 시작 시뮬레이션"""
    print_header("7. Django 시작 시뮬레이션")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
        
        print("Django 설정 중...")
        import django
        django.setup()
        
        print(f"{Colors.GREEN}✅ Django 설정 성공!{Colors.ENDC}")
        
        # 앱 레지스트리 확인
        from django.apps import apps
        print(f"\n등록된 앱 수: {len(apps.get_app_configs())}")
        
        # 모델 확인
        all_models = apps.get_models()
        print(f"등록된 모델 수: {len(all_models)}")
        
        return True
        
    except Exception as e:
        print(f"{Colors.RED}❌ Django 시작 실패: {e}{Colors.ENDC}")
        traceback.print_exc()
        return False

def generate_solution():
    """근본적인 해결책 제시"""
    print_header("8. 근본적인 해결책")
    
    print(f"{Colors.BOLD}🔧 Django 503 오류 해결 방안:{Colors.ENDC}\n")
    
    print("1. **최소 설정 파일 생성** (config/settings_minimal.py)")
    print("   - 최소한의 설정으로 Django 시작 가능 여부 확인")
    print("   - 복잡한 설정을 단계적으로 추가하며 문제 지점 파악")
    
    print("\n2. **단순화된 시작 스크립트** (start_minimal.sh)")
    print("   - 불필요한 마이그레이션 제거")
    print("   - 핵심 기능만으로 시작")
    
    print("\n3. **Railway 특화 설정**")
    print("   - Procfile 직접 실행: gunicorn config.wsgi")
    print("   - railway.json 제거하고 Procfile만 사용")
    
    print("\n4. **환경변수 단순화**")
    print("   - 필수 환경변수만 유지")
    print("   - 복잡한 설정은 하드코딩으로 테스트")

def main():
    """메인 진단 실행"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("Django 503 오류 근본 원인 진단")
    print(f"시작 시간: {Colors.ENDC}")
    
    results = {
        "환경변수": check_environment(),
        "Python 경로": check_python_path(),
        "Django 설정": check_django_settings(),
        "데이터베이스": check_database_config(),
        "앱 설정": check_installed_apps(),
        "미들웨어": check_middleware(),
        "Django 시작": simulate_django_startup(),
    }
    
    # 결과 요약
    print_header("진단 결과 요약")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"전체 검사: {total}개")
    print(f"{Colors.GREEN}통과: {passed}개{Colors.ENDC}")
    print(f"{Colors.RED}실패: {total - passed}개{Colors.ENDC}")
    
    print("\n실패 항목:")
    for check, result in results.items():
        if not result:
            print(f"  {Colors.RED}❌ {check}{Colors.ENDC}")
    
    # 해결책 제시
    generate_solution()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)