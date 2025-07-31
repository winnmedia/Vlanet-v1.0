#!/usr/bin/env python3
"""
마이그레이션 상태 점검 스크립트
Django 앱의 모든 마이그레이션 상태를 상세히 확인합니다.
"""
import os
import sys
import django
from pathlib import Path

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
sys.path.insert(0, str(Path(__file__).resolve().parent))

print("🔍 마이그레이션 상태 점검 시작...\n")

try:
    django.setup()
    print("✅ Django 설정 성공\n")
except Exception as e:
    print(f"❌ Django 설정 실패: {e}")
    print("   로컬 환경에서 테스트 모드로 진행합니다.\n")

# 마이그레이션 디렉토리 검사
def check_migration_directories():
    """각 앱의 마이그레이션 디렉토리 상태 확인"""
    print("📁 마이그레이션 디렉토리 검사:")
    print("-" * 50)
    
    apps = ['users', 'projects', 'feedbacks', 'video_planning', 'video_analysis', 'admin_dashboard']
    migration_status = {}
    
    for app in apps:
        app_path = Path(app)
        migration_path = app_path / 'migrations'
        
        if not app_path.exists():
            print(f"❌ {app}: 앱 디렉토리가 존재하지 않음")
            migration_status[app] = {'exists': False, 'files': []}
            continue
            
        if not migration_path.exists():
            print(f"⚠️  {app}: migrations 디렉토리가 없음")
            migration_status[app] = {'exists': False, 'files': []}
            continue
            
        # 마이그레이션 파일 목록
        migration_files = sorted([
            f.name for f in migration_path.glob('*.py')
            if f.name != '__init__.py' and not f.name.endswith('pyc')
        ])
        
        # __init__.py 확인
        init_file = migration_path / '__init__.py'
        if not init_file.exists():
            print(f"⚠️  {app}: __init__.py 파일이 없음 (생성 필요)")
            # __init__.py 생성
            init_file.touch()
            print(f"   → __init__.py 생성됨")
        
        # 비어있는 마이그레이션 파일 확인
        empty_files = []
        for file in migration_files:
            file_path = migration_path / file
            if file_path.stat().st_size == 0:
                empty_files.append(file)
        
        if migration_files:
            print(f"✅ {app}: {len(migration_files)}개 마이그레이션 파일")
            for file in migration_files[:3]:  # 처음 3개만 표시
                print(f"   - {file}")
            if len(migration_files) > 3:
                print(f"   ... 외 {len(migration_files)-3}개")
            if empty_files:
                print(f"   ⚠️  비어있는 파일: {', '.join(empty_files)}")
        else:
            print(f"⚠️  {app}: 마이그레이션 파일이 없음")
            
        migration_status[app] = {
            'exists': True,
            'files': migration_files,
            'empty_files': empty_files
        }
    
    return migration_status

def check_migration_dependencies():
    """마이그레이션 의존성 확인"""
    print("\n\n🔗 마이그레이션 의존성 분석:")
    print("-" * 50)
    
    try:
        from django.db.migrations.loader import MigrationLoader
        from django.db import connection
        
        loader = MigrationLoader(connection)
        
        # 적용되지 않은 마이그레이션
        unapplied = []
        for app_label, migration_name in loader.graph.nodes:
            if (app_label, migration_name) not in loader.applied_migrations:
                unapplied.append(f"{app_label}.{migration_name}")
        
        if unapplied:
            print(f"❌ 적용되지 않은 마이그레이션: {len(unapplied)}개")
            for migration in unapplied[:10]:  # 처음 10개만 표시
                print(f"   - {migration}")
            if len(unapplied) > 10:
                print(f"   ... 외 {len(unapplied)-10}개")
        else:
            print("✅ 모든 마이그레이션이 적용됨")
            
        # 충돌 확인
        conflicts = loader.detect_conflicts()
        if conflicts:
            print(f"\n❌ 마이그레이션 충돌 발견:")
            for app, migrations in conflicts.items():
                print(f"   {app}: {migrations}")
        else:
            print("✅ 마이그레이션 충돌 없음")
            
    except Exception as e:
        print(f"⚠️  의존성 분석 실패: {e}")
        print("   데이터베이스 연결이 필요합니다.")

def generate_migration_commands():
    """필요한 마이그레이션 명령어 생성"""
    print("\n\n🛠️  권장 마이그레이션 명령어:")
    print("-" * 50)
    
    commands = [
        "# 1. 모든 앱의 마이그레이션 생성",
        "python3 manage.py makemigrations users",
        "python3 manage.py makemigrations projects", 
        "python3 manage.py makemigrations feedbacks",
        "python3 manage.py makemigrations video_planning",
        "python3 manage.py makemigrations video_analysis",
        "python3 manage.py makemigrations admin_dashboard",
        "",
        "# 2. 마이그레이션 상태 확인",
        "python3 manage.py showmigrations",
        "",
        "# 3. 마이그레이션 적용",
        "python3 manage.py migrate",
        "",
        "# 4. 특정 앱만 마이그레이션 (오류 시)",
        "python3 manage.py migrate contenttypes",
        "python3 manage.py migrate auth",
        "python3 manage.py migrate users",
        "python3 manage.py migrate projects",
        "python3 manage.py migrate feedbacks",
        "",
        "# 5. 강제 마이그레이션 (위험!)",
        "python3 manage.py migrate --fake-initial",
    ]
    
    for cmd in commands:
        print(cmd)

def create_ensure_migrations_command():
    """ensure_migrations 관리 명령어 생성"""
    print("\n\n📝 ensure_migrations 커맨드 생성:")
    print("-" * 50)
    
    # management/commands 디렉토리 생성
    for app in ['users', 'projects', 'feedbacks']:
        cmd_dir = Path(app) / 'management' / 'commands'
        if not cmd_dir.exists():
            cmd_dir.mkdir(parents=True, exist_ok=True)
            (cmd_dir.parent / '__init__.py').touch()
            (cmd_dir / '__init__.py').touch()
            print(f"✅ {app}/management/commands 디렉토리 생성됨")

def main():
    """메인 실행 함수"""
    # 1. 마이그레이션 디렉토리 검사
    migration_status = check_migration_directories()
    
    # 2. 마이그레이션 의존성 확인
    check_migration_dependencies()
    
    # 3. 권장 명령어 출력
    generate_migration_commands()
    
    # 4. ensure_migrations 커맨드 준비
    create_ensure_migrations_command()
    
    # 결과 요약
    print("\n\n📊 요약:")
    print("-" * 50)
    
    total_apps = len(migration_status)
    apps_with_migrations = sum(1 for app, status in migration_status.items() 
                              if status['exists'] and status['files'])
    apps_with_empty = sum(1 for app, status in migration_status.items() 
                         if status.get('empty_files'))
    
    print(f"총 앱 수: {total_apps}")
    print(f"마이그레이션이 있는 앱: {apps_with_migrations}")
    print(f"비어있는 마이그레이션 파일이 있는 앱: {apps_with_empty}")
    
    if apps_with_empty > 0:
        print("\n⚠️  비어있는 마이그레이션 파일을 삭제하거나 내용을 채워야 합니다.")
    
    print("\n✅ 점검 완료!")

if __name__ == "__main__":
    main()