from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection, DatabaseError
import time


class Command(BaseCommand):
    help = 'Ensure all migrations are applied with proper error handling'

    def handle(self, *args, **options):
        self.stdout.write("Checking database connection...")
        
        # 데이터베이스 연결 확인
        max_retries = 10
        for i in range(max_retries):
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS("Database connected!"))
                break
            except DatabaseError as e:
                self.stdout.write(f"Database connection attempt {i+1}/{max_retries} failed: {e}")
                if i < max_retries - 1:
                    time.sleep(3)
                else:
                    self.stdout.write(self.style.ERROR("Database connection failed!"))
                    return
        
        # 마이그레이션 상태 확인
        try:
            self.stdout.write("Checking migration status...")
            call_command('showmigrations', verbosity=2)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Error checking migrations: {e}"))
        
        # 마이그레이션 적용
        try:
            self.stdout.write("Applying migrations...")
            call_command('migrate', verbosity=2, interactive=False)
            self.stdout.write(self.style.SUCCESS("All migrations applied successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Migration error: {e}"))
            
            # 특정 앱별로 마이그레이션 시도
            apps_to_migrate = [
                'contenttypes', 'auth', 'sessions', 'admin',
                'users', 'projects', 'feedbacks', 'video_planning'
            ]
            
            for app in apps_to_migrate:
                try:
                    self.stdout.write(f"Trying to migrate {app}...")
                    call_command('migrate', app, verbosity=2, interactive=False)
                    self.stdout.write(self.style.SUCCESS(f"{app} migrated successfully"))
                except Exception as app_error:
                    self.stdout.write(self.style.WARNING(f"Failed to migrate {app}: {app_error}"))
        
        # 캐시 테이블 생성
        try:
            self.stdout.write("Creating cache table...")
            call_command('createcachetable')
            self.stdout.write(self.style.SUCCESS("Cache table created"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Cache table creation skipped: {e}"))
        
        # 최종 상태 확인
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """)
                tables = [row[0] for row in cursor.fetchall()]
                self.stdout.write(f"Database tables: {', '.join(tables)}")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Could not list tables: {e}"))