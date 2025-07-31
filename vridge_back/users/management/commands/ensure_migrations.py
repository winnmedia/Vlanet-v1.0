"""
Django 관리 명령어: ensure_migrations
모든 마이그레이션을 안전하게 실행합니다.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection

class Command(BaseCommand):
    help = '모든 마이그레이션을 안전하게 실행합니다'

    def handle(self, *args, **options):
        self.stdout.write('🚀 마이그레이션 시작...')
        
        # 마이그레이션 순서
        apps_order = [
            'contenttypes',
            'auth', 
            'users',
            'projects',
            'feedbacks',
            'video_planning',
            'video_analysis',
            'admin',
            'sessions',
        ]
        
        # 각 앱별로 마이그레이션 실행
        for app in apps_order:
            try:
                self.stdout.write(f'🔄 {app} 마이그레이션 중...')
                call_command('migrate', app, verbosity=0)
                self.stdout.write(self.style.SUCCESS(f'✅ {app} 완료'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'⚠️  {app} 실패: {e}'))
                continue
        
        # 전체 마이그레이션
        try:
            self.stdout.write('🔄 전체 마이그레이션 실행...')
            call_command('migrate', verbosity=0)
            self.stdout.write(self.style.SUCCESS('✅ 전체 마이그레이션 완료'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  전체 마이그레이션 실패: {e}'))
        
        # 테이블 검증
        self.verify_tables()
        
    def verify_tables(self):
        """핵심 테이블 확인"""
        self.stdout.write('\n🔍 핵심 테이블 확인:')
        
        critical_tables = [
            'django_migrations',
            'auth_user',
            'users_user',
            'projects_project',
            'feedbacks_feedback',
        ]
        
        with connection.cursor() as cursor:
            for table in critical_tables:
                try:
                    cursor.execute(f"SELECT 1 FROM {table} LIMIT 1")
                    self.stdout.write(f'   ✅ {table}')
                except:
                    self.stdout.write(self.style.ERROR(f'   ❌ {table}'))
        
        self.stdout.write(self.style.SUCCESS('\n🎉 마이그레이션 프로세스 완료!'))