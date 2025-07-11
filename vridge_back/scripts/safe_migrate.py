#!/usr/bin/env python3
"""
안전한 마이그레이션 실행 스크립트
- 마이그레이션 전 백업
- 마이그레이션 시뮬레이션
- 롤백 지원
"""

import os
import sys
import subprocess
import datetime
import json
from pathlib import Path

# Django 프로젝트 루트 경로 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')

import django
django.setup()

from django.core.management import call_command
from django.db import connection
from django.conf import settings


class SafeMigration:
    def __init__(self):
        self.timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        self.backup_dir = Path('backups') / 'migrations'
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
    def check_pending_migrations(self):
        """적용되지 않은 마이그레이션 확인"""
        print("\n🔍 마이그레이션 상태 확인 중...")
        
        from django.core.management import call_command
        from io import StringIO
        
        out = StringIO()
        call_command('showmigrations', '--plan', stdout=out)
        output = out.getvalue()
        
        pending = []
        for line in output.split('\n'):
            if '[ ]' in line:
                pending.append(line.strip())
        
        if pending:
            print(f"\n⚠️  적용되지 않은 마이그레이션 {len(pending)}개:")
            for migration in pending[:10]:  # 처음 10개만 표시
                print(f"  - {migration}")
            if len(pending) > 10:
                print(f"  ... 외 {len(pending) - 10}개")
        else:
            print("✅ 모든 마이그레이션이 이미 적용되었습니다.")
        
        return pending
    
    def backup_database(self):
        """데이터베이스 백업"""
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            return self._backup_sqlite()
        elif 'postgresql' in settings.DATABASES['default']['ENGINE']:
            return self._backup_postgresql()
        else:
            print("⚠️  지원하지 않는 데이터베이스 엔진입니다.")
            return None
    
    def _backup_sqlite(self):
        """SQLite 백업"""
        print("\n💾 SQLite 데이터베이스 백업 중...")
        
        db_path = settings.DATABASES['default']['NAME']
        backup_path = self.backup_dir / f'db_backup_{self.timestamp}.sqlite3'
        
        try:
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"✅ 백업 완료: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"❌ 백업 실패: {e}")
            return None
    
    def _backup_postgresql(self):
        """PostgreSQL 백업"""
        print("\n💾 PostgreSQL 데이터베이스 백업 중...")
        
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            print("❌ DATABASE_URL이 설정되지 않았습니다.")
            return None
        
        backup_path = self.backup_dir / f'db_backup_{self.timestamp}.sql'
        
        try:
            # pg_dump 명령 실행
            cmd = f'pg_dump "{db_url}" > "{backup_path}"'
            subprocess.run(cmd, shell=True, check=True)
            
            # 압축
            subprocess.run(f'gzip "{backup_path}"', shell=True, check=True)
            backup_path = Path(str(backup_path) + '.gz')
            
            print(f"✅ 백업 완료: {backup_path}")
            return backup_path
        except subprocess.CalledProcessError as e:
            print(f"❌ 백업 실패: {e}")
            return None
    
    def simulate_migrations(self):
        """마이그레이션 시뮬레이션 (실제 적용하지 않음)"""
        print("\n🔬 마이그레이션 시뮬레이션...")
        
        try:
            # sqlmigrate로 SQL 확인
            from django.core.management import call_command
            from io import StringIO
            
            out = StringIO()
            call_command('showmigrations', '--plan', stdout=out)
            plan = out.getvalue()
            
            # 적용될 마이그레이션 추출
            pending_migrations = []
            for line in plan.split('\n'):
                if '[ ]' in line and ' ' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        app = parts[1].split('.')[0]
                        migration = parts[1].split('.')[-1]
                        pending_migrations.append((app, migration))
            
            if not pending_migrations:
                print("✅ 적용할 마이그레이션이 없습니다.")
                return True
            
            print(f"\n📋 다음 마이그레이션들이 적용될 예정입니다:")
            for app, migration in pending_migrations[:5]:  # 처음 5개만 표시
                print(f"  - {app}: {migration}")
                
                # SQL 미리보기
                try:
                    out = StringIO()
                    call_command('sqlmigrate', app, migration, stdout=out)
                    sql = out.getvalue()
                    if sql:
                        print(f"    SQL 미리보기 (첫 200자):")
                        print(f"    {sql[:200]}...")
                except Exception:
                    pass
            
            if len(pending_migrations) > 5:
                print(f"  ... 외 {len(pending_migrations) - 5}개")
            
            return True
            
        except Exception as e:
            print(f"❌ 시뮬레이션 실패: {e}")
            return False
    
    def apply_migrations(self, fake=False):
        """마이그레이션 적용"""
        print(f"\n🚀 마이그레이션 {'(fake)' if fake else ''} 적용 중...")
        
        try:
            if fake:
                call_command('migrate', '--fake')
            else:
                call_command('migrate')
            
            print("✅ 마이그레이션 적용 완료!")
            return True
            
        except Exception as e:
            print(f"❌ 마이그레이션 적용 실패: {e}")
            return False
    
    def verify_migrations(self):
        """마이그레이션 적용 확인"""
        print("\n🔍 마이그레이션 적용 확인 중...")
        
        pending = self.check_pending_migrations()
        
        if not pending:
            print("✅ 모든 마이그레이션이 성공적으로 적용되었습니다!")
            
            # 데이터베이스 상태 확인
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM django_migrations")
                    count = cursor.fetchone()[0]
                    print(f"✅ 총 {count}개의 마이그레이션이 기록되어 있습니다.")
            except Exception:
                pass
            
            return True
        else:
            print("❌ 아직 적용되지 않은 마이그레이션이 있습니다.")
            return False
    
    def rollback_to_backup(self, backup_path):
        """백업으로 롤백"""
        print(f"\n⏪ 백업으로 롤백 중: {backup_path}")
        
        if not backup_path or not Path(backup_path).exists():
            print("❌ 백업 파일을 찾을 수 없습니다.")
            return False
        
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            try:
                import shutil
                db_path = settings.DATABASES['default']['NAME']
                shutil.copy2(backup_path, db_path)
                print("✅ 롤백 완료!")
                return True
            except Exception as e:
                print(f"❌ 롤백 실패: {e}")
                return False
        else:
            print("⚠️  PostgreSQL 롤백은 수동으로 진행해야 합니다.")
            print(f"   psql $DATABASE_URL < {backup_path}")
            return False
    
    def run(self, skip_backup=False, fake=False, auto_yes=False):
        """안전한 마이그레이션 실행"""
        print("=" * 80)
        print("🛡️  VideoPlanet 안전한 마이그레이션")
        print("=" * 80)
        
        # 1. 현재 상태 확인
        pending = self.check_pending_migrations()
        if not pending:
            print("\n✅ 추가 마이그레이션이 필요하지 않습니다.")
            return True
        
        # 2. 백업
        backup_path = None
        if not skip_backup:
            backup_path = self.backup_database()
            if not backup_path and not auto_yes:
                response = input("\n⚠️  백업 없이 계속하시겠습니까? (y/N): ")
                if response.lower() != 'y':
                    print("❌ 마이그레이션 취소됨")
                    return False
        
        # 3. 시뮬레이션
        if not self.simulate_migrations():
            print("❌ 시뮬레이션 실패로 마이그레이션을 중단합니다.")
            return False
        
        # 4. 사용자 확인
        if not auto_yes:
            print("\n" + "=" * 80)
            print("⚠️  위의 마이그레이션을 적용하시겠습니까?")
            print("   이 작업은 데이터베이스를 변경합니다.")
            if backup_path:
                print(f"   백업 위치: {backup_path}")
            print("=" * 80)
            
            response = input("계속하시겠습니까? (y/N): ")
            if response.lower() != 'y':
                print("❌ 마이그레이션 취소됨")
                return False
        
        # 5. 마이그레이션 적용
        if not self.apply_migrations(fake=fake):
            print("\n❌ 마이그레이션 실패!")
            if backup_path:
                print("💡 다음 명령으로 롤백할 수 있습니다:")
                print(f"   python manage.py dbbackup --restore --input-path={backup_path}")
            return False
        
        # 6. 검증
        if not self.verify_migrations():
            print("\n⚠️  마이그레이션 후 검증 실패")
            return False
        
        print("\n✅ 안전한 마이그레이션 완료!")
        return True


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='안전한 Django 마이그레이션')
    parser.add_argument('--skip-backup', action='store_true', 
                       help='백업 단계 건너뛰기 (위험!)')
    parser.add_argument('--fake', action='store_true',
                       help='실제 SQL 실행 없이 마이그레이션 기록만 추가')
    parser.add_argument('--yes', '-y', action='store_true',
                       help='모든 확인 질문에 자동으로 yes')
    
    args = parser.parse_args()
    
    migration = SafeMigration()
    success = migration.run(
        skip_backup=args.skip_backup,
        fake=args.fake,
        auto_yes=args.yes
    )
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()